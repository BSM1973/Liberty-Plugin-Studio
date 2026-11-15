/* Liberty Pedal Legends V12.2 — 100 extra Split A/B factory sounds.
 * Installs before index.bundle.js, without touching the original presets.json.
 * The original 100 factory records remain byte-for-byte intact.
 * Split variants preserve their source pedal models and settings; only their
 * routing topology, branch allocation and balance are changed on recall.
 */
(() => {
  "use strict";
  const originalFetch = window.fetch.bind(window);
  const tag = "SPLIT ";
  const labels = {
    "Vintage Blues": "Blues vintage",
    "Classic Rock": "Rock classique",
    "Hard Rock": "Hard rock",
    "Heavy Metal": "Heavy metal",
    "Modern Metal": "Metal moderne",
    "Funk and Clean": "Funk et sons clairs",
    "Jazz and Warm": "Jazz chaleureux",
    "Ambient and Cinematic": "Ambient et cinéma",
    "Psychedelic and Experimental": "Psychédélique",
    "Studio Essentials": "Studio"
  };
  const manifest = new Map();

  function getModel(params, slot) {
    return Number(params["Slot_" + slot + "_Model"] || 0);
  }
  function isEnabled(params, slot) {
    return Number(params["Slot_" + slot + "_Enabled"] || 0) >= 0.5;
  }
  const isSpace = m => (m >= 26 && m <= 37) || m === 40;
  const isDynamics = m => m >= 14 && m <= 22;

  function assignLanes(params, index) {
    const enabled = [];
    const lanes = Array.from({length:8}, (_, i) => i < 4 ? 0 : 1);
    for (let i = 1; i <= 8; ++i) {
      if (!isEnabled(params,i) || getModel(params,i) === 0) continue;
      enabled.push(i);
      const model=getModel(params,i);
      lanes[i-1] = isSpace(model) ? 1 : isDynamics(model) ? 0 : (index+i)%3===0 ? 1:0;
    }
    if (enabled.length >= 2) {
      const a = enabled.filter(i=>lanes[i-1]===0);
      const b = enabled.filter(i=>lanes[i-1]===1);
      if (!a.length) lanes[enabled[0]-1]=0;
      if (!b.length) lanes[enabled[enabled.length-1]-1]=1;
    }
    // Even single-effect presets run as a real parallel direct/effect pair:
    // one branch is a clean path because no pedal is enabled in that lane.
    return lanes;
  }

  function buildSplitFactory(base) {
    if (!Array.isArray(base) || base.some(p=>!p || typeof p.name!=="string")) return [];
    const factory = base.filter(p => p.name !== "Init" && !p.name.startsWith(tag));
    if (factory.length !== 100) return [];
    manifest.clear();
    const results=factory.map((preset,i)=>{
      const sourceParams=preset.params;
      const name=tag+String(i+1).padStart(3,"0")+" — "+preset.name;
      const lanes=assignLanes(sourceParams, i);
      const balance=Math.round((0.37+((i*5)%9)*0.033)*100)/100;
      const category=preset.extras?.category || "Studio Essentials";
      const recipe={
        name,source:preset.name,
        bank:"parallel",mode:2,lanes,balance,
        category:labels[category]||category,
        description:"Deux chaînes indépendantes : pédales affectées à A et B, fusionnées à la sortie. Variation parallèle de "+preset.name+"."
      };
      manifest.set(name,recipe);
      return {
        name,
        params:{...sourceParams},
        extras:{
          ...(preset.extras||{}),
          category,
          description:recipe.description,
          author:"Liberty Music Software"
        }
      };
    });
    window.LMS_V122_SPLIT_RECIPES=manifest;
    window.dispatchEvent(new Event("lms-v122-presets-ready"));
    return results;
  }

  window.LMS_V122_SPLIT_RECIPES=manifest;
  // The original macOS AU uses bundled factory data (file://), not fetch().
  // postinstall adds one exact, guarded invocation to its minified bi() parser.
  // This hook supports BOTH the native bundled and the HTTP JSON pathways.
  window.LMS_V122_augmentFactory=function(data) {
    const records=Array.isArray(data) ? data : data?.presets;
    if (!Array.isArray(records)) return data;
    const alreadyPresent=records.some(p=>typeof p?.name==="string" &&
      p.name.startsWith(tag));
    if(alreadyPresent) return data;
    const appended=buildSplitFactory(records);
    if(appended.length!==100) return data;
    const all=[...records,...appended];
    return Array.isArray(data) ? all : {...data,presets:all};
  };
  window.fetch=async function(input,options) {
    const reply=await originalFetch(input,options);
    const pathname=typeof input==="string" ? input :
                   input && typeof input.url==="string" ? input.url : "";
    if (!/(?:^|\/)scripts\/presets\.json(?:[?#]|$)/.test(pathname) ||
        !reply || !reply.ok) return reply;
    try {
      const base=await reply.clone().json();
      const collection=Array.isArray(base) ? base : base?.presets;
      if (!Array.isArray(collection)) return reply;
      const body=window.LMS_V122_augmentFactory(base);
      if(body===base) return reply;
      return new Response(JSON.stringify(body),{
        status:200,
        headers:{"Content-Type":"application/json;charset=utf-8"}
      });
    } catch(e) {
      console.error("Liberty V12.2 preset augmentation failed; original bank preserved",e);
      return reply;
    }
  };
})();