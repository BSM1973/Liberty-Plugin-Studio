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

  // V8 - Traduction technique intégrale des 40 fiches. Conserve la source
  // anglaise : le texte affiché n'est modifié que lorsque FR est sélectionné.
  const technicalFrench = {
  "1": "Écrêtage doux privilégiant les médiums et certaines fréquences, avec un chemin de signal clair dans le grave et une compression dynamique simulant l'affaissement de l'alimentation.",
  "2": "Séparation du signal en bandes : graves conservés en clair et saturation asymétrique à diodes, puis recombinaison avec un filtre en plateau dans l'aigu.",
  "3": "Deux étages d'écrêtage progressif à faible gain, associés à un circuit de tonalité britannique large et ouvert.",
  "4": "Écrêtage asymétrique à diodes sensible à l'attaque, avec polarisation réglable et préservation parallèle de l'articulation du signal clair.",
  "5": "Saturation en cascade inspirée des lampes, avec filtre coupe-bas entre les étages, compression d'alimentation et présence dans les hauts médiums.",
  "6": "Écrêtage dur à diodes après une préaccentuation des aigus, suivi d'un filtre de coupure indépendant pour façonner la couleur sonore.",
  "7": "Saturation dure en deux étages, contour de médiums résonant et nettoyage du signal d'entrée pour conserver la précision à gain élevé.",
  "8": "Distorsion parallèle des bandes graves et aiguës avec deux comportements d'écrêtage distincts : davantage de corps sans perdre l'attaque des accords.",
  "9": "Trois étages de saturation avec filtrage passe-haut entre les étages, graves resserrés et porte de bruit réglable.",
  "10": "Fuzz vintage asymétrique sensible au niveau d'entrée, avec polarisation réglable, compression d'alimentation, nettoyage des graves et aigus adoucis.",
  "11": "Fuzz rapide et brillant inspiré d'un circuit à deux étages de transistors, avec écrêtage marqué et mordant dans les hauts médiums.",
  "12": "Fuzz à polarisation volontairement réduite et effet de coupure : Gate règle le seuil de l'enveloppe et Body préserve la densité des graves.",
  "13": "Génération d'une octave supérieure par redressement double alternance, injectée dans un trajet fuzz puis mélangée au son fondamental. Adapté surtout aux lignes monophoniques.",
  "14": "Amplification transparente sur toute la bande passante, avec protection douce contre la surcharge et sans ajout de bruit artificiel.",
  "15": "Booster à transistors ciblant les aigus, avec réduction réglable des graves et saturation asymétrique.",
  "16": "Préamplificateur de studio à deux bandes, avec légère coloration inspirée des lampes, réserve dynamique réglable et réponse de sortie musicale.",
  "17": "Compression rapide des crêtes de type vintage, à transition douce et maintien parallèle du signal ; détecteur lié entre les canaux stéréo.",
  "18": "Compression RMS souple inspirée d'un système optique, avec relâchement dépendant du signal et réglage du gain à transition progressive.",
  "19": "Limiteur-compresseur de crêtes à détection stéréo liée, taux de compression élevé, attaque rapide et transition réglable. Aucune latence d'anticipation.",
  "20": "Égalisation musicale à trois bandes : plateau grave, médiums paramétriques larges et plateau aigu, avec filtre passe-haut préservant le grave utile.",
  "21": "Deux bandes paramétriques en cloche entièrement réglables, chacune avec fréquence, gain et facteur Q indépendants, pour des corrections précises ou larges.",
  "22": "Filtre résonant à topologie préservée, stable, proposant des modes passe-bas, passe-bande, passe-haut et coupe-bande (notch).",
  "23": "Wah vocal résonant commandé à la souris. Le contrôle Expression balaie la fréquence en continu ; aucune commande d'expression MIDI externe n'est revendiquée.",
  "24": "Wah passe-bande à enveloppe sensible à l'attaque, avec balayage ascendant ou descendant, détecteur lié au signal d'entrée et relâchement rapide.",
  "25": "Filtre passe-bas à enveloppe adapté à la basse, avec chemin parallèle préservant les graves non traités et balayage résonant stable.",
  "26": "Chorus à deux lignes de délai fractionnaire déphasées, avec largeur stéréo, légère réinjection et contrôle de bande passante de type vintage.",
  "27": "Phaser à six étages passe-tout avec réinjection, creux spectraux mobiles et étalement de phase stéréo réglable.",
  "28": "Flanger à court délai fractionnaire produisant un filtrage en peigne, avec réinjection positive ou négative et modulation stéréo. Texture ajuste le temps de base.",
  "29": "Vibrato de hauteur fondé sur une trajectoire régulière de délai variable, appliqué uniquement au signal traité. Mix permet d'ajouter le signal non modulé.",
  "30": "Trémolo sinusoïdal, triangulaire, carré adouci ou harmonique. Synchronisation facultative des subdivisions au tempo de l'hôte ; sinon, vitesse libre.",
  "31": "Traitement inspiré d'une cabine rotative avec séparation des bandes : tambour lent et pavillon plus rapide, chacun avec effet Doppler, modulation d'amplitude et largeur stéréo.",
  "32": "Écho à bande stéréo avec saturation, répétitions filtrées, fluctuations lentes et rapides de vitesse (wow et flutter), et réinjection croisée réglable.",
  "33": "Écho à deux lignes de délai inspiré des circuits à transfert de charges (BBD), avec répétitions filtrées en passe-bas, compression-expansion et légère modulation d'horloge.",
  "34": "Délai numérique stéréo transparent, avec réinjection croisée ping-pong réglable, filtrage des répétitions et modulation discrète.",
  "35": "Simulation de réservoir à ressorts par filtres passe-tout dispersifs, courtes lignes de réinjection de durées différentes et retour à bande limitée. Approximation originale, pas capture de matériel.",
  "36": "Réseau dense de huit lignes à réinjection orthogonale, avec courte diffusion en entrée, décroissance de type plaque régulière et décorrélation stéréo.",
  "37": "Réverbération de type grande salle à huit lignes, taille variable, diffusion d'entrée étendue, décroissance dépendante de la fréquence et retour stéréo spacieux.",
  "38": "Diviseur d'octave monophonique fondé sur les passages par zéro après conditionnement de l'entrée ; filtrage de la sous-octave et suivi à porte réglables. Notes isolées uniquement.",
  "39": "Harmoniseur à délai tenant compte de la période détectée, proposant deux intervalles chromatiques fixes pour les lignes monophoniques. La fenêtre suit des périodes entières ; pas de reconnaissance de gamme ni de suivi polyphonique.",
  "40": "Réseau musical de délais diffusés et modulés, avec réinjection croisée stéréo, dérive rythmique d'amplitude et saturation douce. Aucun bruit généré artificiellement."
};
  function translateTechnicalDescription(lang) {
    if (lang !== 'fr') return;
    const detail = document.querySelector('.lms-encyclopedia-dialog .lms-encyclopedia-detail');
    const selector = document.querySelector('#lms-pedal-select');
    if (!detail || !selector) return;
    const pedalId = Number(selector.value);
    const translated = technicalFrench[pedalId];
    if (!translated) return;
    const articles = detail.querySelectorAll('article');
    if (articles.length !== 2) return; // "LE SON" has exactly 2 sections.
    const title = articles[1].querySelector('h4')?.textContent?.trim() || '';
    if (!title.includes('DESCRIPTION TECHNIQUE')) return;
    const paragraph = articles[1].querySelector('p');
    if (paragraph && paragraph.textContent !== translated)
      paragraph.textContent = translated;
  }

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
    translateTechnicalDescription(lang);
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