
const STORAGE_KEY = 'ricardo_carol_items_v3';
const HISTORY_KEY = 'ricardo_carol_history_v3';
const THEME_KEY = 'ricardo_carol_theme_v3';
const CURRENT_PAGE = document.body.dataset.page || 'dashboard';

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function esc(t){ return String(t ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

function getUser(){ return sessionStorage.getItem('user') || ''; }
function requireLogin(){
  const user = getUser();
  if(!user){ window.location.href = 'login.html'; return false; }
  return true;
}
function logout(){
  sessionStorage.removeItem('user');
  window.location.href = 'login.html';
}

function loadItems(){
  try{
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function saveItems(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

function loadHistory(){
  try{
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function saveHistory(history){ localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }

function seedItemsIfEmpty(){
  return;
}

function applyTheme(){
  document.body.classList.remove('light');
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.remove());
}
function toggleTheme(){
  document.body.classList.remove('light');
}

function initials(name){
  const clean = (name || '?').trim();
  return clean ? clean.charAt(0).toUpperCase() : '?';
}

function fillShell(pageTitle, pageSub){
  const user = getUser();
  const userNameEls = document.querySelectorAll('[data-user-name]');
  userNameEls.forEach(el => el.textContent = user || 'Utilizador');
  document.querySelectorAll('[data-user-initial]').forEach(el => el.textContent = initials(user));
  document.querySelectorAll('[data-page-title]').forEach(el => el.textContent = pageTitle);
  document.querySelectorAll('[data-page-sub]').forEach(el => el.textContent = pageSub);
  document.querySelectorAll('[data-nav]').forEach(link => {
    const page = link.getAttribute('data-nav');
    link.classList.toggle('active', page === CURRENT_PAGE);
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', toggleTheme));
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', logout));
  applyTheme();
}

function priorityClass(priority){
  return priority === 'Alta' ? 'high' : priority === 'Normal' ? 'normal' : 'low';
}

function renderStats(targetId){
  const root = document.getElementById(targetId);
  if(!root) return;
  const items = loadItems();
  const total = items.length;
  const done = items.filter(i => i.done).length;
  const pending = total - done;
  const stores = new Set(items.map(i => i.store).filter(Boolean)).size;
  root.innerHTML = `
    <div class="stat-card"><span>Total</span><strong>${total}</strong></div>
    <div class="stat-card"><span>Comprados</span><strong>${done}</strong></div>
    <div class="stat-card"><span>Faltam</span><strong>${pending}</strong></div>
    <div class="stat-card"><span>Lojas</span><strong>${stores}</strong></div>
  `;
}

function renderRecentList(targetId, limit=4){
  const root = document.getElementById(targetId);
  if(!root) return;
  let items = [...loadItems()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, limit);
  if(!items.length){
    root.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><h4>Sem itens</h4><p>Adiciona o primeiro produto para começar.</p></div>`;
    return;
  }
  root.innerHTML = items.map(item => `
    <article class="item-card ${item.done ? 'done' : ''}">
      <button class="check-btn" onclick="toggleDone('${item.id}')"></button>
      <div class="item-main">
        <div class="item-title-row">
          <div class="item-title">${esc(item.name)}</div>
          <span class="pill store">${esc(item.store)}</span>
          <span class="pill ${priorityClass(item.priority)}">${esc(item.priority)}</span>
        </div>
        <div class="item-meta">
          <span>Qtd: ${item.qty}</span>
          <span>${esc(item.category)}</span>
          <span>Criado por ${esc(item.createdBy || '-')}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="mini-btn delete" onclick="removeItem('${item.id}')">🗑</button>
      </div>
    </article>
  `).join('');
}

function addItemFromForm(){
  const name = document.getElementById('itemInput')?.value.trim();
  const qty = Math.max(1, Number(document.getElementById('qtyInput')?.value || 1));
  const category = document.getElementById('categoryInput')?.value || 'Outros';
  const store = document.getElementById('storeInput')?.value || 'Outra';
  const priority = document.getElementById('priorityInput')?.value || 'Normal';
  const notes = document.getElementById('notesInput')?.value.trim() || '';
  if(!name){
    document.getElementById('itemInput')?.focus();
    return;
  }
  const items = loadItems();
  items.unshift({
    id: uid(),
    name, qty, category, store, priority, notes,
    done: false,
    createdAt: new Date().toISOString(),
    createdBy: getUser() || 'Utilizador'
  });
  saveItems(items);
  ['itemInput','qtyInput','notesInput'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    if(id === 'qtyInput') el.value = 1;
    else el.value = '';
  });
  ['categoryInput','storeInput','priorityInput'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if(!el) return;
    if(id === 'categoryInput') el.value = 'Supermercado';
    if(id === 'storeInput') el.value = 'Continente';
    if(id === 'priorityInput') el.value = 'Normal';
  });
  renderStats('statsGrid');
  renderListPage();
  const toast = document.getElementById('formToast');
  if(toast){
    toast.textContent = 'Produto adicionado com sucesso.';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 1800);
  }
}

function removeItem(id){
  const items = loadItems().filter(item => item.id !== id);
  saveItems(items);
  renderStats('statsGrid');
  renderListPage();
  renderRecentList('recentList');
}

function toggleDone(id){
  const items = loadItems();
  const history = loadHistory();
  const index = items.findIndex(item => item.id === id);
  if(index === -1) return;
  items[index].done = !items[index].done;
  if(items[index].done){
    history.unshift({
      id: uid(),
      originalId: items[index].id,
      name: items[index].name,
      qty: items[index].qty,
      category: items[index].category,
      store: items[index].store,
      priority: items[index].priority,
      notes: items[index].notes,
      completedAt: new Date().toISOString(),
      completedBy: getUser() || 'Utilizador'
    });
    saveHistory(history);
  }else{
    saveHistory(history.filter(h => h.originalId !== id));
  }
  saveItems(items);
  renderStats('statsGrid');
  renderListPage();
  renderHistoryPage();
  renderRecentList('recentList');
}

function clearDone(){
  const pending = loadItems().filter(item => !item.done);
  saveItems(pending);
  renderStats('statsGrid');
  renderListPage();
  renderRecentList('recentList');
}

function clearAll(){
  saveItems([]);
  saveHistory([]);
  renderStats('statsGrid');
  renderListPage();
  renderHistoryPage();
  renderRecentList('recentList');
}

function sortItems(list){
  const order = {Alta:0, Normal:1, Baixa:2};
  return [...list].sort((a,b)=>{
    if(a.done !== b.done) return a.done - b.done;
    if(order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function renderListPage(){
  const root = document.getElementById('shoppingList');
  if(!root) return;
  const filterStore = document.getElementById('filterStore')?.value || '';
  const filterCategory = document.getElementById('filterCategory')?.value || '';
  const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const mode = document.getElementById('showMode')?.value || 'all';

  let list = loadItems().filter(item => {
    if(filterStore && item.store !== filterStore) return false;
    if(filterCategory && item.category !== filterCategory) return false;
    if(search && !`${item.name} ${item.notes} ${item.category} ${item.store}`.toLowerCase().includes(search)) return false;
    if(mode === 'pending' && item.done) return false;
    if(mode === 'done' && !item.done) return false;
    return true;
  });

  list = sortItems(list);

  const count = document.getElementById('visibleCount');
  const selected = document.getElementById('selectedStoreText');
  if(count) count.textContent = `${list.length} ${list.length === 1 ? 'item' : 'itens'}`;
  if(selected) selected.textContent = filterStore ? `Loja destacada: ${filterStore}` : 'Sem loja selecionada.';
  if(!list.length){
    root.innerHTML = `<div class="empty-state"><div class="empty-icon">🧺</div><h4>Sem resultados</h4><p>Não há itens para os filtros escolhidos.</p></div>`;
    return;
  }

  root.innerHTML = list.map(item => `
    <article class="item-card ${item.done ? 'done' : ''} ${filterStore && item.store === filterStore ? 'highlight' : ''}">
      <button class="check-btn" onclick="toggleDone('${item.id}')"></button>
      <div class="item-main">
        <div class="item-title-row">
          <div class="item-title">${esc(item.name)}</div>
          <span class="pill store">${esc(item.store)}</span>
          <span class="pill ${priorityClass(item.priority)}">${esc(item.priority)}</span>
        </div>
        <div class="item-meta">
          <span>Qtd: ${item.qty}</span>
          <span>${esc(item.category)}</span>
          <span>${item.done ? 'Comprado' : 'Por comprar'}</span>
          <span>Por ${esc(item.createdBy || '-')}</span>
        </div>
        ${item.notes ? `<div class="item-notes">${esc(item.notes)}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="mini-btn" onclick="toggleDone('${item.id}')">${item.done ? '↺' : '✓'}</button>
        <button class="mini-btn delete" onclick="removeItem('${item.id}')">🗑</button>
      </div>
    </article>
  `).join('');
}

function renderHistoryPage(){
  const root = document.getElementById('historyList');
  if(!root) return;
  const history = loadHistory();
  if(!history.length){
    root.innerHTML = `<div class="empty-state"><div class="empty-icon">📜</div><h4>Sem histórico</h4><p>Os produtos comprados vão aparecer aqui.</p></div>`;
    return;
  }
  const groups = {};
  history.forEach(item => {
    const day = new Date(item.completedAt).toLocaleDateString('pt-PT');
    if(!groups[day]) groups[day] = [];
    groups[day].push(item);
  });
  root.innerHTML = Object.entries(groups).map(([day, items]) => `
    <section class="history-day">
      <h4>${day}</h4>
      <div class="history-list">
        ${items.map(item => `
          <article class="item-card done">
            <button class="check-btn"></button>
            <div class="item-main">
              <div class="item-title-row">
                <div class="item-title">${esc(item.name)}</div>
                <span class="pill store">${esc(item.store)}</span>
                <span class="pill ${priorityClass(item.priority)}">${esc(item.priority)}</span>
              </div>
              <div class="history-meta">
                <span>Qtd: ${item.qty}</span>
                <span>${esc(item.category)}</span>
                <span>Comprado por ${esc(item.completedBy || '-')}</span>
              </div>
              ${item.notes ? `<div class="item-notes">${esc(item.notes)}</div>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
      <div class="history-total">${items.length} ${items.length === 1 ? 'compra' : 'compras'} neste dia</div>
    </section>
  `).join('');
}

function bindListFilters(){
  ['filterStore','filterCategory','searchInput','showMode'].forEach(id => {
    const el = document.getElementById(id);
    if(el){
      const evt = id === 'searchInput' ? 'input' : 'change';
      el.addEventListener(evt, renderListPage);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.body.dataset.requiresLogin === 'true'){
    if(!requireLogin()) return;
    seedItemsIfEmpty();
  }
});
