// Event-handler integration checks using a minimal DOM adapter, not a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY} from './core.mjs';
class Node {
  constructor(dataset={}){this.dataset=dataset;this.listeners={};this.style={};this.classList={add(){}};this.value='';this.checked=true;this._html='';this.textContent='';}
  set innerHTML(v){this._html=v;this.children=[...v.matchAll(/data-element="([^"]+)"/g)].map(m=>new Node({element:m[1]}));}
  get innerHTML(){return this._html;}
  addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
  async dispatch(k,e={}){e.target??=this;e.preventDefault??=()=>{};for(const f of this.listeners[k]??[])await f(e);}
  querySelectorAll(){return this.children??[];}
  closest(q){return q.startsWith('[data-')&&this.dataset[q.slice(6,-1)]!==undefined?this:null;}
  getBoundingClientRect(){return {width:900,height:450};}
  setPointerCapture(){}
  click(){}
}
const ids=['toast','saveStatus','workArea','elements','board','inspector','summaryV','summaryC','summaryFree','result','capacityContent','elementCount','comparisonBody','snap','workToggle','catalog','export','import','importFile','reset','inv-case1','inv-case2','inv-loose','inv-citadel'];
const nodes=Object.fromEntries(ids.map(id=>[id,new Node()]));
for(const k of ['case1','case2','loose','citadel'])nodes['inv-'+k].dataset.inventory=k;
const doc=new Node();doc.getElementById=id=>nodes[id];doc.querySelectorAll=()=>['case1','case2','loose','citadel'].map(k=>nodes['inv-'+k]);doc.createElement=()=>new Node();
const data=new Map();globalThis.document=doc;globalThis.localStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};globalThis.confirm=()=>true;
const timer=globalThis.setTimeout;globalThis.setTimeout=(f,t)=>{const h=timer(f,t);h.unref();return h;};
await import('./app.mjs');
const saved=()=>JSON.parse(data.get(STORAGE_KEY));
const field=async(key,value)=>nodes.inspector.dispatch('change',{target:Object.assign(new Node({field:key}),{value})});
test('initial app render shows real summaries and selected-element editor',()=>{assert.equal(nodes.summaryV.textContent,'168 / 192 Plätze');assert.match(nodes.inspector.innerHTML,/data-field="capV"/);});
test('inventory handler recalculates shortage and persists it',async()=>{nodes['inv-citadel'].value='80';await nodes['inv-citadel'].dispatch('change');assert.equal(saved().inventory.citadel,80);assert.match(nodes.result.innerHTML,/8 Citadel-Plätze fehlen/);nodes['inv-citadel'].value='60';await nodes['inv-citadel'].dispatch('change');});
test('pointer drag handler moves selected item to scaled, snapped coordinates',async()=>{const target=new Node({element:'rack-v'});await nodes.board.dispatch('pointerdown',{target,button:0,pointerId:1,clientX:430,clientY:10});await nodes.board.dispatch('pointermove',{pointerId:1,clientX:480,clientY:210});await nodes.board.dispatch('pointerup',{pointerId:1});const i=saved().items.find(i=>i.id==='rack-v');assert.deepEqual([i.x,i.y],[95,40]);assert.match(nodes.result.innerHTML,/Arbeitsfläche/);});
test('inspector changes name, dimensions and separate capacities',async()=>{await field('name','Mein <Regal>');await field('w',32);await field('capV',54);await field('capC',4);const i=saved().items.find(i=>i.id==='rack-v');assert.equal(i.name,'Mein <Regal>');assert.equal(i.w,32);assert.equal(i.capV,54);assert.equal(i.capC,4);assert.match(nodes.comparisonBody.innerHTML,/Mein &lt;Regal&gt;/);});
test('rotate button and keyboard movement update persisted geometry',async()=>{await nodes.inspector.dispatch('click',{target:new Node({action:'rotate'})});let i=saved().items.find(i=>i.id==='rack-v');assert.deepEqual([i.w,i.d],[18,32]);const x=i.x;await doc.dispatch('keydown',{target:new Node(),key:'ArrowLeft'});i=saved().items.find(i=>i.id==='rack-v');assert.equal(i.x,x-5);});
test('add and delete handlers change elements while preserving inventory',async()=>{const before=saved();await nodes.catalog.dispatch('click',{target:new Node({add:'custom'})});assert.equal(saved().items.length,before.items.length+1);await nodes.inspector.dispatch('click',{target:new Node({action:'delete'})});assert.equal(saved().items.length,before.items.length);assert.deepEqual(saved().inventory,before.inventory);});
test('import handler loads a valid plan and rejects invalid input without replacing it',async()=>{const imported=saved();imported.inventory.citadel=50;nodes.importFile.files=[{size:100,text:async()=>JSON.stringify(imported)}];await nodes.importFile.dispatch('change');assert.equal(saved().inventory.citadel,50);nodes.importFile.files=[{size:5,text:async()=>'oops'}];await nodes.importFile.dispatch('change');assert.equal(saved().inventory.citadel,50);assert.match(nodes.toast.textContent,/keinen gültigen Plan/);});
test('export creates a downloadable JSON snapshot',async()=>{let blob;const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:plan';};URL.revokeObjectURL=()=>{};await nodes.export.dispatch('click');assert.deepEqual(JSON.parse(await blob.text()),saved());URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;});
test('reset restores the usable example after confirmation',async()=>{await nodes.reset.dispatch('click');assert.equal(saved().inventory.citadel,60);assert.equal(saved().items.length,5);assert.match(nodes.result.innerHTML,/Deine Farben passen/);});
