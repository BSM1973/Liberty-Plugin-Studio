// Contract test for the actual PluginMaker wrapper hierarchy.
// Browser rendering was also checked locally against the original AU web app.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL("./lms-canvas-fit.js", import.meta.url), "utf8");

function check(width, height, webview = false) {
  const vars = new Map();
  const node = () => ({
    classList: {names:new Set(),add(v){this.names.add(v)},contains(v){return this.names.has(v)}},
    style: {setProperty(k,v){vars.set(k,v)}},
    firstElementChild:null,
    parentElement:null
  });
  const title=node(), bar=node(), root=node(), scaler=node(), viewport=node(),
        frame=node(), layout=node(), shell=node();
  root.parentElement=scaler;scaler.parentElement=viewport;
  viewport.parentElement=frame;frame.parentElement=layout;layout.parentElement=shell;
  frame.firstElementChild=title;shell.firstElementChild=bar;
  const html=node(), head={appendChild(v){this.script=v}}, main=node();
  const body=node();
  if(webview) body.classList.add('webview-mode');
  const document={
    readyState:"complete",head,body,documentElement:html,
    createElement(){return {textContent:""}},
    getElementById(id){return id==="plugin-body"?root:id==="main"?main:null},
    addEventListener(){}
  };
  class MutationObserver {observe(){}}
  const window={innerWidth:width,innerHeight:height,addEventListener(){}};
  vm.runInNewContext(source,{window,document,MutationObserver});
  window.__lmsFitViewport(width,height);
  const scale=Number(vars.get("--lms-fit-scale"));
  const w=webview ? 1440 * scale : Number(vars.get("--lms-frame-w").replace("px",""));
  const h=webview ? 960 * scale : Number(vars.get("--lms-frame-h").replace("px",""));
  assert.ok(head.script.textContent.includes("!important"));
  assert.ok(scaler.classList.contains("lms-native-scaler"));
  if(webview) {
    assert.ok(scaler.classList.contains("lms-native-webview-scaler"));
    assert.ok(!viewport.classList.contains("lms-native-viewport"));
    assert.ok(!title.classList.contains("lms-native-fake-title"));
    assert.ok(!bar.classList.contains("lms-native-topbar"));
  } else {
    assert.ok(viewport.classList.contains("lms-native-viewport"));
  assert.ok(frame.classList.contains("lms-native-frame"));
  assert.ok(layout.classList.contains("lms-native-layout"));
  assert.ok(title.classList.contains("lms-native-fake-title"));
  assert.ok(bar.classList.contains("lms-native-topbar"));
  }
  assert.ok(scale>0 && scale<=1);
  assert.ok(w<=width+0.001 && h<=height+0.001);
  assert.ok(Math.abs(w-1440*scale)<0.01);
  assert.ok(Math.abs(h-960*scale)<0.01);
  assert.ok(!source.includes('root.style.setProperty("transform"'),
    "Never transform original React #plugin-body");
  console.log("PASS",width,height,scale,w,h);
}
for (const [w,h] of [[990,660],[1100,680],[1440,960],[920,610]]) { check(w,h); check(w,h,true); }
