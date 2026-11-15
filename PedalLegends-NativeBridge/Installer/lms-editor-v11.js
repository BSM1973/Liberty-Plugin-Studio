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

  // History click handling is centralized in lms-history-v121.js.

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