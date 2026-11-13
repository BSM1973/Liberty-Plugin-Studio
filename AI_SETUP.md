# Liberty Plugin Studio — Génération graphique IA (v0.11)

L'éditeur web et le service IA sont séparés. La clé API ne doit **jamais** être insérée dans le code React, dans GitHub ou dans un fichier versionné.

## Démarrage local (macOS)

1. Installer Node.js 22 ou plus récent et exécuter `npm install`.
2. Dans un premier terminal, définir `OPENAI_API_KEY` comme variable d'environnement puis exécuter `npm run server`.
3. Dans un second terminal, exécuter `npm run dev`.
4. Ouvrir l'adresse locale affichée par Vite, saisir une description et cliquer sur **Générer une façade IA**.

Exemple (ne pas publier la clé) : `OPENAI_API_KEY=... npm run server`.

L'API OpenAI est facturée séparément de ChatGPT et peut nécessiter une configuration de facturation et des droits d'accès au modèle. Le service écoute uniquement sur 127.0.0.1:8787 et Vite relaie /api en développement. Le serveur Node n'est pas automatiquement déployé par la compilation Vite. Un déploiement public nécessite une authentification, des limites de requêtes, un contrôle des coûts et une infrastructure sécurisée.

La génération produit une **image de façade** et non des paramètres DSP fonctionnels. Les contrôles de l'éditeur restent des éléments indépendants à connecter plus tard au moteur audio.
