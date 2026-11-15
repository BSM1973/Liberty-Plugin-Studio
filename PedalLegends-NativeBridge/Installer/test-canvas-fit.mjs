// Tests the exact injected script against the physical JUCE board bounds.
// No original AU exists on CI, so this is a layout contract test, not a
// claim of real host rendering. The original React root is fixed 1440x960.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL("./lms-canvas-fit.js", import.meta.url), "utf8");
function test(width, height) {
  const styles = {};
  const root = {style: {
    transform: "",
    setProperty(key,value) {styles[key]=value; if(key==="transform")this.transform=value;}
  }};
  const host = {style:{}};
  const html = {style:{},dataset:{}};
  const body = {style:{}};
  const document = {
    readyState:"complete", documentElement:html, body,
    getElementById(id) {return id==="plugin-body"?root:id==="main"?host:null;},
    querySelectorAll() {return [];}
  };
  const window = {innerWidth:width, innerHeight:height,addEventListener(){}};
  class MutationObserver {observe(){}}
  const ctx={document,window,MutationObserver,requestAnimationFrame:callback=>callback()};
  vm.runInNewContext(source,ctx);
  window.__lmsFitViewport(width,height);
  assert.equal(typeof window.__lmsFitViewport,"function");
  assert.equal(styles.width,"1440px");
  assert.equal(styles.height,"960px");
  const scale=Number(root.style.transform.split("scale(")[1].split(")")[0]);
  const offset=root.style.transform.split("translate(")[1].split(")")[0].split("px,");
  const x=Number(offset[0]),y=Number(offset[1].replace("px",""));
  assert.ok(scale>0 && scale<=1);
  assert.ok(x>=0 && y>=0);
  assert.ok(x+1440*scale <= width+0.02, "right edge clipped");
  assert.ok(y+960*scale <= height+0.02, "bottom edge clipped");
  assert.ok(Math.abs((width - 1440*scale)/2-x)<0.02,"not horizontally centered");
  assert.ok(Math.abs((height - 960*scale)/2-y)<0.02,"not vertically centered");
  assert.equal(host.style.width,width+"px");
  assert.equal(host.style.height,height+"px");
  assert.equal(html.style.overflow,"hidden");
  console.log("PASS",width,height,root.style.transform);
}
for(const [width,height] of [[990,660],[1200,800],[1100,680],[1440,960],[920,610]])
  test(width,height);
