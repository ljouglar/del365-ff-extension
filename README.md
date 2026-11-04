# Del365 - Extension Firefox

Extension Firefox pour supprimer les données de navigation du domaine Office 365.

## Description

Cette extension ajoute un bouton dans la barre d'outils Firefox et un raccourci clavier permettant de supprimer rapidement toutes les données de navigation (cookies, y compris partitionnés et dans les conteneurs, ainsi que localStorage, IndexedDB et service workers) associées à Office 365 et Microsoft. Cela peut être utile pour résoudre des problèmes de connexion ou de cache sur Office 365.

## Fonctionnalités

- **Bouton dans la barre d'outils** : Clic sur l'icône pour déclencher la suppression immédiate
- **Raccourci clavier** : `Ctrl+Shift+D` (ou `Cmd+Shift+D` sur Mac) pour une suppression rapide
- **Notification de confirmation** : Message indiquant le nombre de cookies supprimés
- **Suppression ciblée** : Supprime uniquement les cookies des domaines suivants :
  - office365.com / office.com / office.net / outlook.com
  - microsoft.com (Teams, Copilot)
  - microsoftonline.com (authentification)
  - cloud.microsoft / static.microsoft (nouveaux domaines Outlook, Teams, M365)
  - live.com / sharepoint.com
  - office-web.sips-services.com
  - koesio.com

## Installation

### Installation de la version signée (recommandé)

1. Ouvrez la [dernière release](https://github.com/ljouglar/del365-ff-extension/releases/latest) dans Firefox
2. Cliquez sur le fichier `.xpi` (par exemple `del365-1.1.0.xpi`) et acceptez l'installation
3. Épinglez l'icône depuis le menu des extensions (pièce de puzzle)

L'extension est signée par Mozilla : elle reste installée après un redémarrage de Firefox. Il n'y a pas de mise à jour automatique : pour passer à une nouvelle version, installez le `.xpi` de la nouvelle release.

### Installation en développement

1. Clonez ce dépôt :
   ```bash
   git clone <url-du-repo>
   cd del365-ff-extension
   ```

2. Ouvrez Firefox et accédez à `about:debugging`

3. Cliquez sur "Ce Firefox" (This Firefox)

4. Cliquez sur "Charger un module complémentaire temporaire..." (Load Temporary Add-on)

5. Sélectionnez le fichier `manifest.json` dans le dossier du projet

Ce chargement est temporaire : l'extension disparaît au redémarrage de Firefox.

## Utilisation

1. Cliquez sur l'icône de l'extension dans la barre d'outils (après l'avoir épinglée depuis le menu des extensions), ou
2. Utilisez le raccourci clavier `Ctrl+Shift+D` (ou `Cmd+Shift+D` sur Mac)
3. Les cookies sont supprimés instantanément
4. Une notification confirme la suppression avec le nombre de cookies effacés

## Développement

### Structure du projet

```
del365-ff-extension/
├── manifest.json           # Fichier de configuration de l'extension
├── background.js          # Script d'arrière-plan (logique de suppression)
├── icons/                 # Icônes de l'extension
│   ├── icon-48.png
│   └── icon-96.png
├── LICENSE                # Licence MIT
└── README.md
```

### Permissions requises

L'extension nécessite les permissions suivantes :
- `browsingData` : Pour supprimer les données de navigation
- `notifications` : Pour afficher la confirmation après suppression
- `cookies` : Pour accéder et supprimer les cookies
- `<all_urls>` : Pour accéder aux cookies de tous les domaines ciblés

### Technologies utilisées

- Firefox WebExtensions API
- JavaScript (Vanilla)

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commiter vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Pusher vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Auteur

L. Jouglar

## Notes de version

### v1.1.0
- Domaines ajoutés : cloud.microsoft, static.microsoft, office.net, live.com, sharepoint.com
- Suppression des cookies dans tous les conteneurs, y compris les cookies partitionnés
- Vidage de localStorage, IndexedDB et des service workers d'Outlook, Teams et du SSO
- Correspondance exacte des domaines et sous-domaines (plus de correspondance par sous-chaîne)
- Première version signée, publiée en [release GitHub](https://github.com/ljouglar/del365-ff-extension/releases/tag/v1.1.0)

### v1.0.0
- Première version
- Bouton dans la barre d'outils
- Suppression des données Office 365
