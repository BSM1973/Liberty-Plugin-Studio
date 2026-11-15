// V12.1 small deterministic DOM smoke tests (no browser/native AU required).
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const read = basename => fs.readFileSync(new URL("./" + basename, import.meta.url), "utf8");

const classes = () => {
  const names = new Set();
  return { add:x=>names.add(x), remove:x=>names.delete(x),
           toggle:(x,v)=>v ? names.add(x) : names.delete(x),
           contains:x=>names.has(x) };
};
class Node {
  constructor(type) { this.type=type; this.children=[]; this.style={}; this.classList=classes(); this.attrs={}; }
  setAttribute(k,v) { this.attrs[k]=String(v); if(k==="class")this.className=String(v); }
  append(...children) { for (const c of children) { c.parent=this; this.children.push(c); } }
  appendChild(child) { this.append(child); }
  remove() { if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this); }
  querySelector(sel) {
    if (sel.includes("lms-native-cables")) return this.children.find(x=>x.className==="lms-native-cables")||null;
    if (sel.includes("lms-split-stage-marker")) return this.children.find(x=>x.className==="lms-split-stage-marker")||null;
    if (sel.includes(".slot-heading")) return this.heading||null;
    if (sel.includes("path:not")) return this.originalPath||null;
    return null;
  }
}
const svg=new Node("svg"), original=new Node("path");
original.style.display="";
svg.originalPath=original;
const slots=Array.from({length:8},()=>{const s=new Node("slot");s.dataset={};s.heading=new Node("heading");s.querySelector=(sel)=>sel===".slot-heading"?s.heading:s.heading.querySelector(sel);s.removeAttribute=k=>delete s.dataset.lmsRoute;return s;});
const legend=new Node("legend");
const document={
  querySelector:q=>q.includes("svg.patch-cables")?svg:q.includes(".chain-legend")?legend:null,
  querySelectorAll:q=>q.includes(".slot-well")?slots:[],
  createElementNS:(ns,name)=>new Node(name),
  createElement:name=>new Node(name),
  getElementById:name=>name==="main"?new Node("root"):null,
};
const routingContext={ document, window:{}, MutationObserver:class{observe(){}},
                       requestAnimationFrame:fn=>fn(), console };
vm.runInNewContext(read("lms-routing-v121.js"),routingContext);
const apply=routingContext.window.__lmsV121_updateRouting;
assert.equal(typeof apply,"function");
const lanes=[0,0,0,0,1,1,1,1];
apply({mode:2,ready:true,lanes});
assert.equal(original.style.display,"none");
assert.ok(svg.classList.contains("lms-is-split"));
assert.ok(svg.querySelector(".lms-native-cables"),"Split cables must appear");
// A clean cable display has exactly two uninterrupted rails, short vertical
// connectors and two junctions; never S-curves or zig-zag crossings.
const cableLayer = svg.querySelector(".lms-native-cables");
const branches = cableLayer.children.filter(n => n.type === "g");
assert.equal(branches.length, 2, "Exactly two visible branches A/B");
for (const branch of branches) {
  const paths = branch.children.filter(n => n.type === "path");
  const rails = paths.filter(n => n.attrs.class.includes("lms-rail") &&
                                  n.attrs.class.includes("lms-cable-inner"));
  assert.equal(rails.length, 1, "One continuous rail per branch");
  assert.ok(!/[CQcq]/.test(rails[0].attrs.d), "Rails must not zigzag");
  const pins = paths.filter(n => n.attrs.class.includes("lms-stage-connector") &&
                                n.attrs.class.includes("lms-cable-inner"));
  assert.equal(pins.length, 4, "Four local stage connectors in default 4+4 split");
  for (const pin of pins) {
    assert.ok(/M [0-9]+ [0-9]+ V [0-9]+/.test(pin.attrs.d), "Connectors are strictly vertical");
    const nums = pin.attrs.d.match(/\d+/g).map(Number);
    assert.ok(Math.abs(nums[1] - nums[2]) <= 7, "Connector never crosses another branch");
  }
}

assert.equal(slots[0].dataset.lmsRoute,"A");
assert.equal(slots[7].dataset.lmsRoute,"B");
assert.equal(slots[7].heading.children[0].textContent,"B");
apply({mode:2,ready:true,lanes:[1,0,0,0,1,1,1,1]});
assert.equal(slots[0].dataset.lmsRoute,"B");
apply({mode:0,ready:true,lanes});
assert.equal(original.style.display,"");
assert.equal(svg.querySelector(".lms-native-cables"),null);
assert.equal(slots[0].dataset.lmsRoute,undefined);
console.log("V12.1 SVG: original serial cables preserved; split A/B wires switch and restore.");

const events={}, calls=[];
let clock=1000;
const panel={
  querySelector:q=>q.includes(" h2")?{textContent:"Verdant Drive"}:
                   q.includes(".small-overline")?{textContent:"ÉTAGE 01"}:null
};
const button={
  getBoundingClientRect:()=>({left:100,right:330,top:90,bottom:148,width:230,height:58}),
  contains:()=>false, closest:q=>q.includes(".edit-panel")?panel:button
};
const doc={
  querySelectorAll:q=>q.includes(".lms-focused-history")?[button]:[],
  addEventListener:(name,cb)=>{events[name]=cb;},
};
const web={
  LMS_PEDAL_DATA:{pedals:[{name:"Verdant Drive"}]},
  dispatchEvent:ev=>calls.push(ev.detail)
};
const histContext={document:doc,window:web,performance:{now:()=>clock},
  CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},console};
vm.runInNewContext(read("lms-history-v121.js"),histContext);
const ev=(x,y)=>({button:0,clientX:x,clientY:y,target:{closest:()=>null},
  preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
events.pointerdown(ev(101,91));
assert.equal(calls.length,1,"top-left history hit");
clock+=500;
events.pointerdown(ev(329,147));
assert.equal(calls.length,2,"bottom-right history hit");
assert.equal(calls[1].name,"Verdant Drive");
assert.equal(calls[1].slot,0);
clock+=500;
events.keydown({key:"Enter",target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){}});
assert.equal(calls.length,3,"keyboard history action");
console.log("V12.1 Histoire: button corners and keyboard dispatched exactly once each.");
