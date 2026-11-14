/* Liberty Pedal Legends V6 — cosmetic webview patch, never touches audio processing. */
(() => {
  'use strict';
  let scheduled = false;
  const footers = {
    fr: n => `LIBERTY PEDAL LEGENDS · ${n} modèles originaux intégrés · huit étages stéréo en série`,
    en: n => `LIBERTY PEDAL LEGENDS · ${n} implemented original models · eight serial stereo stages`,
    es: n => `LIBERTY PEDAL LEGENDS · ${n} modelos originales integrados · ocho etapas estéreo en serie`,
    de: n => `LIBERTY PEDAL LEGENDS · ${n} Originalmodelle integriert · acht serielle Stereostufen`,
    it: n => `LIBERTY PEDAL LEGENDS · ${n} modelli originali integrati · otto stadi stereo in serie`
  };
  function update() {
    scheduled = false;
    const heading = document.querySelector('#main .board-heading');
    const tool = document.querySelector('.lms-encyclopedia-tool');
    if (heading && tool) {
      const legend = heading.querySelector('.chain-legend');
      if (tool.parentElement !== heading || (legend && tool.nextElementSibling !== legend))
        heading.insertBefore(tool, legend);
    }
    const lang = tool?.querySelector('select')?.value || 'fr';
    const footer = document.querySelector('#main .liberty-footer > span:first-child');
    if (footer && footers[lang]) {
      const n = footer.textContent.match(/\b(\d+)\b/)?.[1] || '40';
      const target = footers[lang](n);
      if (footer.textContent !== target) footer.textContent = target;
    }
    const gateCaption = document.querySelector('#main .gate-caption');
    if (gateCaption) {
      const labels = {
        fr: 'Stéréo liée · sans bruit ajouté',
        en: 'Stereo linked · no added hiss',
        es: 'Estéreo vinculado · sin ruido añadido',
        de: 'Stereo verbunden · ohne zusätzliches Rauschen',
        it: 'Stereo collegato · nessun fruscio aggiunto'
      };
      if (labels[lang] && gateCaption.textContent !== labels[lang])
        gateCaption.textContent = labels[lang];
    }
  }
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  }
  new MutationObserver(schedule).observe(document.body, {subtree: true, childList: true, characterData: true});
  schedule();
})();