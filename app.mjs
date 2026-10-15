import {TABLE,templates,reserve,defaultState,analyze,moveItem,rotateItem,addItem,removeItem,updateItem,number,validateState,saveState,loadState} from './core.mjs';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:1});
let state,loadFailed=false;
try{state=loadState(localStorage);}catch{state=defaultState();loadFailed=true;}
let selected='rack-v',drag=null,toastTimer;
const icon=kind=>kind==='case'?'▱':kind==='custom'?'▧':'▤';
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function persist(){try{saveState(localStorage,state);$('saveStatus').textContent='Im Browser gespeichert';}catch{$('saveStatus').textContent='Speichern nicht möglich · bitte exportieren';}}
function positionElement(el,i){el.style.left=`${i.x/TABLE.w*100}%`;el.style.top=`${i.y/TABLE.d*100}%`;el.style.width=`${i.w/TABLE.w*100}%`;el.style.height=`${i.d/TABLE.d*100}%`;}
function renderBoard(a){
  $('workArea').hidden=!state.workArea;
  const conflictIds=new Set([...a.collisions.flat(),...a.outside,...a.blocked]);
  $('elements').innerHTML=state.items.map(i=>`<button class="element ${i.kind} ${selected===i.id?'selected':''} ${conflictIds.has(i.id)?'conflict':''}" data-element="${escape(i.id)}" aria-pressed="${selected===i.id}" aria-label="${escape(i.name)}, ${fmt(i.w)} mal ${fmt(i.d)} cm, Position ${fmt(i.x)}, ${fmt(i.y)} cm. Mit Pfeiltasten verschieben, R dreht." title="${escape(i.name)} · ${fmt(i.w)} × ${fmt(i.d)} cm"><span class="bottle-pattern" aria-hidden="true">${'<i></i>'.repeat(8)}</span><span class="element-icon" aria-hidden="true">${icon(i.kind)}</span><strong>${escape(i.name)}</strong><small>${fmt(i.w)} × ${fmt(i.d)} cm</small></button>`).join('');
  $('elements').querySelectorAll('[data-element]').forEach(el=>positionElement(el,state.items.find(i=>i.id===el.dataset.element)));
}
function renderInspector(){
  const i=state.items.find(i=>i.id===selected);
  if(!i){$('inspector').innerHTML='<div class="empty-inspector"><span aria-hidden="true">↖</span><h2>Dein Element im Detail</h2><p>Wähle ein Element auf dem Tisch oder in der Vergleichsliste.</p></div>';return;}
  const field=(key,label,max,min=0)=>`<label>${label}<input type="number" data-field="${key}" value="${i[key]}" min="${min}" max="${max}" step="${key.startsWith('cap')?1:.5}"></label>`;
  $('inspector').innerHTML=`<div class="inspector-heading"><span class="inspector-icon" aria-hidden="true">${icon(i.kind)}</span><div><h2>Element bearbeiten</h2><span>Maße & Plätze anpassen</span></div></div><label>Name<input type="text" data-field="name" value="${escape(i.name)}" maxlength="60"></label><div class="field-grid">${field('w','Breite',180,1)}${field('d','Tiefe',180,1)}${field('h','Höhe',150,1)}</div><div class="field-grid two">${field('x','Von links',180)}${field('y','Von hinten',90)}</div><p class="divider-label">KAPAZITÄT · FESTE PLÄTZE</p><div class="field-grid two">${field('capV','Vallejo',2000)}${field('capC','Citadel',2000)}</div><p class="inspector-help">Stellfläche inklusive benötigter Öffnungsfläche angeben. Höhe mit der Dachschräge abgleichen; sie wird im Plan nicht geprüft.</p><div class="inspector-actions"><button class="button" data-action="rotate">↻ Um 90° drehen</button><button class="delete" data-action="delete" aria-label="${escape(i.name)} entfernen" title="Element entfernen">×</button></div><p class="shortcut">Pfeile: verschieben · R: drehen · Entf: entfernen</p>`;
}
function renderResults(a){
  const issues=[];
  if(a.capacityV<a.demandV)issues.push(`${a.demandV-a.capacityV} Vallejo-Plätze fehlen`);
  if(a.capacityC<a.demandC)issues.push(`${a.demandC-a.capacityC} Citadel-Plätze fehlen`);
  if(a.collisions.length)issues.push(`${a.collisions.length} ${a.collisions.length===1?'Überlappung':'Überlappungen'}`);
  if(a.outside.length)issues.push(`${a.outside.length} ${a.outside.length===1?'Element ragt':'Elemente ragen'} über den Tisch`);
  if(a.blocked.length)issues.push(`${a.blocked.length} ${a.blocked.length===1?'Element belegt':'Elemente belegen'} die Arbeitsfläche`);
  $('result').className=`result${a.allFits?'':' warn'}`;
  $('result').innerHTML=`<span class="result-icon" aria-hidden="true">${a.allFits?'✓':'!'}</span><div><strong>${a.allFits?'Deine Farben passen. Und deine Ideen auch.':'Hier braucht dein Plan noch etwas Platz.'}</strong><p>${a.allFits?`${fmt(a.demandV)} Vallejo-Flaschen und ${fmt(a.demandC)} Citadel-Töpfe haben Platz. ${state.workArea?'Die Arbeitsfläche bleibt frei.':'Die Elemente überlappen sich nicht.'} Auf Basis deiner eingetragenen Werte.`:issues.join(' · ')+'.'}</p></div>`;
  $('summaryV').textContent=`${fmt(a.demandV)} / ${fmt(a.capacityV)} Plätze`;
  $('summaryC').textContent=`${fmt(a.demandC)} / ${fmt(a.capacityC)} Plätze`;
  $('summaryFree').textContent=`${Math.round(a.free/(TABLE.w*TABLE.d)*100)} %`;
  const row=(label,demand,capacity,cls)=>`<div class="capacity-row ${cls} ${demand>capacity?'over':''}"><div class="capacity-row-head"><span>${label}</span><strong>${fmt(demand)} / ${fmt(capacity)} Plätze</strong></div><div class="bar" role="meter" aria-label="${label} belegte Plätze" aria-valuemin="0" aria-valuemax="${Math.max(capacity,demand,1)}" aria-valuenow="${demand}"><span style="width:${capacity?Math.min(100,demand/capacity*100):demand?100:0}%"></span></div><p>${demand<=capacity?`${fmt(capacity-demand)} Plätze Reserve`:`Noch ${fmt(demand-capacity)} Plätze nötig`}</p></div>`;
  $('capacityContent').innerHTML=row('Vallejo',a.demandV,a.capacityV,'vallejo')+row('Citadel',a.demandC,a.capacityC,'citadel');
}
function renderComparison(){
  $('elementCount').textContent=`${state.items.length} Elemente`;
  $('comparisonBody').innerHTML=state.items.map(i=>`<tr class="${selected===i.id?'active':''}" data-select="${escape(i.id)}"><td><span class="swatch" style="background:${i.kind==='case'?'#c3b37c':i.kind==='citadel'?'#c58d84':i.kind==='custom'?'#9caac2':'#77a591'}"></span>${escape(i.name)}</td><td>${fmt(i.w)} × ${fmt(i.d)} × ${fmt(i.h)}</td><td>${fmt(i.capV)}</td><td>${fmt(i.capC)}</td><td><button class="table-edit" data-select="${escape(i.id)}" aria-label="${escape(i.name)} bearbeiten">↗</button></td></tr>`).join('')||'<tr><td colspan="5">Noch kein Element. Füge einen Baustein hinzu.</td></tr>';
}
function render({save=true,inspector=true}={}){const a=analyze(state);renderBoard(a);renderComparison();renderResults(a);if(inspector)renderInspector();$('snap').checked=state.snap;$('workToggle').checked=state.workArea;for(const k of Object.keys(state.inventory))$('inv-'+k).value=state.inventory[k];if(save)persist();}
function select(id){selected=id;render({save:false});}
$('catalog').innerHTML=Object.entries(templates).map(([key,t])=>`<button class="catalog-button ${key}" data-add="${key}"><span class="catalog-icon" aria-hidden="true">${icon(t.kind)}</span><span><strong>${t.name}</strong><small>${t.w} × ${t.d} cm · ${t.capV||t.capC?`${t.capV||t.capC} Plätze`:'frei anpassbar'}</small></span><span class="catalog-plus" aria-hidden="true">＋</span></button>`).join('');
$('catalog').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;if(state.items.length>=100){notify('Maximal 100 Elemente pro Plan.');return;}const i=addItem(state,b.dataset.add,crypto.randomUUID());selected=i.id;render();notify(`${i.name} hinzugefügt.`);});
document.querySelectorAll('[data-inventory]').forEach(input=>input.addEventListener('change',()=>{state.inventory[input.dataset.inventory]=Math.floor(number(input.value,0,2000));render();}));
$('snap').addEventListener('change',e=>{state.snap=e.target.checked;persist();});
$('workToggle').addEventListener('change',e=>{state.workArea=e.target.checked;render();});
$('comparisonBody').addEventListener('click',e=>{const row=e.target.closest('[data-select]');if(row)select(row.dataset.select);});
$('inspector').addEventListener('change',e=>{const input=e.target.closest('[data-field]');if(input){updateItem(state,selected,input.dataset.field,input.value);render();}});
function execute(action){if(!selected)return;if(action==='rotate')rotateItem(state,selected);if(action==='delete'){removeItem(state,selected);selected=null;}render();}
$('inspector').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)execute(b.dataset.action);});
$('board').addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const el=e.target.closest('[data-element]');if(!el){selected=null;render({save:false});return;}
  e.preventDefault();selected=el.dataset.element;const i=state.items.find(i=>i.id===selected),rect=$('board').getBoundingClientRect();
  drag={id:selected,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,itemX:i.x,itemY:i.y,scaleX:TABLE.w/rect.width,scaleY:TABLE.d/rect.height};
  render({save:false});$('board').setPointerCapture(e.pointerId);$('elements').querySelectorAll('[data-element]').forEach(n=>{if(n.dataset.element===selected)n.classList.add('dragging');});
});
$('board').addEventListener('pointermove',e=>{
  if(!drag||drag.pointerId!==e.pointerId)return;
  moveItem(state,drag.id,drag.itemX+(e.clientX-drag.startX)*drag.scaleX,drag.itemY+(e.clientY-drag.startY)*drag.scaleY);
  const i=state.items.find(i=>i.id===drag.id);$('elements').querySelectorAll('[data-element]').forEach(n=>{if(n.dataset.element===drag.id)positionElement(n,i);});
});
function endDrag(e){if(!drag||drag.pointerId!==e.pointerId)return;drag=null;render();}
$('board').addEventListener('pointerup',endDrag);$('board').addEventListener('pointercancel',endDrag);$('board').addEventListener('lostpointercapture',endDrag);
$('board').addEventListener('click',e=>{const el=e.target.closest('[data-element]');if(el&&!drag&&selected!==el.dataset.element)select(el.dataset.element);});
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select')||!selected||e.ctrlKey||e.metaKey||e.altKey)return;
  const i=state.items.find(i=>i.id===selected);if(!i)return;
  const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(keys[e.key]){e.preventDefault();const delta=keys[e.key],step=state.snap?5:1;moveItem(state,selected,i.x+delta[0]*step,i.y+delta[1]*step,false);render();}
  else if(e.key.toLowerCase()==='r'){e.preventDefault();execute('rotate');}
  else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();execute('delete');}
});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='farbwerk-tischplan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Dein Plan wurde exportiert.');});
$('import').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>150000)throw new Error('Die Datei ist zu groß.');const imported=validateState(JSON.parse(await file.text()));state=imported;selected=state.items[0]?.id??null;render();notify('Dein Plan wurde geladen.');}catch(err){notify(err instanceof SyntaxError?'Die Datei enthält keinen gültigen Plan.':err.message);}e.target.value='';});
$('reset').addEventListener('click',()=>{if(!confirm('Beispielplan wiederherstellen? Dein aktueller Plan wird ersetzt. Du kannst ihn vorher exportieren.'))return;state=defaultState();selected='rack-v';render();notify('Beispielplan wiederhergestellt.');});
render({save:!loadFailed});
if(loadFailed){$('saveStatus').textContent='Gespeicherten Plan nicht lesbar';notify('Der gespeicherte Plan konnte nicht geladen werden. Der Beispielplan ist geöffnet.');}
