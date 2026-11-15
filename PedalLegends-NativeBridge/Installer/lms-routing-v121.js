/* Pedal Legends V12.1 - routing is rendered IN the original pedalboard SVG.
 * The 8 assignments arrive from the native JUCE bridge, not from guesses.
 * Serial: original brown cables unchanged. Split: two brown branch cables.
 * Audio processing, pedal order, editing and preset data are untouched.
 */
(() => {
  "use strict";
  const svgNS = "http://www.w3.org/2000/svg";
  const laneNames = ["A", "B"];
  const stageRects = [
    [83, 255, 142], [403, 590, 142], [738, 925, 142], [1073, 1258, 142],
    [83, 255, 466], [403, 590, 466], [738, 925, 466], [1073, 1258, 466]
  ];
  let state = { mode: 0, ready: false, lanes: [0, 0, 0, 0, 1, 1, 1, 1] };
  let pending = false;
  let lastSignature = "";
  let oldSvg = null;

  function svgElement(name, attrs = {}) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  }

  // V12.1.1 — minimal two-rail patch: no zigzags or criss-crossed
  // brown wires. There are always just TWO uninterrupted horizontal paths
  // in the empty corridor between the two original rows of pedals.
  // Each pedal receives a short local connection marker to the rail
  // indicated by its A/B badge, not a cable crossing other pedals.
  const railY = [299, 312];

  function addCable(group, path, extraClass = "") {
    const outline = svgElement("path", {
      d: path, class: "lms-cable-outline " + extraClass
    });
    const wire = svgElement("path", {
      d: path, class: "lms-cable-inner " + extraClass
    });
    group.append(outline, wire);
  }

  function drawLane(group, lane) {
    const y = railY[lane];
    const sub = svgElement("g", {
      class: "lms-cable-lane lms-cable-" + laneNames[lane]
    });
    // One uninterrupted rail from the entrance split to the output merge.
    // The only bends are two short, fixed 45-degree joins at its ends.
    addCable(sub, "M 29 305 L 47 " + y + " H 1293 L 1311 305", "lms-rail");

    // Eight compact connectors at most. All are perpendicular to the rail,
    // extend at most 7 px, and never intersect the opposite brown rail.
    for (let i = 0; i < state.lanes.length; ++i) {
      if (state.lanes[i] !== lane) continue;
      const rect = stageRects[i];
      const x = Math.round((rect[0] + rect[1]) / 2);
      const direction = i < 4 ? -1 : 1;
      const tip = y + direction * 7;
      addCable(sub, "M " + x + " " + y + " V " + tip, "lms-stage-connector");
      sub.append(svgElement("circle", {
        cx:x, cy:y, r:3.8, class:"lms-cable-port"
      }));
    }
    group.append(sub);
  }

  function drawCableJunction(group, x, y) {
    group.append(svgElement("circle", {
      cx:x, cy:y, r:7, class:"lms-cable-junction"
    }));
  }

  function refresh() {
    pending = false;
    const svg = document.querySelector("#main .touring-board svg.patch-cables");
    const slots = [...document.querySelectorAll("#main .pedal-grid .slot-well")];
    if (!svg || slots.length !== 8) return;
    const split = state.mode === 2;
    const signature = [state.mode, +state.ready, ...state.lanes].join(":");
    if (svg === oldSvg && signature === lastSignature &&
        (!split || svg.querySelector(".lms-native-cables"))) return;

    oldSvg = svg;
    lastSignature = signature;
    const originalPath = svg.querySelector("g > path:not(.lms-cable-inner):not(.lms-cable-outline)");
    const prev = svg.querySelector(".lms-native-cables");
    if (prev) prev.remove();
    if (originalPath) originalPath.style.display = split ? "none" : "";
    svg.classList.toggle("lms-is-split", split);
    for (let i = 0; i < slots.length; ++i) {
      const slot = slots[i];
      const old = slot.querySelector(".lms-split-stage-marker");
      if (!split) {
        slot.removeAttribute("data-lms-route");
        if (old) old.remove();
        continue;
      }
      const letter = laneNames[state.lanes[i]];
      slot.dataset.lmsRoute = letter;
      let marker = old;
      if (!marker) {
        marker = document.createElement("span");
        marker.className = "lms-split-stage-marker";
        marker.setAttribute("aria-hidden", "true");
        slot.querySelector(".slot-heading")?.appendChild(marker);
      }
      if (marker) marker.textContent = letter;
    }
    const legend = document.querySelector("#main .chain-legend");
    // Never mutate React-owned text children: only toggle a CSS class.
    if (legend) legend.classList.toggle("lms-chain-split", split);
    if (!split) return;
    const group = svgElement("g", { class: "lms-native-cables", "aria-hidden": "true" });
    // Routes are brown, with subtle copper/gold tint to distinguish branches.
    drawLane(group, 0);
    drawLane(group, 1);
    drawCableJunction(group, 29, 305);
    drawCableJunction(group, 1311, 305);
    svg.appendChild(group);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(refresh);
  }

  // The native host calls this from the embedded WebKit view (8Hz) with the
  // exact routing parameters; no localStorage approximation is permitted.
  window.__lmsV121_updateRouting = payload => {
    if (!payload || !Array.isArray(payload.lanes) || payload.lanes.length !== 8) return;
    const next = {
      mode: [0, 1, 2].includes(payload.mode) ? payload.mode : 0,
      ready: payload.ready === true,
      lanes: payload.lanes.map(v => v === 1 ? 1 : 0)
    };
    if (JSON.stringify(next) === JSON.stringify(state)) {
      if (!document.querySelector(".lms-native-cables") && next.mode === 2) schedule();
      return;
    }
    state = next;
    schedule();
  };
  const root = document.getElementById("main");
  if (root) new MutationObserver(mutations => {
    // Avoid recursive redraws caused by our own SVG updates.
    if (mutations.some(m => m.addedNodes.length &&
        [...m.addedNodes].some(n => n.nodeType === 1 && (
          n.matches?.(".patch-cables,.pedal-grid,.touring-board") ||
          n.querySelector?.(".patch-cables,.pedal-grid"))))) schedule();
  }).observe(root, {childList:true,subtree:true});
  schedule();
})();