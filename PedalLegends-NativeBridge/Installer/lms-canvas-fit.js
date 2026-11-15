/* Pedal Legends — measured native canvas fit (no pageZoom, no body zoom).
 * The original Audio Unit React UI is exactly 1440x960 in webview mode.
 * Keep a single 2D transform on #plugin-body; JUCE owns the outer size.
 * The native bridge passes the real available editor bounds, which avoids
 * relying on WKWebView's possibly stale window.innerWidth/innerHeight.
 */
(() => {
  "use strict";
  const CANVAS_WIDTH = 1440;
  const CANVAS_HEIGHT = 960;
  let reservedWidth = 0;
  let reservedHeight = 0;
  let scheduled = false;

  function fit() {
    scheduled = false;
    const root = document.getElementById("plugin-body");
    if (!root) return;
    const viewportWidth = reservedWidth || window.innerWidth;
    const viewportHeight = reservedHeight || window.innerHeight;
    if (viewportWidth < 300 || viewportHeight < 300) return;

    const scale = Math.min(viewportWidth / CANVAS_WIDTH,
                           viewportHeight / CANVAS_HEIGHT);
    // The root owns 1440x960 logical coordinates. This one transform scales
    // layout and pointer targets together. Never set web.pageZoom.
    const scaledWidth = CANVAS_WIDTH * scale;
    const scaledHeight = CANVAS_HEIGHT * scale;
    const dx = Math.max(0, (viewportWidth - scaledWidth) * .5);
    const dy = Math.max(0, (viewportHeight - scaledHeight) * .5);

    root.style.setProperty("width", CANVAS_WIDTH + "px", "important");
    root.style.setProperty("height", CANVAS_HEIGHT + "px", "important");
    root.style.setProperty("position", "absolute", "important");
    root.style.setProperty("top", "0px", "important");
    root.style.setProperty("left", "0px", "important");
    root.style.setProperty("margin", "0px", "important");
    root.style.setProperty("transform-origin", "0 0", "important");
    root.style.setProperty("transform",
      "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px) scale(" + scale.toFixed(6) + ")",
      "important");

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.zoom = "1";
    const host = document.getElementById("main");
    if (host) {
      host.style.width = viewportWidth + "px";
      host.style.height = viewportHeight + "px";
      host.style.overflow = "hidden";
      host.style.position = "relative";
    }
    // An obsolete PluginMaker HTML resizing affordance must not act as
    // the resizing control for this hosted plugin.
    document.querySelectorAll("[data-pm-window-layer]").forEach(el => {
      el.style.display = "none";
    });
    document.documentElement.dataset.lmsCanvasFit = scale.toFixed(4);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(fit);
  }

  window.__lmsFitViewport = function(width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height) ||
        width < 300 || height < 300) return;
    if (reservedWidth === width && reservedHeight === height &&
        document.getElementById("plugin-body")?.style.transform) return;
    reservedWidth = width;
    reservedHeight = height;
    schedule();
  };

  window.addEventListener("resize", schedule);
  new MutationObserver(() => {
    if (document.getElementById("plugin-body") && !document.documentElement.dataset.lmsCanvasFit)
      schedule();
  }).observe(document.getElementById("main") || document.body, {childList:true});
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", schedule, {once:true});
  else schedule();
})();