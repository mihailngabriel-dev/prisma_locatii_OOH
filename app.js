let currentFilter='all';
let query='';
let selected=new Set(JSON.parse(localStorage.getItem('prismaSelected')||'[]'));
const grid=document.getElementById('locationGrid');
const count=document.getElementById('selectionCount');
const drawer=document.getElementById('drawer'), drawerBackdrop=document.getElementById('drawerBackdrop');
const modal=document.getElementById('detailModal'), modalBackdrop=document.getElementById('modalBackdrop');
const eur=n=>new Intl.NumberFormat('ro-RO',{maximumFractionDigits:2}).format(n)+' EUR';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function groups(){return [...new Set(locations.map(x=>x.group))]}
function renderFilters(){
 const box=document.getElementById('filters');
 box.innerHTML=[['all','Toate'],...groups().map(g=>[g,g])].map(([v,l])=>`<button class="filter ${currentFilter===v?'active':''}" data-filter="${esc(v)}">${esc(l)}</button>`).join('');
 box.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;renderFilters();renderCards()}));
}
function filtered(){
 const q=query.toLowerCase().trim();
 return locations.filter(x=>(currentFilter==='all'||x.group===currentFilter)&&(!q||[x.name,x.area,x.address,x.meta1,x.meta2].join(' ').toLowerCase().includes(q)));
}
function renderCards(){
 const items=filtered();
 document.getElementById('inventoryCount').textContent=`${items.length} ${items.length===1?'locație':'locații'}`;
 grid.innerHTML=items.length?items.map(x=>`<article class="card group-${x.group.toLowerCase().replace(/[^a-z0-9]+/g,'-')}">
  <div class="card-media"><img loading="lazy" src="${x.image}" alt="${esc(x.name)}"><span class="area-tag">${esc(x.area)}</span></div>
  <div class="card-body"><div class="card-title-row"><h3>${esc(x.name)}</h3><div class="price">${esc(x.priceLabel)}</div></div>
  <div class="meta"><div><span>${esc(x.meta1Label)}</span><strong>${esc(x.meta1)}</strong></div><div><span>${esc(x.meta2Label)}</span><strong>${esc(x.meta2)}</strong></div></div>
  <div class="address">${esc(x.address)}</div>
  <div class="card-actions"><button class="ghost" onclick="openDetails('${x.id}')">Detalii</button><button class="primary ${selected.has(x.id)?'selected':''}" onclick="toggleSelect('${x.id}')">${selected.has(x.id)?'✓ Selectat':'Adaugă în ofertă'}</button></div></div></article>`).join(''):'<div class="no-results">Nu am găsit locații pentru filtrul selectat.</div>';
 updateCount(false);
}
function updateCount(rerenderSelection=true){count.textContent=selected.size;localStorage.setItem('prismaSelected',JSON.stringify([...selected]));if(rerenderSelection)renderSelection()}
function toggleSelect(id){selected.has(id)?selected.delete(id):selected.add(id);renderCards();renderSelection()}
function openDetails(id){
 const x=locations.find(l=>l.id===id); if(!x)return;
 const rows=[[x.meta1Label,x.meta1],[x.meta2Label,x.meta2],['Adresă / zonă',x.address],['Expunere',x.exposure],...(x.details||[])];
 document.getElementById('modalContent').innerHTML=`<div class="detail-grid"><img src="${x.image}" alt="${esc(x.name)}"><div class="detail-copy"><span class="eyebrow">${esc(x.area)}</span><h2>${esc(x.name)}</h2><div class="detail-price">${esc(x.priceLabel)}</div><div class="detail-table">${rows.map(r=>`<div class="detail-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong></div>`).join('')}</div><p class="detail-note">Tarifele și disponibilitatea se confirmă la rezervare.</p><button class="primary full" onclick="toggleSelect('${x.id}');openDetails('${x.id}')">${selected.has(x.id)?'✓ Locație selectată':'Adaugă în ofertă'}</button></div></div>`;
 modal.classList.add('open');modalBackdrop.classList.add('open');
}
function closeModal(){modal.classList.remove('open');modalBackdrop.classList.remove('open')}
function openDrawer(){drawer.classList.add('open');drawerBackdrop.classList.add('open');renderSelection()}
function closeDrawer(){drawer.classList.remove('open');drawerBackdrop.classList.remove('open')}
function renderSelection(){
 const items=locations.filter(x=>selected.has(x.id)); const box=document.getElementById('selectedList');
 box.innerHTML=items.length?items.map(x=>`<div class="sel-item"><img src="${x.image}"><div><strong>${esc(x.name)}</strong><span>${esc(x.priceLabel)}</span></div><button class="remove" onclick="toggleSelect('${x.id}')">×</button></div>`).join(''):'<div class="empty">Nu ai selectat încă nicio locație.</div>';
 const monthly=items.filter(x=>x.totalEligible!==false).reduce((s,x)=>s+(Number(x.price)||0),0);
 const excluded=items.filter(x=>x.totalEligible===false).length;
 document.getElementById('offerTotal').textContent=eur(monthly);
 document.getElementById('totalHint').textContent=excluded?`+ ${excluded} tarif(e) de catalog afișate separat`:'';
}
function offerPrint(){
 const items=locations.filter(x=>selected.has(x.id)); if(!items.length){alert('Selectează cel puțin o locație.');return}
 const client=document.getElementById('clientName').value.trim()||'Client'; const campaign=document.getElementById('campaignName').value.trim()||'Campanie OOH';
 const monthly=items.filter(x=>x.totalEligible!==false).reduce((s,x)=>s+(Number(x.price)||0),0);
 const rows=items.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.name)}</b><br><small>${esc(x.area)} · ${esc(x.address)}</small></td><td>${esc(x.meta1)}</td><td>${esc(x.priceLabel)}</td></tr>`).join('');
 const w=window.open('','_blank');
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Oferta Prisma - ${esc(client)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111936;margin:0}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3d147f;padding-bottom:14px}.logo{font-size:29px;font-weight:900;color:#3d147f}.logo small{display:block;font-size:11px;letter-spacing:4px}.meta{text-align:right;font-size:11px;color:#687086}.meta b{color:#111936}.title{margin:26px 0 12px}.title h1{font-size:25px;margin:0 0 7px}.title p{color:#687086;margin:0;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:10px}th{text-align:left;background:#f0ebf8;color:#3d147f;padding:8px;border-bottom:1px solid #d8d0e6}td{padding:9px 8px;border-bottom:1px solid #e9e5f0;vertical-align:top}small{color:#687086}.total{margin-top:18px;display:flex;justify-content:flex-end}.total div{background:#3d147f;color:white;border-radius:10px;padding:12px 15px;min-width:245px;display:flex;justify-content:space-between;gap:25px}.note{margin-top:20px;font-size:9px;color:#687086;line-height:1.45}.footer{margin-top:25px;font-size:10px;color:#687086;border-top:1px solid #e7e4ef;padding-top:8px;display:flex;justify-content:space-between}</style></head><body><div class="head"><div class="logo">PRISMA<small>ADVERTISING</small></div><div class="meta">OFERTĂ OOH<br><b>${new Date().toLocaleDateString('ro-RO')}</b></div></div><div class="title"><h1>${esc(campaign)}</h1><p>Client: <b>${esc(client)}</b> · ${items.length} poziții selectate</p></div><table><thead><tr><th>#</th><th>Locație</th><th>Dimensiuni</th><th>Tarif</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><div><span>Subtotal tarife lunare</span><b>${eur(monthly)}</b></div></div><div class="note">Tarifele și condițiile se reconfirmă înainte de comandă. Unele formate au tarif pe bucată, pachet sau tarif de catalog fără perioadă explicită; acestea sunt afișate individual și nu sunt incluse în subtotalul lunar dacă perioada nu este explicită. TVA, producția, decorarea, montajul, neutralizarea și alte taxe se aplică conform fișei fiecărei locații.</div><div class="footer"><span>PRISMA ADVERTISING</span><span>0763 504 228</span></div><script>setTimeout(()=>window.print(),500)<\/script></body></html>`);w.document.close();
}
document.getElementById('searchInput').addEventListener('input',e=>{query=e.target.value;renderCards()});
document.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.querySelector(b.dataset.scroll).scrollIntoView()));
document.getElementById('selectionBtn').onclick=openDrawer;document.getElementById('closeDrawer').onclick=closeDrawer;drawerBackdrop.onclick=closeDrawer;document.getElementById('modalClose').onclick=closeModal;modalBackdrop.onclick=closeModal;document.getElementById('clearSelection').onclick=()=>{selected.clear();renderCards();renderSelection()};document.getElementById('generatePdf').onclick=offerPrint;
window.toggleSelect=toggleSelect;window.openDetails=openDetails;
document.getElementById('totalLocations').textContent=locations.length;
renderFilters();renderCards();renderSelection();
