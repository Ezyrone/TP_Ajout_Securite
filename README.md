# Tableau de notes collaboratif sécurisé

Application temps réel minimaliste illustrant l'utilisation combinée d'Express.js, Socket.IO et JWT pour proposer un tableau de notes collaboratif avec authentification et contrôle d'accès.

## Démarrage rapide

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement (facultatif)**

   ```bash
   export PORT=3000
   export JWT_SECRET="remplacez-moi"
   export JWT_EXPIRATION="2h"
   ```

   Sans configuration, le serveur utilise `3000` pour le port et `change-this-secret` pour la clé JWT (valeur uniquement adaptée à un usage local).

3. **Lancer le serveur**

   ```bash
   npm start
   ```

4. **Accéder à l'application**

   Ouvrir [http://localhost:3000](http://localhost:3000) dans un navigateur moderne.

## Fonctionnalités principales

- Affichage temps réel des notes via Socket.IO.
- Inscription et connexion avec stockage sécurisé des mots de passe (`bcrypt`).
- Sessions JWT (stockage côté client) avec expiration configurable.
- Contrôle d'accès :
  - seules les personnes authentifiées peuvent créer, modifier ou supprimer des notes ;
  - un utilisateur ne peut modifier/supprimer que ses propres notes.
- Interface web simple (HTML/CSS/JS vanilla) gérant l'inscription, la connexion et les notes en temps réel.

## Organisation du code

- `server.js` : application Express, configuration Socket.IO, routes REST, logique d'authentification et règles de sécurité.
- `public/index.html` & `public/app.js` : interface web utilisant fetch + Socket.IO client.
- `public/styles.css` : styles principaux.

Les données sont conservées en mémoire (`notes` et `users`). La persistance est volontairement écartée pour mettre l'accent sur les mécanismes de sécurité.

## Choix et considérations de sécurité

- **Hashage des mots de passe** : `bcrypt` avec un coût de hachage par défaut (`saltRounds = 10`).
- **JWT** :
  - le token transporte `userId` et `username` et expire (défaut `2h`) ;
  - la clé secrète doit être fournie via `JWT_SECRET` en production ;
  - à l'expiration ou en cas d'erreur `401`, le client invalide sa session locale.
- **Autorisation** : middleware qui valide le token avant toute écriture ; la propriété `authorId`/`authorName` est vérifiée côté serveur avant modification/suppression et les boutons correspondants sont désactivés côté client.
- **Surface réseau** : seules les routes nécessaires sont exposées (`/register`, `/login`, `/notes`), les assets statiques sont servis depuis `public/`.
- **Temps réel** : Socket.IO ne sert qu'à diffuser l'état des notes. Toutes les mutations passent par l'API REST protégée, garantissant l'application uniforme des règles d'autorisation. Pour une production, on pourrait valider le JWT côté Socket.IO à la connexion.

## Scénarios de test suggérés

- Création/modification/suppression sans être connecté (doit échouer).
- Parcours complet : inscription → connexion → création d'une note → modification → suppression.
- Vérifier qu'un utilisateur connecté ne peut pas modifier/supprimer la note d'un autre utilisateur (réponse API `403` et boutons désactivés).
- Connexions multiples (navigateurs/onglets) : vérifier la mise à jour instantanée de la liste des notes.

## Pistes d'amélioration

- Persistance (fichier JSON, SQLite, etc.).
- Rafraîchissement automatique du token ou invalidation serveur.
- Validation avancée des entrées utilisateur et gestion d'erreurs centralisée.
- Authentification côté Socket.IO (transmission du JWT lors de la connexion).
