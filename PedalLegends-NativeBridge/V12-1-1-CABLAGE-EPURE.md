# Pedal Legends V12.1.1 — câblage Split épuré

Le mode SPLIT A/B conserve exactement les mêmes paramètres audio que la V12.1.

## Affichage

- 2 rails marrons droits et continus, A (cuivre clair) et B (marron foncé)
- uniquement de petites prises verticales au droit des pédales affectées
- suppression des grands raccordements en S, diagonales et boucles
- petits connecteurs d'entrée et de sortie, sans recouvrir les boutons
- mode Série inchangé : restauration du SVG d'origine
- badges A/B conservés ; aucune modification du routage DSP ou des presets

## Vérifications

Le test `check-v121-ui.mjs` valide la présence de deux rails seulement, sans courbes, avec huit prises courtes, et vérifie le retour au câblage Série et les actions du bouton Histoire.

La validation GitHub (compilation AU/VST3 et auval) ne remplace pas un contrôle visuel dans Ableton sur macOS.
