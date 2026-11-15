# Pedal Legends V12.2 — 100 nouveaux presets Split et deux banques

## Compatibilité conservée
- Les **100 presets Série d'origine** ne sont ni supprimés ni réécrits.
- Le preset **Init** reste disponible.
- Les presets utilisateur et le DSP original restent inchangés.
- L'interface intégrée à l'Audio Unit n'expose pas les 100 nouveaux sons en tant que simple catalogue fictif : ils sont générés comme de vrais presets factory avec les mêmes paramètres physiques que leurs sources et une nouvelle topologie de traitement Split A/B.

## 100 nouveaux sons Split
- Un preset supplémentaire par son d'usine existant, soit **100 variations Split**.
- Noms `SPLIT 001 — ...` à `SPLIT 100 — ...`, catégorie originale préservée.
- Attribution des huit emplacements à A ou B selon la famille des effets, avec répartition des effets actifs entre les branches quand au moins deux pédales sont engagées.
- Balance A/B spécifique, variable entre environ 37 et 63 %.
- En sélectionnant un preset, l'Audio Unit d'origine rappelle les réglages des pédales ; le bridge JUCE rappelle le mode Split, les huit affectations et la balance.
- Le chargement d'un preset Série rebascule le bridge en série.

## Navigateur intégré
- Deux onglets `PRESETS SÉRIE` et `PRESETS PARALLÈLE / SPLIT` à l'intérieur du navigateur original.
- Recherche et sélection habituelles conservées.
- Les sons Parallèle/Split affichent leur propre catégorie et une description française.
- Les catégories historiques restent accessibles dans l'onglet Série.

## Point technique
L'application AU de PluginMaker utilise ses données factory intégrées (`Wf({bundled:...})` en URL `file:`), et pas uniquement `scripts/presets.json`. L'installation effectue donc une insertion contrôlée dans l'unique fonction `bi()` chargée du tableau factory **après** l'expansion des valeurs par défaut `Ku()`. L'original complet est sauvegardé avant patch. Si la version originale n'a pas la signature attendue, l'installation refuse la modification et restaure la sauvegarde.

## Vérifications
- Tests automatisés pour 100+100+Init, noms uniques, deux branches, états routage, sélection des banques et idempotence de l'injection.
- Compilation AU/VST3 et validation `auval` sur macOS.
- Tests audio et fonctionnement du navigateur à confirmer dans Ableton macOS avant toute publication commerciale.

La version Windows VST3 reste un chantier séparé tant que le DSP natif n'y est pas porté.
