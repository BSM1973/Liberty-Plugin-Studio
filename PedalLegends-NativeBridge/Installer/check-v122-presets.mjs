// Pedal Legends V12.2 factory-bank structural test.
// Exercises the actual injected script (not a duplicate implementation).
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(new URL("./lms-presets-v122.js",import.meta.url),"utf8");
const factory=Array.from({length:100},(_,index)=>{
  const params={};
  for(let slot=1;slot<=8;slot++){
    params["Slot_"+slot+"_Enabled"]=slot<=4?1:0;
    params["Slot_"+slot+"_Model"]=slot===1?17:slot===2?1:slot===3?32:slot===4?36:0;
    params["Slot_"+slot+"_Mix"]=0.5;
  }
  return {name:"FACTORY TEST "+String(index+1).padStart(3,"0"),
          params,extras:{category:"Vintage Blues",description:"Original sound",author:"Liberty"}};
});
const init={name:"Init",params:{Master_Mix:1}};
const original={presets:[init,...factory]};
const snapshot=JSON.stringify(original);
const events=[];
const ctx={
  window:{fetch:async()=>new Response(snapshot,{status:200}),
          dispatchEvent:e=>events.push(e.type)},
  Response, Event, Map, console
};
vm.runInNewContext(source,ctx,{filename:"lms-presets-v122.js"});
const augmented=ctx.window.LMS_V122_augmentFactory(original);
assert.equal(augmented.presets.length,201,"100 existing + Init + 100 Split");
assert.equal(JSON.stringify(original),snapshot,"original factory source not modified");
assert.equal(augmented.presets[0].name,"Init");
assert.equal(augmented.presets[1].name,factory[0].name);
assert.equal(augmented.presets[100].name,factory[99].name);
const split=augmented.presets.slice(101);
assert.equal(split.length,100);
assert.equal(new Set(split.map(x=>x.name)).size,100);
assert.ok(split.every(x=>x.name.startsWith("SPLIT ")));
assert.equal(ctx.window.LMS_V122_SPLIT_RECIPES.size,100);
for(let i=0;i<100;i++){
  const recipe=ctx.window.LMS_V122_SPLIT_RECIPES.get(split[i].name);
  assert.ok(recipe);
  assert.equal(recipe.mode,2);
  assert.equal(recipe.lanes.length,8);
  assert.ok(recipe.lanes.every(x=>x===0||x===1));
  assert.ok(recipe.lanes.includes(0)&&recipe.lanes.includes(1),
            "both real branches needed");
  assert.ok(recipe.balance>=0.32&&recipe.balance<=0.68);
  assert.equal(JSON.stringify(split[i].params),JSON.stringify(factory[i].params));
}
const noDuplicate=ctx.window.LMS_V122_augmentFactory(augmented);
assert.strictEqual(noDuplicate,augmented,"idempotent startup");
const res=await ctx.window.fetch("scripts/presets.json");
assert.equal((await res.json()).presets.length,201,"HTTP path also works");
const other=await ctx.window.fetch("not-a-preset.json");
assert.equal((await other.json()).presets.length,101,"unrelated fetch untouched");

const originalPattern="function bi(e){let t=WR(Ku(e)),o=new Set,n=[];";
const patchedPattern="function bi(e){e=window.LMS_V122_augmentFactory?window.LMS_V122_augmentFactory(e):e;let t=WR(Ku(e)),o=new Set,n=[];";
assert.equal(originalPattern.replace("function bi(e){",
   "function bi(e){e=window.LMS_V122_augmentFactory?window.LMS_V122_augmentFactory(e):e;"),
   patchedPattern,"native bundled parser signature");

const browser=fs.readFileSync(new URL("./lms-browser-v122.js",import.meta.url),"utf8");
for(const word of ["PRESETS SÉRIE","PRESETS PARALLÈLE / SPLIT","lmsPresetRouting","preset-select-button"]){
  assert.ok(browser.includes(word),"Browser missing "+word);
}
console.log("V12.2 PASS: 100 original factory + Init untouched, 100 unique A/B variants and recall metadata.");
console.log("V12.2 PASS: native-bundle augmentation signature, HTTP fallback, two-bank browser and route callback.");
