/* Pedal Legends V12.2 — genuine 2-bank browser inside the original UI.
 * The original React preset selection button remains responsible for loading
 * all 8 original stages; native JUCE receives only routing/mix choices.
 */
(() => {
  "use strict";
  const parallelPrefix=/^SPLIT \d{3} — /;
  let activeBank="series";
  let queued=false;

  function panel() {return document.querySelector("#main .preset-browser-panel");}
  function recipes() {return window.LMS_V122_SPLIT_RECIPES || new Map();}
  function classification(name) {return parallelPrefix.test(name) ? "parallel" : "series";}

  function addTabs(root) {
    let tabs=root.querySelector(".lms-v122-tabs");
    if(tabs) return tabs;
    tabs=document.createElement("div");
    tabs.className="lms-v122-tabs";
    tabs.setAttribute("role","tablist");
    tabs.setAttribute("aria-label","Banques de presets");
    const data=[
      ["series","PRESETS SÉRIE","100 sons d'origine"],
      ["parallel","PRESETS PARALLÈLE / SPLIT","100 nouveaux sons A/B"]
    ];
    for(const [bank,title,note] of data) {
      const button=document.createElement("button");
      button.type="button";
      button.className="lms-v122-tab";
      button.dataset.lmsBank=bank;
      button.setAttribute("role","tab");
      button.innerHTML='<strong></strong><small></small>';
      button.querySelector("strong").textContent=title;
      button.querySelector("small").textContent=note;
      button.addEventListener("click",()=>{
        activeBank=bank;
        if(bank==="parallel") {
          // The original sidebar has per-style filters for the series bank.
          // Reset to All Tones so the 100 Split recipes are all available.
          const all=root.querySelector(".preset-categories > button");
          if(all && !all.classList.contains("active")) all.click();
        }
        render();
      });
      tabs.appendChild(button);
    }
    const content=root.querySelector(".preset-browser-content");
    if(content) root.insertBefore(tabs,content);
    return tabs;
  }

  function render() {
    queued=false;
    const root=panel();
    if(!root) return;
    const tabs=addTabs(root);
    root.dataset.lmsPresetBank=activeBank;
    for(const tab of tabs.querySelectorAll(".lms-v122-tab")) {
      const active=tab.dataset.lmsBank===activeBank;
      tab.classList.toggle("active",active);
      tab.setAttribute("aria-selected",String(active));
      tab.tabIndex=active?0:-1;
    }
    const map=recipes();
    for(const item of root.querySelectorAll(".preset-result")) {
      const button=item.querySelector(".preset-select-button");
      const title=button?.querySelector("strong")?.textContent?.trim() || "";
      const bank=classification(title);
      item.dataset.lmsPresetBank=bank;
      if(bank!=="parallel") continue;
      const source=map.get(title);
      if(!source) continue;
      const category=button.querySelector(".preset-result-category");
      const categoryText=category?.firstChild;
      if(categoryText?.nodeType===Node.TEXT_NODE &&
         categoryText.nodeValue!=="PARALLÈLE / SPLIT")
        categoryText.nodeValue="PARALLÈLE / SPLIT";
      const description=button.querySelector("p");
      if(description?.firstChild?.nodeType===Node.TEXT_NODE &&
         description.firstChild.nodeValue!==source.description)
        description.firstChild.nodeValue=source.description;
    }
    const count=root.querySelector(".lms-v122-count");
    if(!count) {
      const elt=document.createElement("span");
      elt.className="lms-v122-count";
      root.querySelector(".preset-results-heading")?.appendChild(elt);
    }
    const number=root.querySelector(".lms-v122-count");
    if(number) number.textContent=activeBank==="parallel" ? "BANQUE SPLIT : 100" : "BANQUE SÉRIE : 100";
  }

  function schedule() {
    if(queued) return;
    queued=true;
    requestAnimationFrame(render);
  }

  function sendRoute(payload) {
    const bridge=window.webkit?.messageHandlers?.lmsPresetRouting;
    if(bridge && typeof bridge.postMessage==="function") {
      bridge.postMessage(payload);
      return true;
    }
    return false;
  }

  // Capture only to prevent silently loading an unavailable Split DSP.
  // The original React root *must* handle the button normally when present.
  document.addEventListener("click",event=>{
    const button=event.target?.closest?.(".preset-select-button");
    if(!button || !panel()?.contains(button)) return;
    const title=button.querySelector("strong")?.textContent?.trim() || "";
    if(!title) return;
    const split=recipes().get(title);
    if(split && !window.webkit?.messageHandlers?.lmsPresetRouting) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const warning=panel()?.querySelector(".lms-v122-warning");
      if(warning) warning.textContent="Le routage Split nécessite Pedal Legends JUCE. Sélection annulée.";
    }
  },true);

  // React has selected the actual factory preset by the time the click
  // bubbles up to document; the bridge then recalls its A/B assignment.
  document.addEventListener("click",event=>{
    const button=event.target?.closest?.(".preset-select-button");
    if(!button) return;
    const title=button.querySelector("strong")?.textContent?.trim() || "";
    const split=recipes().get(title);
    const factory=split || title==="Init" ||
      [...recipes().values()].some(x=>x.source===title);
    if(!factory) return; // user presets retain the host's stored routing
    queueMicrotask(()=>{
      if(split) {
        sendRoute({mode:2,lanes:split.lanes,balance:split.balance,
                   preset:title});
      } else {
        sendRoute({mode:0,lanes:[0,0,0,0,1,1,1,1],balance:0.5,
                   preset:title});
      }
    });
  },false);

  // Original preset previous/next arrows are also part of factory browsing.
  // Keep the native Split routing synchronized when using them, not only when
  // a card is clicked inside the full browser.
  document.addEventListener("click",event=>{
    const target=event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("#main .preset-categories .init-preset-button")) {
      queueMicrotask(()=>sendRoute({
        mode:0,lanes:[0,0,0,0,1,1,1,1],balance:0.5,preset:"Init"
      }));
      return;
    }
    if (!target.closest("#main .preset-console-actions .arrow-button")) return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const name=document.querySelector("#main .current-preset-name")?.textContent?.trim();
      if(!name) return;
      const split=recipes().get(name);
      if(split) {
        sendRoute({mode:2,lanes:split.lanes,balance:split.balance,preset:name});
      } else if([...recipes().values()].some(x=>x.source===name)) {
        sendRoute({mode:0,lanes:[0,0,0,0,1,1,1,1],balance:0.5,preset:name});
      }
    }));
  },false);

  document.addEventListener("lms-v122-presets-ready",schedule);
  window.addEventListener("lms-v122-presets-ready",schedule);
  const main=document.getElementById("main");
  if(main) new MutationObserver(mutations=>{
    // React creates the browser lazily; inspect only child-list changes.
    // Avoid scheduling on every value repaint from the audio plugin.
    if(panel() && mutations.some(m=>m.addedNodes.length||m.removedNodes.length))
      schedule();
  }).observe(main,{subtree:true,childList:true});
  schedule();
})();