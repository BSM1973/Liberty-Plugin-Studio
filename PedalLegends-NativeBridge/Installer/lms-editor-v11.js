/* Pedal Legends V11 - targeted original-editor repair.
 * Uses the original model data as an EXACT key, never alters a pedal parameter.
 * The prior generic vocabulary translator did not translate the 40 description
 * sentences shown under each large pedal in the editor.
 */
(() => {
  "use strict";
  function currentLang() {
    const select = document.querySelector(".lms-encyclopedia-tool select");
    if (select && select.value) return select.value;
    try { return localStorage.getItem("lms-pedal-lang") || "fr"; }
    catch { return "fr"; }
  }
  const previous = new WeakMap();
  function updateEditorDescriptions() {
    const englishIndex = window.LMS_PEDAL_DATA?.pedals;
    const frenchIndex = window.LMS_TECHNICAL_FR;
    if (!Array.isArray(englishIndex) || englishIndex.length !== 40 || !frenchIndex) return;
    const fr = currentLang() === "fr";
    for (const panel of document.querySelectorAll("#main .edit-panel")) {
      const paragraph = panel.querySelector(".edit-illustration > p");
      if (!paragraph) continue;
      const title = panel.querySelector(".panel-topline h2")?.textContent?.trim();
      const pedal = englishIndex.find(p => p.name === title)
                 || englishIndex.find(p => p.technical_en === paragraph.textContent?.trim());
      if (!pedal) continue;
      const translation = frenchIndex[pedal.id];
      if (!translation) continue;
      const desired = fr ? translation : pedal.technical_en;
      if (paragraph.textContent !== desired) {
        // Preserve any text authored by the user (the editor description is
        // model supplied but this check also avoids overwriting unrelated text).
        const now = paragraph.textContent?.trim() || "";
        if (now !== pedal.technical_en && now !== translation) continue;
        paragraph.textContent = desired;
      }
    }
  }

  // Original React button already dispatches "lms-open-history", but the
  // label is not always an effective hit target where the editor is scaled.
  // Resolve the complete *visible rectangle* in capture phase, even when a
  // sibling element receives the DOM hit due to the panel header's stacking.
  function getHistoryButtonAtEvent(event) {
    if (!(event.target instanceof Element)) return null;
    if (event.target.closest(".lms-encyclopedia-shade")) return null;
    const hit = event.target.closest("#main .edit-panel .panel-topline .lms-focused-history");
    if (hit) return hit;
    for (const button of document.querySelectorAll("#main .edit-panel .panel-topline .lms-focused-history")) {
      const box = button.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      if (event.clientX >= box.left && event.clientX <= box.right &&
          event.clientY >= box.top && event.clientY <= box.bottom)
        return button;
    }
    return null;
  }

  function dispatchHistory(button) {
    const panel = button.closest(".edit-panel");
    const name = panel?.querySelector(".panel-topline h2")?.textContent?.trim();
    if (!name) return false;
    const model = window.LMS_PEDAL_DATA?.pedals?.find(p => p.name === name);
    if (!model) return false;
    const overline = panel.querySelector(".panel-topline .small-overline")?.textContent || "";
    const match = overline.match(/(?:STAGE|ÉTAGE)\s*(\d{1,2})/i);
    const slot = match ? Math.max(0, Number(match[1]) - 1) : undefined;
    window.dispatchEvent(new CustomEvent("lms-open-history", { detail: { name, slot } }));
    return true;
  }

  document.addEventListener("click", event => {
    const button = getHistoryButtonAtEvent(event);
    if (!button) return;
    if (dispatchHistory(button)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener("keydown", event => {
    if ((event.key !== "Enter" && event.key !== " ") ||
        !(event.target instanceof Element)) return;
    const button = event.target.closest("#main .edit-panel .panel-topline .lms-focused-history");
    if (button && dispatchHistory(button)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  let pending = false;
  const refresh = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; updateEditorDescriptions(); });
  };
  const root = document.getElementById("main");
  if (root) new MutationObserver(refresh).observe(root, { childList: true, subtree: true, characterData: true });
  document.addEventListener("change", event => {
    if (event.target?.closest?.(".lms-encyclopedia-tool")) refresh();
  }, true);
  refresh();
})();