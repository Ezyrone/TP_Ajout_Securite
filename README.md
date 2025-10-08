## Tableau de notes sécurisé

Une appli temps réel Express + Socket.IO, avec un front HTML/CSS/JS simple et des JWT pour que seuls les utilisateurs connectés puissent manipuler leurs Post-it. Tout est en mémoire pour garder l’exemple léger.

### Démarrer

```bash
npm install
JWT_SECRET="changez-moi" npm start
```

Ensuite, ouvrez [http://localhost:3000](http://localhost:3000), créez un compte, connectez-vous, et ajoutez votre première note. Lancez un second onglet pour voir la synchro instantanée.

### Ce qui est protégé

- Inscription + login avec `bcrypt`.
- Chaque note est taguée avec l’auteur ; seul ce dernier voit des actions actives.
- Les routes sensibles passent toutes par un middleware qui vérifie le JWT.

### Côté interface

- `register.html` : inscription puis redirection vers la connexion.
- `login.html` : connexion (redirige vers le tableau si une session existe déjà).
- `dashboard.html` : gestion des Post-it, renvoie vers la connexion si le token est manquant ou expiré.

### À tester 

- Tenter une création/modification/suppression de note sans être connecté (doit échouer).
- Créer deux comptes différents et vérifier qu’ils ne peuvent pas éditer les notes de l’autre (`403` attendu).
- Ajouter/modifier/supprimer une note et constater la diffusion instantanée via Socket.IO.


Jory GRZESZCZAK - M2 AL - ESGI Grenoble
