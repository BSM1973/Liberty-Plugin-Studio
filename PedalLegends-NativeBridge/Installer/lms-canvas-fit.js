/* Pedal Legends native fit — preserve the 1440x960 original React canvas.
 * PluginMaker wraps that canvas in its own scaled viewport and decorative
 * window title. Hide only the redundant host chrome and override the scaler
 * with a stylesheet !important, which survives React inline style updates.
 * No transform is ever applied to #plugin-body itself.
 */
(() => {
  "use strict";
  const baseWidth = 1440, baseHeight = 960;
  let width = window.innerWidth, height = window.innerHeight;
  const style = document.createElement("style");
  style.textContent = `
.lms-native-topbar,.lms-native-fake-title{display:none!important}
.lms-native-layout{padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important}
.lms-native-frame{width:var(--lms-frame-w)!important;height:var(--lms-frame-h)!important;flex-shrink:0!important;margin:0!important}
.lms-native-viewport{width:var(--lms-frame-w)!important;height:var(--lms-frame-h)!important;border-radius:0!important;overflow:hidden!important}
.lms-native-scaler{transform:scale(var(--lms-fit-scale))!important;transform-origin:top left!important;width:1440px!important;height:960px!important}
`;
  document.head.appendChild(style);

  function fit() {
    const root = document.getElementById("plugin-body");
    if (!root) return;
    const scaler = root.parentElement;
    const viewport = scaler?.parentElement;
    const frame = viewport?.parentElement;
    const layout = frame?.parentElement;
    const shell = layout?.parentElement;
    if (!scaler || !viewport || !frame || !layout || !shell) return;

    const ratio = Math.min(width / baseWidth, height / baseHeight);
    const frameWidth = baseWidth * ratio, frameHeight = baseHeight * ratio;
    const title = frame.firstElementChild, bar = shell.firstElementChild;
    if (title && title !== viewport) title.classList.add("lms-native-fake-title");
    if (bar && bar !== layout) bar.classList.add("lms-native-topbar");
    scaler.classList.add("lms-native-scaler");
    viewport.classList.add("lms-native-viewport");
    frame.classList.add("lms-native-frame");
    layout.classList.add("lms-native-layout");

    document.documentElement.style.setProperty("--lms-fit-scale", ratio.toFixed(8));
    document.documentElement.style.setProperty("--lms-frame-w", frameWidth + "px");
    document.documentElement.style.setProperty("--lms-frame-h", frameHeight + "px");
  }

  window.__lmsFitViewport = (w, h) => {
    if (Number.isFinite(w) && Number.isFinite(h) && w >= 300 && h >= 300) {
      width = w;
      height = h;
    }
    fit();
  };
  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    fit();
  });
  const observer = new MutationObserver(() => {
    if (document.getElementById("plugin-body")) fit();
  });
  observer.observe(document.getElementById("main") || document.body,
                   {childList: true, subtree: true});
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", fit, {once: true});
  else fit();
})();