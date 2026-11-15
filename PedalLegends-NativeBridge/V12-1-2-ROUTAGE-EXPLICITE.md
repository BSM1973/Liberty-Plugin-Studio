# Pedal Legends V12.1.2 — Un Split A/B compréhensible

## Pourquoi
L'ancienne visualisation des câbles marrons sur le pedalboard fixe à 4 × 2 emplacements était trompeuse : les pédales des branches A et B peuvent être réparties sur les deux rangées. Deux rails traversant la grille ne représentent pas correctement l'ordre des effets.

## Interface
- Un véritable schéma de flux de signal est visible **dans le bandeau crème JUCE au-dessus des pédales**, jamais sous la WebView.
- **SÉRIE** : une chaîne unique 1 → 2 → ... → 8.
- **DIRECT + EFFETS** : signal direct parallèle à la chaîne complète 1 → 8.
- **SPLIT A/B** : deux lignes distinctes avec les numéros des pédales affectées à chaque branche, dans l'ordre réel. Elles se rejoignent à la sortie ; l'équilibre est réglé par BALANCE A/B.
- Les huit pédales d'origine restent en place ; chaque pédale affiche **A** ou **B**.
- En mode Split, le SVG marron d'origine, qui ne décrivait pas le routage A/B, est masqué. En mode Série (et Direct + effets), il est restauré.
- Le graphe affiche une mise en garde si le moteur Split n'est pas prêt ou est indisponible.

Aucune modification du DSP, de l'algorithme de routage, des 100 presets Série, de l'encyclopédie ou du bouton Histoire.

## Tests
- CI JavaScript vérifie le masquage du SVG en Split, les badges des huit pédales, la restauration Série et la réaction aux actions Histoire.
- CI macOS compile AU + VST3, lance auval et fabrique le .pkg.
- **Une vérification visuelle et audio dans Ableton sur Mac est encore nécessaire.**
