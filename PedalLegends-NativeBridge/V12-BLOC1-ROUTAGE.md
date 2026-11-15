## V12 — Bloc 1 (interface routage et split visuel)

- Interface Routage revue : olive, doré, crème ; trois boutons de mode et une section BALANCE.
- Aucune flèche Unicode en fonte native dans les libellés de SPLIT ; les accents sont passés à JUCE comme UTF-8.
- En mode SPLIT A/B, les huit affectations A/B (1 à 8) sont accessibles depuis la barre supérieure.
- Le composant JUCE \`SplitGraphic\` suit exactement ces huit paramètres et dessine sur les pédales les contours et les connexions A/B.
- Overlay transparent aux clics : l'éditeur Audio Unit original garde ses interactions (boutons, pédales, encyclopédie).
- Seul le mode SPLIT affiche le graphe ; le mode Série et les 100 presets d'usine ne sont pas modifiés.
- Le DSP existant fonctionne via deux instances de l'Audio Unit macOS ; si leur initialisation échoue, le DSP reste en série et le menu signale l'indisponibilité.
- Validation CI : compilation AU/VST3 et \`auval\`. La validation visuelle et audio du split doit être réalisée dans un DAW réel.

**Aucun nouveau preset n'est livré dans ce bloc.** Les 100 presets parallèles et leur onglet seront traités dans le bloc 2.
