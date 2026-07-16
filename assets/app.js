const sidebarItems = [
  { label: '首頁', icon: '🏠', href: 'index.html', className: 'home-link' },
  { title: '客服內部', icon: '👥', id: 'serviceGroupTitle', items: [
    { label: '人員管理', icon: '👤', href: 'service/staff.html' },
    { label: '休假表', icon: '🌴', href: 'service/leave.html' },
    { label: '排程表', icon: '📅', href: 'service/schedule.html' }
  ] },
  { title: '作業管理', icon: '🗂️', id: 'workGroupTitle', items: [
    { label: '日誌', icon: '📒', href: 'work/log.html' },
    { label: 'PROD告警紀錄', icon: '🚨', href: 'work/alert.html' }
  ] },
  { title: '會議歷程', icon: '📁', id: 'meetingGroupTitle', items: [
    { label: '會議紀錄', icon: '📝', href: 'meeting/meeting.html' }
  ] },
  { title: '資料庫', icon: '🧠', id: 'resourceGroupTitle', items: [
    { label: '知識庫', icon: '📚', href: 'resource/knowledge.html' },
    { label: 'AI 資料庫', icon: '🤖', href: 'resource/ai-database.html' }
  ] }
];
const PAGE_KEYS = { index:'home', staff:'staff', leave:'leave', schedule:'schedule', meeting:'meeting', log:'log', alert:'alert', knowledge:'knowledge', 'ai-database':'aiDatabase' };
const MENU_ICON_MAP = { '首頁':'🏠','人員管理':'👤','休假表':'🌴','排程表':'📅','日誌':'📒','PROD告警紀錄':'🚨','會議紀錄':'📝','知識庫':'📚','AI 資料庫':'🤖' };
function basePath(){return location.pathname.includes('/service/')||location.pathname.includes('/work/')||location.pathname.includes('/meeting/')||location.pathname.includes('/resource/')?'../':'./'}
function renderLayout(title){document.body.insertAdjacentHTML('afterbegin',`<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="logo">OP</div><h1>New CSR Support</h1></div><nav id="nav" class="nav"></nav></aside><main class="main"><div class="topbar"><strong>${title}</strong><span class="user-pill">● 離線模式（localStorage）</span></div><section id="content" class="content"></section></main></div><div id="modalRoot"></div><div id="toast" class="toast hidden"></div>`);renderSidebar();}
function renderSidebar(){const root=basePath();nav.innerHTML=sidebarItems.map(item=>item.items?`<div class="nav-title">${item.icon} ${item.title}</div>${item.items.map(i=>link(i,root)).join('')}`:link(item,root)).join('');}
function link(i,root){const href=root+i.href;const active=location.pathname.endsWith(i.href);return `<a class="${active?'active':''} ${i.className||''}" href="${href}">${i.icon}<span>${i.label}</span></a>`;}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2500)}
function openModal(title,body,onSave){modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal"><header><h3>${title}</h3><button class="btn secondary" onclick="closeModal()">關閉</button></header><div class="body">${body}</div><footer>${onSave?'<button id="saveModal" class="btn">儲存</button>':''}</footer></div></div>`;if(onSave)saveModal.onclick=()=>onSave(modalRoot.querySelector('.modal'))}
function closeModal(){modalRoot.innerHTML=''}
