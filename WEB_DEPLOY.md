# Liberty Plugin Studio — utilisation dans le navigateur (v0.12)

L'application React peut être hébergée sur Vercel. Le dossier `api/` contient une fonction serveur qui appelle OpenAI sans exposer la clé dans le navigateur.

## Mise en ligne, une seule fois

1. Se connecter à https://vercel.com avec GitHub.
2. Choisir **Add New → Project**, importer `BSM1973/Liberty-Plugin-Studio`.
3. Conserver le framework **Vite** et la commande `npm run build` (sortie `dist`).
4. Dans **Environment Variables**, créer deux secrets privés :
   - `OPENAI_API_KEY` : la clé OpenAI, à saisir uniquement dans les paramètres privés Vercel.
   - `STUDIO_ACCESS_CODE` : un code privé long et unique, différent de la clé API, à saisir dans Vercel et dans l'interface lors des générations.
5. Déployer, puis ouvrir l'URL Vercel. L'éditeur fonctionne dans Safari/Chrome sans Terminal.

**Important :** ne jamais transmettre ces secrets dans ChatGPT, une capture d'écran, un commit ou un fichier `.env` versionné. Ne pas utiliser de variable `VITE_OPENAI_API_KEY` : les variables préfixées `VITE_` sont exposées dans le navigateur.

Le code d'accès limite les usages non autorisés mais ne remplace pas une authentification complète ni des quotas côté serveur. Avant de diffuser publiquement le site, ajouter une authentification, une limitation de débit et des contrôles de coûts. Garder l'URL et le code privés pour les essais. Les limites de dépenses du fournisseur peuvent être des alertes plutôt qu'un plafond strict.

Le serveur de développement local reste disponible en option, mais **n'est pas nécessaire** pour utiliser la version hébergée. La compilation GitHub ne déploie pas automatiquement le site ; le projet doit être importé dans Vercel une première fois.

L'image générée est une façade décorative, pas une interface DSP entièrement fonctionnelle. Les contrôles audio doivent être associés séparément.
