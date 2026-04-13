
const STORAGE_KEY = 'shopping_list_multi_v2';
const THEME_KEY = 'shopping_list_theme_v2';
const HISTORY_KEY = 'shopping_history_multi_v2';

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function getItems(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch(e){}
  const demo = [
    {id:uid(),name:'Leite',qty:2,category:'Supermercado',store:'Continente',priority:'Alta',notes:'Sem lactose',done:false,createdAt:new Date().toISOString()},
    {id:uid(),name:'Pão',qty:1,category:'Padaria',store:'Pingo Doce',priority:'Normal',notes:'Integral',done:false,createdAt:new Date().toISOString()},
    {id:uid(),name:'Detergente',qty:1,category:'Casa',store:'Lidl',priority:'Baixa',notes:'',done:true,createdAt:new Date().toISOString(),doneAt:new Date().toISOString()}
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  syncHistoryFromItems(demo);
  return demo;
}
function saveItems(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); syncHistoryFromItems(items); }
function syncHistoryFromItems(items){
  const history = items.filter(i => i.done).map(i => ({id:i.id,name:i.name,qty:i.qty,category:i.category,store:i.store,priority:i.priority,notes:i.notes||'',doneAt:i.doneAt || i.createdAt || new Date().toISOString()}));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
function getHistory(){ try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch(e){ return []; } }
function getUser(){ return sessionStorage.getItem('user'); }
function requireUser(){ if(!getUser()) window.location.href='login.html'; }
function logout(){ sessionStorage.removeItem('user'); window.location.href='login.html'; }
function applyTheme(){
  const theme = localStorage.getItem(THEME_KEY) || 'dark';
  document.body.classList.toggle('light', theme === 'light');
  const btn = document.getElementById('themeToggle');
  if(btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}
function toggleTheme(){ const current = localStorage.getItem(THEME_KEY) || 'dark'; localStorage.setItem(THEME_KEY, current === 'dark' ? 'light' : 'dark'); applyTheme(); }
function setUserBadge(){
  const holder = document.getElementById('userBadge');
  if(holder){ holder.textContent = '👤 ' + (getUser() || 'Convidado'); }
}
function setNavActive(page){
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.page === page));
}
function attachGlobalUI(page){
  requireUser();
  applyTheme();
  setUserBadge();
  setNavActive(page);
  const t = document.getElementById('themeToggle'); if(t) t.addEventListener('click', toggleTheme);
  const l = document.getElementById('logoutBtn'); if(l) l.addEventListener('click', logout);
}
function escapeHtml(text){ return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function stats(items){ const total = items.length, done = items.filter(i => i.done).length; return { total, done, pending: total - done }; }
function formatDate(iso){ try { return new Date(iso).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); } catch(e){ return ''; } }
function addItem(data){ const items = getItems(); items.unshift({ id:uid(), createdAt:new Date().toISOString(), done:false, ...data }); saveItems(items); return items; }
function toggleDone(id){ const items = getItems().map(item => item.id===id ? { ...item, done: !item.done, doneAt: !item.done ? new Date().toISOString() : null } : item); saveItems(items); return items; }
function removeItem(id){ const items = getItems().filter(item => item.id !== id); saveItems(items); return items; }
function clearDone(){ const items = getItems().filter(item => !item.done); saveItems(items); return items; }
function clearAll(){ const items = []; saveItems(items); return items; }
function installApp(){ alert('No iPhone: abre no Safari e escolhe "Adicionar ao ecrã principal".'); }
