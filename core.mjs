export const TABLE = Object.freeze({w:180,d:90});
export const STORAGE_KEY = 'farbwerk-plan-v1';
export const templates = {
  case: {name:'Vallejo-Koffer',kind:'case',w:40,d:30,h:12,capV:72,capC:0},
  vallejo: {name:'Vallejo-Stufenregal',kind:'vallejo',w:40,d:18,h:20,capV:48,capC:0},
  citadel: {name:'Citadel-Stufenregal',kind:'citadel',w:36,d:20,h:18,capV:0,capC:36},
  custom: {name:'Eigenes Element',kind:'custom',w:30,d:20,h:15,capV:0,capC:0}
};
export function defaultState() {
  return {version:1,inventory:{case1:72,case2:72,loose:24,citadel:60},snap:true,workArea:true,items:[
    {...templates.case,id:'case-1',name:'Vallejo-Koffer 1',x:2,y:2},
    {...templates.case,id:'case-2',name:'Vallejo-Koffer 2',x:44,y:2},
    {...templates.vallejo,id:'rack-v',x:86,y:2},
    {...templates.citadel,id:'rack-c1',name:'Citadel-Regal 1',x:142,y:2},
    {...templates.citadel,id:'rack-c2',name:'Citadel-Regal 2',x:142,y:24}
  ]};
}
export const reserve = {x:45,y:43,w:90,d:45};
export const overlaps = (a,b) => a.x < b.x+b.w-0.001 && a.x+a.w > b.x+0.001 && a.y < b.y+b.d-0.001 && a.y+a.d > b.y+0.001;
export const inside = a => a.x>=0 && a.y>=0 && a.x+a.w<=TABLE.w+0.001 && a.y+a.d<=TABLE.d+0.001;
export const number = (v,min,max) => Math.max(min,Math.min(max,Number.isFinite(Number(v))?Number(v):min));
export function moveItem(state,id,x,y,snap=state.snap) {
  const item=state.items.find(i=>i.id===id); if(!item)return;
  const step=snap?5:0.5;
  item.x=Math.min(Math.max(0,Math.round(x/step)*step),Math.max(0,TABLE.w-item.w));
  item.y=Math.min(Math.max(0,Math.round(y/step)*step),Math.max(0,TABLE.d-item.d));
}
export function rotateItem(state,id) {
  const i=state.items.find(i=>i.id===id);if(!i)return;
  [i.w,i.d]=[i.d,i.w];
  i.x=Math.max(0,Math.min(i.x,TABLE.w-i.w)); i.y=Math.max(0,Math.min(i.y,TABLE.d-i.d));
}
export function addItem(state,key,id) {
  if(!templates[key])return null;
  const item={...templates[key],id,x:0,y:0};
  let found=false;
  for(let y=0;y<=TABLE.d-item.d&&!found;y+=5) for(let x=0;x<=TABLE.w-item.w;x+=5) {
    const p={...item,x,y};
    if(!state.items.some(i=>overlaps(p,i))&&(!state.workArea||!overlaps(p,reserve))){item.x=x;item.y=y;found=true;break;}
  }
  state.items.push(item);return item;
}
export function removeItem(state,id){state.items=state.items.filter(i=>i.id!==id);}
export function updateItem(state,id,field,value) {
  const item=state.items.find(i=>i.id===id);if(!item)return;
  if(field==='name')item.name=String(value).trim().slice(0,60)||'Element';
  else if(['w','d','h','x','y','capV','capC'].includes(field)){
    const min=['w','d','h'].includes(field)?1:0;
    item[field]=number(value,min,field.startsWith('cap')?2000:field==='h'?150:field==='y'?90:180);
    if(field.startsWith('cap'))item[field]=Math.floor(item[field]);
  }
}
export function analyze(state){
  const demandV=state.inventory.case1+state.inventory.case2+state.inventory.loose;
  const capacityV=state.items.reduce((n,i)=>n+i.capV,0), capacityC=state.items.reduce((n,i)=>n+i.capC,0);
  const collisions=[],outside=[],blocked=[];
  state.items.forEach((a,n)=>{if(!inside(a))outside.push(a.id);if(state.workArea&&overlaps(a,reserve))blocked.push(a.id);state.items.slice(n+1).forEach(b=>{if(overlaps(a,b))collisions.push([a.id,b.id]);});});
  // Union of occupied rectangles, clipped to the tabletop (overlaps count once).
  const rects=state.items.map(i=>({x:Math.max(0,i.x),y:Math.max(0,i.y),r:Math.min(TABLE.w,i.x+i.w),b:Math.min(TABLE.d,i.y+i.d)})).filter(i=>i.r>i.x&&i.b>i.y);
  const xs=[...new Set(rects.flatMap(i=>[i.x,i.r]))].sort((a,b)=>a-b);let occupied=0;
  for(let n=0;n<xs.length-1;n++){
    const intervals=rects.filter(i=>i.x<xs[n+1]&&i.r>xs[n]).map(i=>[i.y,i.b]).sort((a,b)=>a[0]-b[0]);let length=0,start=-1,end=-1;
    for(const [a,b] of intervals){if(a>end){length+=end-start;start=a;end=b;}else end=Math.max(end,b);}length+=end-start;
    occupied+=(xs[n+1]-xs[n])*length;
  }
  const capacityFits=capacityV>=demandV&&capacityC>=state.inventory.citadel;
  const layoutFits=!collisions.length&&!outside.length&&!blocked.length;
  return {demandV,demandC:state.inventory.citadel,capacityV,capacityC,collisions,outside,blocked,occupied,free:TABLE.w*TABLE.d-occupied,capacityFits,layoutFits,allFits:capacityFits&&layoutFits};
}
export function validateState(input){
  if(!input||input.version!==1||!Array.isArray(input.items)||input.items.length>100||!input.inventory)throw new Error('Keine gültige Farbwerk-Plandatei.');
  const s={version:1,snap:input.snap!==false,workArea:input.workArea!==false,inventory:{},items:[]};
  for(const k of ['case1','case2','loose','citadel']){
    const v=input.inventory[k];if(!Number.isInteger(v)||v<0||v>2000)throw new Error('Ungültige Farbanzahl.');s.inventory[k]=v;
  }
  const ids=new Set();
  for(const i of input.items){
    if(!i||typeof i.id!=='string'||i.id.length>100||!i.id.length||ids.has(i.id)||!Object.hasOwn(templates,i.kind)||typeof i.name!=='string')throw new Error('Ungültiges Element.');
    ids.add(i.id);const clean={id:i.id.slice(0,100),kind:i.kind,name:i.name.slice(0,60)};
    for(const k of ['x','y','w','d','h','capV','capC']){const max=k.startsWith('cap')?2000:k==='h'?150:k==='y'?90:180;const min=['w','d','h'].includes(k)?1:0;
      if(typeof i[k]!=='number'||!Number.isFinite(i[k])||i[k]<min||i[k]>max||(k.startsWith('cap')&&!Number.isInteger(i[k])))throw new Error('Ungültige Maße oder Kapazität.');clean[k]=i[k];}
    s.items.push(clean);
  }
  return s;
}
export function saveState(storage,state){storage.setItem(STORAGE_KEY,JSON.stringify(state));}
export function loadState(storage){const raw=storage.getItem(STORAGE_KEY);return raw?validateState(JSON.parse(raw)):defaultState();}
