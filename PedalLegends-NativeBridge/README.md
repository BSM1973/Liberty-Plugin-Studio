# Pedal Legends — passerelle native JUCE (macOS)

Statut : **prototype technique, non validé dans Ableton**.

Ce projet est compilé *nativement* en Audio Unit v2 et VST3, avec la marque établie **Liberty Music Software**. Il utilise les mêmes conventions de fabrication que ECHO 86 : `COMPANY_NAME`, `PLUGIN_MANUFACTURER_CODE LbMS`, identifiant de bundle sous `com.libertymusicsoftware`.

## Fonctionnement

Le DSP exact des 40 pédales n'est pas disponible en sources : l'archive utilisateur `LIBERTY(1).zip` contient un Audio Unit PluginMaker/Faust déjà compilé. Cette passerelle **héberge** le composant original `aufx/yZPb/Plmk` au lieu de prétendre reconstituer son DSP. L'Audio Unit original doit donc rester installé et valide. La passerelle apparaît séparément sous la marque `Liberty Music Software`. L'ancienne entrée `Liberty` subsistera tant que le composant original est enregistré dans macOS.

Le plugin extérieur fournit un passage audio sûr lorsque le moteur original manque, héberge son éditeur graphique, et encapsule son état de session. L'automatisation des paramètres de l'AU d'origine n'est pas encore exposée aux hôtes : ne pas diffuser commercialement sans vérification et ajout de cette fonction.

## Build macOS

```bash
git clone --depth 1 --branch 8.0.10 https://github.com/juce-framework/JUCE.git JUCE
cmake -S . -B build -DJUCE_DIR="$PWD/JUCE" -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_ARCHITECTURES=arm64
cmake --build build --config Release --target PedalLegendsBridge_AU PedalLegendsBridge_VST3 -j 2
```

Le workflow GitHub Actions compile sur macOS et fournit les bundles AU/VST3 en artefact après compilation réussie. Ce projet ne remplace ni ne réécrit le plugin PluginMaker.

## Identités

| Composant | AU type | AU subtype | Fabricant |
|---|---|---|---|
| Original nécessaire | `aufx` | `yZPb` | `Plmk` |
| Passerelle JUCE | `aufx` | `PdLg` | `LbMS` |

## Tests avant installation

1. Vérifier que l'Audio Unit original fonctionne seul dans Ableton.
2. Compiler la passerelle AU/VST3 sur GitHub Actions, vérifier le succès du job.
3. Vérifier avec `auval -v aufx PdLg LbMS` que la passerelle AU est valide.
4. Vérifier qu'un effet, la commutation des pédales, la sauvegarde/rouverture et le rendu offline fonctionnent avec le moteur original hébergé.
5. Vérifier le classement sous `Liberty Music Software` dans Ableton, Logic et Cubase.

Ne pas désinstaller l'original avant une migration explicite de son traitement DSP.
