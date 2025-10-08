## Tableau de notes sécurisé

Application tempo réel : Express + Socket.IO côté serveur, HTML/CSS/JS vanilla côté client, et JWT pour laisser écrire uniquement les personnes connectées. Les notes restent en mémoire pour garder l’exemple léger.

### Démarrer

```bash
npm install
npm start
```

Ensuite, ouvrez [http://localhost:3000](http://localhost:3000), créez un compte, connectez-vous, et écrivez votre première note. Ouvrez un deuxième onglet pour voir la synchro instantanée.

### Ce qui est protégé

- Inscription + login avec `bcrypt`.
- Chaque note porte l’ID de son auteur ; seuls ses boutons sont actifs pour lui.
- Toutes les requêtes sensibles passent par un middleware qui vérifie le JWT.

