/* Pedal Legends V12.1 - one and only one robust History action.
 * Previous V11 click handler removed. This captures actual pointer presses
 * anywhere within the button's visual rectangle (including inner edges).
 */
(() => {
  "use strict";
  let lastOpen = { name:"", time:0 };
  const selector = "#main .edit-panel .panel-topline .lms-focused-history";

  function eligible(event) {
    if (event.target?.closest?.(".lms-encyclopedia-shade")) return null;
    const buttons = document.querySelectorAll(selector);
    for (const button of buttons) {
      const box = button.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (event.target === button || button.contains(event.target) ||
          (Number.isFinite(event.clientX) && Number.isFinite(event.clientY) &&
           event.clientX >= box.left && event.clientX <= box.right &&
           event.clientY >= box.top && event.clientY <= box.bottom)) return button;
    }
    return null;
  }

  function launch(button) {
    const panel = button.closest(".edit-panel");
    if (!panel) return false;
    const name = panel.querySelector(".panel-topline h2")?.textContent?.trim();
    if (!name || !window.LMS_PEDAL_DATA?.pedals?.some(model => model.name === name))
      return false;
    // Avoid duplicate openings on pointerdown + subsequent synthetic click.
    const now = performance.now();
    if (lastOpen.name === name && now - lastOpen.time < 400) return true;
    const overline = panel.querySelector(".panel-topline .small-overline")?.textContent || "";
    const match = overline.match(/(?:STAGE|ÉTAGE)\s*(\d{1,2})/i);
    lastOpen = { name, time:now };
    const slot = match ? Math.max(0, Math.min(7, Number(match[1]) - 1)) : undefined;
    window.dispatchEvent(new CustomEvent("lms-open-history", {detail:{name,slot}}));
    return true;
  }

  function handlePointer(event) {
    if (event.type === "pointerdown" && event.button !== 0) return;
    const button = eligible(event);
    if (!button) return;
    if (!launch(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  document.addEventListener("pointerdown", handlePointer, true);
  // WKWebView versions that synthesize clicks without pointer events.
  document.addEventListener("click", handlePointer, true);

  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const button = event.target?.closest?.(selector);
    if (button && launch(button)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();