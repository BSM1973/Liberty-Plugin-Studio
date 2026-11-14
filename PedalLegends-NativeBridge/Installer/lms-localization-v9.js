/* Pedal Legends V9 — French localization for the original PluginMaker WebView.
 * Presentation only: no parameters, preset values, DSP, or identifiers are changed.
 * This script runs after the existing 40-pedal encyclopedia translations.
 */
(() => {
  'use strict';

  const fr = {
    'SAVE':'ENREGISTRER','BROWSE':'PARCOURIR','BYPASS':'DÉSACTIVER',
    'FACTORY / USER':'USINE / UTILISATEUR','FACTORY':'USINE','USER':'UTILISATEUR',
    'PREVIOUS PRESET':'Preset précédent','NEXT PRESET':'Preset suivant',
    'COMPARE COMPLETE PEDALBOARD STATES':'Comparer les deux configurations complètes A/B',
    'A/B COMPARISON; BANK A ACTIVE':'Comparaison A/B : mémoire A active',
    'A/B COMPARISON; BANK B ACTIVE':'Comparaison A/B : mémoire B active',
    'RESET MODEL':'RÉINIT. MODÈLE','COPY':'COPIER','PASTE':'COLLER',
    'EDIT PEDAL':'MODIFIER','ADD PEDAL':'AJOUTER',
    'LIBRARY':'BIBLIOTHÈQUE','REPLACE PEDAL':'REMPLACER LA PÉDALE',
    'PEDAL ON':'PÉDALE ACTIVE','PEDAL MIX':'MÉLANGE','PEDAL LEVEL':'NIVEAU',
    'FOCUSED EDITOR':'ÉDITEUR DE PÉDALE','SIGNAL STAGE':'ÉTAGE AUDIO',
    'ORIGINAL SONIC INTERPRETATION. NO CIRCUIT-LEVEL OR HARDWARE-MATCH CLAIM.':
      'Interprétation sonore originale, sans reproduction garantie du circuit ou du matériel.',
    'MOVES RECALL SETTINGS AT THE NEW STAGE; DELAY TAILS DO NOT MIGRATE.':
      'Le déplacement restaure les réglages au nouvel étage ; les queues de délai ne suivent pas.',
    'MOVE LEFT':'VERS LA GAUCHE','MOVE RIGHT':'VERS LA DROITE',
    'LOAD INTO STAGE':'CHARGER DANS L’ÉTAGE','CHOOSE YOUR NEXT LEGEND.':'Choisissez votre prochaine pédale.',
    'ALL FAMILIES':'TOUTES LES FAMILLES','ALL TONES':'TOUS LES SONS',
    'SEARCH PEDAL NAME, FAMILY OR YEAR':'Rechercher par pédale, famille ou année',
    'SEARCH PEDALS, TONE, FAMILY OR YEAR…':'Rechercher par pédale, son, famille ou année…',
    'CLEAR PEDAL SEARCH':'Effacer la recherche de pédales','FILTER PEDAL FAMILY':'Filtrer les familles',
    'EMPTY SLOT':'EMPLACEMENT VIDE','OPEN STAGE':'EMPLACEMENT LIBRE',
    'NO MATCHING PEDALS. TRY ANOTHER NAME, FAMILY OR YEAR.':
      'Aucune pédale correspondante. Essayez un autre nom, une autre famille ou année.',
    'EXPANDABLE LIBRARY · NO PLACEHOLDER MODELS':
      'BIBLIOTHÈQUE ÉVOLUTIVE · AUCUN MODÈLE FICTIF',
    'PEDAL MODEL LIBRARY':'Bibliothèque de modèles de pédales',
    'LIBERTY FACTORY COLLECTION':'COLLECTION D’USINE LIBERTY',
    'DECADES OF GUITAR STORIES.':'Des décennies d’histoire de la guitare.',
    '10 CURATED CATEGORIES':'10 catégories sélectionnées',
    '13 EFFECT FAMILIES':'13 familles d’effets',
    'ALL TONES':'TOUS LES SONS','FAVORITES':'FAVORIS','USER PRESETS':'PRESETS UTILISATEUR',
    'INIT / RESET':'INITIALISER / RÉINITIALISER',
    'SEARCH PRESETS':'Rechercher des presets',
    'SEARCH PRESET NAMES, DESCRIPTIONS AND STYLES…':
      'Rechercher des noms, descriptions et styles…',
    'CLEAR PRESET SEARCH':'Effacer la recherche',
    'FULL EIGHT-STAGE RECALL':'RAPPEL DES HUIT ÉTAGES',
    'CURRENT':'EN COURS','NO MATCHING TONES. TRY ANOTHER SEARCH OR CATEGORY.':
      'Aucun son correspondant. Essayez une autre recherche ou catégorie.',
    'PREVIOUS':'PRÉCÉDENT','NEXT':'SUIVANT',
    'SAVE USER PRESET':'ENREGISTRER UN PRESET',
    'YOUR OWN LEGEND':'VOTRE PROPRE SON',
    'SAVE THIS PEDALBOARD.':'Enregistrer ce pedalboard.',
    'STORE THE COMPLETE EIGHT-STAGE CHAIN, EVERY PEDAL SETTING AND ALL MASTER CONTROLS AS A USER PRESET.':
      'Enregistrez les huit étages, les réglages de chaque pédale et les commandes principales dans un preset utilisateur.',
    'PRESET NAME':'NOM DU PRESET','USER PRESET NAME':'Nom du preset utilisateur',
    'GIVE YOUR TONE A NAME…':'Donnez un nom à votre son…',
    'CANCEL':'ANNULER','CLOSE':'FERMER','DISMISS NOTIFICATION':'Fermer la notification',
    'SEARCHABLE PRESET BROWSER':'Navigateur de presets avec recherche',
    'SAVE A USER PRESET':'Enregistrer un preset utilisateur',
    'FACTORY TONES':'SONS D’USINE','USER PRESETS':'PRESETS UTILISATEUR',
    'VINTAGE BLUES':'Blues vintage','CLASSIC ROCK':'Rock classique',
    'HARD ROCK':'Hard rock','HEAVY METAL':'Heavy metal','MODERN METAL':'Metal moderne',
    'FUNK AND CLEAN':'Funk et sons clairs','JAZZ AND WARM':'Jazz et sons chaleureux',
    'AMBIENT AND CINEMATIC':'Ambient et cinématique',
    'PSYCHEDELIC AND EXPERIMENTAL':'Psychédélique et expérimental',
    'STUDIO ESSENTIALS':'Essentiels du studio',
    'EMPTY PASS-THROUGH':'Passage du signal sans effet',
    'USER PRESETS':'PRESETS UTILISATEUR',
    'YOUR SAVED COMPLETE PEDALBOARD STATE.':'Votre configuration complète enregistrée.',
    'DEFAULT PEDALBOARD':'PEDALBOARD PAR DÉFAUT',
    'EDITED PEDALBOARD':'Pedalboard modifié',
    'UNSAVED CHANGES':'MODIFICATIONS NON ENREGISTRÉES',
    'ENTER A NAME FOR YOUR USER PRESET.':'Saisissez un nom pour votre preset.',
    'CHOOSE A UNIQUE NAME; EXISTING PRESETS ARE NOT OVERWRITTEN.':
      'Choisissez un nom unique : les presets existants ne sont pas écrasés.',
    'THE HOST COULD NOT SAVE THIS PRESET. YOUR CURRENT PEDALBOARD IS UNCHANGED.':
      'Le DAW n’a pas pu enregistrer ce preset. Votre pedalboard reste inchangé.',
    'MASTER':'PRINCIPAL','SIGNAL':'SIGNAL',
    'INPUT':'ENTRÉE','OUTPUT':'SORTIE','GLOBAL MIX':'MÉLANGE GLOBAL',
    'INPUT PEAK':'CRÊTE D’ENTRÉE','OUTPUT PEAK':'CRÊTE DE SORTIE',
    'INPUT NOISE MANAGEMENT':'GESTION DU BRUIT D’ENTRÉE',
    'STEREO LINKED · NO ADDED HISS':'Stéréo liée · sans bruit ajouté',
    'NOISE GATE':'PORTE DE BRUIT','THRESHOLD':'SEUIL',
    'VINTAGE SOUL':'ÂME VINTAGE','MODERN POWER':'PUISSANCE MODERNE',
    'PEDAL HISTORY':'HISTOIRE DE LA PÉDALE',
    'THE LIBERTY COLLECTION':'LA COLLECTION LIBERTY',
    '40 ORIGINAL PEDALS':'40 PÉDALES ORIGINALES',
    'COMPRESSOR & LIMITER':'COMPRESSEUR ET LIMITEUR',
    'OVERDRIVE':'SATURATION','EQ & FILTER':'ÉGALISATION ET FILTRE',
    'MODULATION':'MODULATION','DELAY & ECHO':'DÉLAI ET ÉCHO',
    'REVERB':'RÉVERBÉRATION','ON':'ACTIF','OFF':'INACTIF',
    'EMPTY':'VIDE','EDIT':'MODIFIER','ADD':'AJOUTER',
    'ORIGINAL MODEL':'MODÈLE ORIGINAL','ENGAGED':'ACTIVÉ',
    'STAGE':'ÉTAGE','TONE':'TONALITÉ','GAIN':'GAIN',
    'RATIO':'RATIO','ATTACK':'ATTAQUE','RELEASE':'RELÂCHEMENT',
    'DRIVE':'SATURATION','BASS':'GRAVES','MID':'MÉDIUMS',
    'TREBLE':'AIGUS','PRESENCE':'PRÉSENCE','RATE':'VITESSE',
    'DEPTH':'PROFONDEUR','FEEDBACK':'RÉINJECTION','TIME':'TEMPS',
    'DECAY':'DURÉE','DAMPING':'AMORTISSEMENT','SIZE':'TAILLE',
    'MIX':'MÉLANGE','LEVEL':'NIVEAU','POWER':'ALIMENTATION',
    'WET':'TRAITÉ','DRY':'DIRECT','SPEED':'VITESSE','WIDTH':'LARGEUR',
    'FILTER':'FILTRE','FREQUENCY':'FRÉQUENCE','RESONANCE':'RÉSONANCE',
    'TAP TEMPO':'TEMPO MANUEL','SYNC':'SYNCHRO',
    'PRESET':'PRESET','BANK':'BANQUE','NAME':'NOM',
    'PRESET BROWSER':'NAVIGATEUR DE PRESETS','PEDAL BROWSER':'NAVIGATEUR DE PÉDALES',
    'EFFECT':'EFFET','STYLE':'STYLE','YEAR':'ANNÉE','FAMILY':'FAMILLE',
    'FAVORITE':'FAVORI','FAVORITES':'FAVORIS',
    'RESET':'RÉINITIALISER','CLEAR':'EFFACER','LOAD':'CHARGER',
    'SELECT':'SÉLECTIONNER','SAVE AS':'ENREGISTRER SOUS',
    'ALL':'TOUT','SEARCH':'RECHERCHER','NO RESULTS':'AUCUN RÉSULTAT',
    'COMPARE':'COMPARER','COPY SETTINGS':'COPIER LES RÉGLAGES',
    'PASTE SETTINGS':'COLLER LES RÉGLAGES',
    'A/B':'A/B'
  };

  const normalized = text => String(text || '')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ').trim().toLocaleUpperCase('en-US');

  const lookup = new Map(Object.entries(fr).map(([english, french]) => [normalized(english), french]));
  const recordedText = new WeakMap();
  const recordedAttrs = new WeakMap();
  let pending = false;
  let lastLang = '';
  function language() {
    return document.querySelector('.lms-encyclopedia-tool select')?.value
      || (() => { try { return localStorage.getItem('lms-pedal-lang'); } catch { return null; } })()
      || 'fr';
  }

  function french(text) {
    const clean = String(text ?? '').trim();
    const key = normalized(clean);
    if (!key) return null;
    if (lookup.has(key)) return lookup.get(key);
    let m;
    if ((m = clean.match(/^(\d+)\s+working models?$/i)))
      return m[1] + ' modèles fonctionnels';
    if ((m = clean.match(/^(\d+)\s+factory tones?$/i)))
      return m[1] + ' sons d’usine';
    if ((m = clean.match(/^(\d+)\s+user presets?$/i)))
      return m[1] + ' presets utilisateur';
    if ((m = clean.match(/^(\d+)\s+available matches?$/i)))
      return m[1] + ' résultats disponibles';
    if ((m = clean.match(/^(\d+)\s+tones?$/i)))
      return m[1] + ' sons';
    if ((m = clean.match(/^(\d+)\s+factory tones?\s*\+\s*Init$/i)))
      return m[1] + ' sons d’usine + Init';
    if ((m = clean.match(/^(\d+)\s+working models?$/i)))
      return m[1] + ' modèles disponibles';
    if ((m = clean.match(/^(\d+)\s+curated categories$/i)))
      return m[1] + ' catégories sélectionnées';
    if ((m = clean.match(/^(\d+)\s+effect families$/i)))
      return m[1] + ' familles d’effets';
    if ((m = clean.match(/^\u2039\s*MOVE LEFT$/i)))
      return '‹ DÉPLACER À GAUCHE';
    if ((m = clean.match(/^MOVE RIGHT\s*\u203a$/i)))
      return 'DÉPLACER À DROITE ›';
    if ((m = clean.match(/^\u2039\s*PREVIOUS$/i)))
      return '‹ PRÉCÉDENT';
    if ((m = clean.match(/^NEXT\s*\u203a$/i)))
      return 'SUIVANT ›';
    if ((m = clean.match(/^\u21ba?\s*INIT\s*\/\s*RESET$/i)))
      return '↺ RÉINITIALISER';
    if ((m = clean.match(/^\u2605\s*FAVORITES$/i)))
      return '★ FAVORIS';
    if ((m = clean.match(/^\u25cf\s*CURRENT$/i)))
      return '● EN COURS';
    if ((m = clean.match(/^LOAD INTO STAGE\s*(\d+)$/i)))
      return 'CHARGER DANS L’ÉTAGE ' + m[1];
    if ((m = clean.match(/^Stage (\d+) reset to this model.s defaults\.$/i)))
      return 'Étage ' + m[1] + ' réinitialisé aux réglages du modèle.';
    if ((m = clean.match(/^Stage (\d+) copied, including model, bypass and all settings\.$/i)))
      return 'Étage ' + m[1] + ' copié avec modèle, activation et réglages.';
    if ((m = clean.match(/^Copied settings pasted into stage (\d+)\.$/i)))
      return 'Réglages copiés dans l’étage ' + m[1] + '.';
    if ((m = clean.match(/^Stages (\d+) and (\d+) exchanged/i)))
      return 'Étages ' + m[1] + ' et ' + m[2] + ' échangés : ordre audio modifié.';
    if ((m = clean.match(/^Comparison ([AB]) recalled\./i)))
      return 'Comparaison ' + m[1] + ' rappelée. Les deux mémoires conservent les huit étages et les réglages généraux.';
    if ((m = clean.match(/^User preset [“"](.+)[”"] saved\.$/i)))
      return 'Preset utilisateur « ' + m[1] + ' » enregistré.';
    return null;
  }

  // Do not rewrite names of specific physical pedals, preset titles or user data.
  const skip = 'script,style,textarea,input,[contenteditable="true"],' +
    '.lms-encyclopedia-dialog,.lms-encyclopedia-shade,' +
    '.pedal-model-name,.current-preset-name,.preset-item-name,.preset-name,' +
    '.lms-pedal-picture,.lms-chooser';

  function rewriteText(node, lang) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;
    const parent = node.parentElement;
    if (parent.closest(skip)) return;
    const now = node.nodeValue;
    if (lang !== 'fr') {
      const old = recordedText.get(node);
      if (old && now === old.fr) {
        node.nodeValue = old.en;
        recordedText.delete(node);
      }
      return;
    }
    const text = String(now || '');
    if (!text.trim()) return;
    const result = french(text);
    if (!result || result === text.trim()) return;
    const prefix = text.match(/^\s*/)?.[0] || '';
    const suffix = text.match(/\s*$/)?.[0] || '';
    const replaced = prefix + result + suffix;
    if (replaced === now) return;
    recordedText.set(node, {en: now, fr: replaced});
    node.nodeValue = replaced;
  }

  function rewriteAttributes(el, lang) {
    if (el.closest(skip)) return;
    for (const attr of ['title','aria-label','placeholder']) {
      if (!el.hasAttribute(attr)) continue;
      const now = el.getAttribute(attr);
      const existing = recordedAttrs.get(el)?.[attr];
      if (lang !== 'fr') {
        if (existing && now === existing.fr) {
          el.setAttribute(attr, existing.en);
          const store = recordedAttrs.get(el); delete store[attr];
        }
        continue;
      }
      const newText = french(now);
      if (!newText || newText === now) continue;
      const store = recordedAttrs.get(el) || {};
      store[attr] = {en: now, fr: newText};
      recordedAttrs.set(el, store);
      el.setAttribute(attr, newText);
    }
  }

  function update() {
    pending = false;
    const main = document.getElementById('main');
    if (!main) return;
    const lang = language();
    if (lastLang !== lang) lastLang = lang;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) rewriteText(node, lang);
    for (const el of main.querySelectorAll('[title],[aria-label],[placeholder]'))
      rewriteAttributes(el, lang);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }
  const main = document.getElementById('main');
  if (main) {
    const observer = new MutationObserver(schedule);
    observer.observe(main, {subtree:true,childList:true,characterData:true,attributes:true,
                            attributeFilter:['aria-label','title','placeholder']});
  }
  document.addEventListener('change', event => {
    if (event.target?.closest?.('.lms-encyclopedia-tool')) schedule();
  }, true);
  schedule();
})();