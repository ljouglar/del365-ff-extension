# Guide d'installation et test

## Test de l'extension

1. Ouvrez Firefox et tapez `about:debugging` dans la barre d'adresse
2. Cliquez sur "Ce Firefox" dans le menu de gauche
3. Cliquez sur "Charger un module complémentaire temporaire..."
4. Sélectionnez le fichier `manifest.json` dans ce dossier
5. L'extension est maintenant chargée et active

## Utilisation

- **Bouton** : Cliquez sur l'icône rouge Office 365 dans la barre d'outils
- **Raccourci** : Utilisez `Ctrl+Shift+D` (ou `Cmd+Shift+D` sur Mac)
- Une notification confirmera la suppression des données

## Débogage

Pour voir les logs de l'extension :
1. Allez sur `about:debugging`
2. Trouvez votre extension dans la liste
3. Cliquez sur "Inspecter" pour ouvrir la console du background script

## Notes

- L'extension supprime uniquement les données de `office365.com`
- La suppression couvre tout l'historique
- Les types de données supprimés : cookies, cache, localStorage, indexedDB
