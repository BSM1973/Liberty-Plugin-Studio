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

  function connect(from, to, lane) {
    const x1 = from.x, y1 = from.y, x2 = to.x, y2 = to.y;
    const shift = lane ? 10 : -10;
    if (Math.abs(y2 - y1) < 10 && x2 >= x1 && x2 - x1 <= 280) {
      const bend = Math.min(30, (x2 - x1) / 4);
      return 'M' + x1 + ' ' + y1 +
             ' C' + (x1 + bend) + ' ' + (y1 + shift) + ' ' +
             (x2 - bend) + ' ' + (y2 + shift) + ' ' + x2 + ' ' + y2;
    }
    // Travel through the vacant space between the two pedal rows. The SVG is
    // painted behind the pedal enclosures, with cables visible in the gutters.
    const corridor = lane ? 318 : 290;
    const escapeX = x1 + 20;
    const approachX = x2 - 20;
    return 'M' + x1 + ' ' + y1 +
           ' C' + (x1 + 14) + ' ' + y1 + ' ' + escapeX + ' ' + (corridor - 14) +
           ' ' + escapeX + ' ' + corridor +
           ' L' + approachX + ' ' + corridor +
           ' C' + approachX + ' ' + (corridor + 14) + ' ' + (x2 - 14) +
           ' ' + y2 + ' ' + x2 + ' ' + y2;
  }

  function drawLane(group, lane) {
    const slots = state.lanes.map((choice, i) => choice === lane ? i : -1).filter(i => i >= 0);
    const start = { x: 28, y: lane ? 316 : 295 };
    const output = { x: 1311, y: lane ? 316 : 295 };
    const segments = [];
    if (slots.length === 0) {
      segments.push(connect(start, output, lane));
    } else {
      const first = stageRects[slots[0]];
      segments.push(connect(start, { x: first[0], y: first[2] }, lane));
      for (let j = 1; j < slots.length; ++j) {
        const prev = stageRects[slots[j - 1]];
        const next = stageRects[slots[j]];
        segments.push(connect({ x: prev[1], y: prev[2] },
                              { x: next[0], y: next[2] }, lane));
      }
      const last = stageRects[slots[slots.length - 1]];
      segments.push(connect({ x: last[1], y: last[2] }, output, lane));
    }
    const sub = svgElement("g", { class: "lms-cable-lane lms-cable-" + laneNames[lane] });
    for (const d of segments) {
      const outline = svgElement("path", { d, class: "lms-cable-outline" });
      const wire = svgElement("path", { d, class: "lms-cable-inner" });
      sub.append(outline, wire);
    }
    group.append(sub);
  }

  function drawCableJunction(group, x, y) {
    const c = svgElement("circle", { cx: x, cy: y, r: 12, class: "lms-cable-junction" });
    group.append(c);
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
    if (legend) {
      if (split) {
        if (!legend.dataset.lmsOriginal) legend.dataset.lmsOriginal = legend.innerHTML;
        legend.textContent = "ENTRÉE  /  A + B  /  SORTIE";
      } else if (legend.dataset.lmsOriginal) {
        legend.innerHTML = legend.dataset.lmsOriginal;
        delete legend.dataset.lmsOriginal;
      }
    }
    if (!split) return;
    const group = svgElement("g", { class: "lms-native-cables", "aria-hidden": "true" });
    // Routes are brown, with subtle copper/gold tint to distinguish branches.
    drawLane(group, 0);
    drawLane(group, 1);
    drawCableJunction(group, 27, 305);
    drawCableJunction(group, 1313, 305);
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