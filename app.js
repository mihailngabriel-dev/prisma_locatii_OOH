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
  <div class="card-actions"><button class="ghost" onclick="openDetails('${x.id}')">Detalii</button><button class="primary ${selected.has(x.id)?'selected':''}" onclick="toggleSelect('${x.id}')">${selected.has(x.id)?'✓ Selectat':'Adaugă în selecție'}</button></div></div></article>`).join(''):'<div class="no-results">Nu am găsit locații pentru filtrul selectat.</div>';
 updateCount(false);
}
function updateCount(rerenderSelection=true){count.textContent=selected.size;localStorage.setItem('prismaSelected',JSON.stringify([...selected]));if(rerenderSelection)renderSelection()}
function toggleSelect(id){selected.has(id)?selected.delete(id):selected.add(id);renderCards();renderSelection()}
function openDetails(id){
 const x=locations.find(l=>l.id===id); if(!x)return;
 const rows=[[x.meta1Label,x.meta1],[x.meta2Label,x.meta2],['Adresă / zonă',x.address],['Expunere',x.exposure],...(x.details||[])];
 document.getElementById('modalContent').innerHTML=`<div class="detail-grid"><img src="${x.image}" alt="${esc(x.name)}"><div class="detail-copy"><span class="eyebrow">${esc(x.area)}</span><h2>${esc(x.name)}</h2><div class="detail-price">${esc(x.priceLabel)}</div><div class="detail-table">${rows.map(r=>`<div class="detail-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong></div>`).join('')}</div><p class="detail-note">Tarifele și disponibilitatea se confirmă la rezervare.</p><button class="primary full" onclick="toggleSelect('${x.id}');openDetails('${x.id}')">${selected.has(x.id)?'✓ Locație selectată':'Adaugă în selecție'}</button></div></div>`;
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
function buildRequestMessage(){
 const items=locations.filter(x=>selected.has(x.id));
 if(!items.length){alert('Selectează cel puțin o locație.');return null}
 const client=document.getElementById('clientName').value.trim();
 const campaign=document.getElementById('campaignName').value.trim();
 const contact=document.getElementById('clientContact').value.trim();
 const monthly=items.filter(x=>x.totalEligible!==false).reduce((s,x)=>s+(Number(x.price)||0),0);
 const lines=items.map((x,i)=>`${i+1}. ${x.name} | ${x.area} | ${x.priceLabel}`);
 return [
  'Bună ziua, doresc o ofertă pentru următoarele locații Prisma Advertising:',
  '',
  ...lines,
  '',
  `Subtotal orientativ tarife lunare: ${eur(monthly)}`,
  client?`Nume / companie: ${client}`:'',
  campaign?`Campanie / perioadă: ${campaign}`:'',
  contact?`Contact: ${contact}`:'',
  '',
  'Vă rog să îmi confirmați disponibilitatea și oferta comercială finală.'
 ].filter(Boolean).join('\n');
}
function requestWhatsapp(){
 const message=buildRequestMessage(); if(!message)return;
 window.open(`https://wa.me/40763504228?text=${encodeURIComponent(message)}`,'_blank','noopener');
}
function requestEmail(){
 const message=buildRequestMessage(); if(!message)return;
 const client=document.getElementById('clientName').value.trim();
 const subject=`Cerere ofertă OOH Prisma${client?' - '+client:''}`;
 window.location.href=`mailto:mihail.n.gabriel@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
document.getElementById('searchInput').addEventListener('input',e=>{query=e.target.value;renderCards()});
document.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.querySelector(b.dataset.scroll).scrollIntoView()));
document.getElementById('selectionBtn').onclick=openDrawer;document.getElementById('closeDrawer').onclick=closeDrawer;drawerBackdrop.onclick=closeDrawer;document.getElementById('modalClose').onclick=closeModal;modalBackdrop.onclick=closeModal;document.getElementById('clearSelection').onclick=()=>{selected.clear();renderCards();renderSelection()};document.getElementById('requestWhatsapp').onclick=requestWhatsapp;document.getElementById('requestEmail').onclick=requestEmail;
window.toggleSelect=toggleSelect;window.openDetails=openDetails;
document.getElementById('totalLocations').textContent=locations.length;
renderFilters();renderCards();renderSelection();
