/* Pedal Legends V12.1.2 — explicit signal-flow routing.
 * The two separate pedal chains are drawn in the NATIVE JUCE routing header,
 * where they can show the real stage order without crossing the fixed 4x2
 * physical pedal layout. In Split, the ornamental old brown chain is hidden.
 * The physical pedal widgets remain in their existing slots and retain a
 * clear A/B badge matching the stage assignment. No DSP/preset mutations.
 */
(() => {
  "use strict";
  const letters = ["A","B"];
  let state = {mode:0,ready:false,lanes:[0,0,0,0,1,1,1,1]};
  let pending = false, oldSvg = null, lastSignature = "";

  function update() {
    pending = false;
    const svg = document.querySelector("#main .touring-board svg.patch-cables");
    const slots = [...document.querySelectorAll("#main .pedal-grid .slot-well")];
    if (!svg || slots.length !== 8) return;
    const split = state.mode === 2;
    const signature = [state.mode, +state.ready, ...state.lanes].join(":");
    if (svg === oldSvg && signature === lastSignature &&
        (!split || slots.every(el => el.dataset.lmsRoute))) return;

    oldSvg = svg;
    lastSignature = signature;

    // A two-rail ornamental cable can never convey A->(1,3,6) and
    // B->(2,4,5) on a fixed 4x2 grid. The native diagram above does.
    svg.style.visibility = split ? "hidden" : "";
    svg.classList.toggle("lms-is-split", split);
    const obsolete = svg.querySelector(".lms-native-cables");
    if (obsolete) obsolete.remove();

    for (let i = 0; i < 8; ++i) {
      const slot = slots[i];
      const heading = slot.querySelector(".slot-heading");
      const existing = slot.querySelector(".lms-split-stage-marker");
      if (!split) {
        slot.removeAttribute("data-lms-route");
        if (existing) existing.remove();
        continue;
      }
      const lane = letters[state.lanes[i]];
      slot.dataset.lmsRoute = lane;
      let badge = existing;
      if (!badge && heading) {
        badge = document.createElement("span");
        badge.className = "lms-split-stage-marker";
        badge.setAttribute("aria-hidden","true");
        heading.appendChild(badge);
      }
      if (badge && badge.textContent !== lane) badge.textContent = lane;
    }
    // Do not rewrite React-owned text, which would break future updates.
    const legend = document.querySelector("#main .chain-legend");
    if (legend) legend.classList.toggle("lms-chain-split", split);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }
  // Existing native WebKit bridge API stays identical.
  window.__lmsV121_updateRouting = payload => {
    if (!payload || !Array.isArray(payload.lanes) ||
        payload.lanes.length !== 8) return;
    const next = {
      mode: [0,1,2].includes(payload.mode) ? payload.mode : 0,
      ready: payload.ready === true,
      lanes: payload.lanes.map(v => v === 1 ? 1 : 0)
    };
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    schedule();
  };
  const root = document.getElementById("main");
  if (root) new MutationObserver(mutations => {
    if (mutations.some(m => m.addedNodes.length &&
        [...m.addedNodes].some(n => n.nodeType === 1 &&
          (n.matches?.(".patch-cables,.pedal-grid,.touring-board") ||
           n.querySelector?.(".patch-cables,.pedal-grid"))))) schedule();
  }).observe(root,{subtree:true,childList:true});
  schedule();
})();