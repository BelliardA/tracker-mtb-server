# Tracker MTB Server

Backend Node.js/TypeScript pour l'application de suivi de sessions VTT.

## Prérequis

- [Node.js](https://nodejs.org/) 18+
- Un cluster [MongoDB Atlas](https://www.mongodb.com/atlas/database) ou instance MongoDB compatible

## Installation

1. **Cloner** le dépôt et se placer à l'intérieur :
   ```bash
   git clone <repo-url>
   cd tracker-mtb-server
   ```
2. **Installer** les dépendances :
   ```bash
   npm install
   ```
3. **Configurer** les variables d'environnement en créant un fichier `.env` :
   ```bash
   ATLAS_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5050 # optionnel
   ```

## Démarrage du serveur

```bash
npm start
```

Le serveur écoute par défaut sur le port défini par `PORT` (5050 si non précisé).

## Scripts utiles

| Commande         | Description                                |
| ---------------- | ------------------------------------------ |
| `npm start`      | Lance le serveur avec tsx                  |
| `npm run build`  | Compile le code TypeScript vers JavaScript |
| `npm run format` | Formate le code avec Prettier              |

## Endpoints principaux

- `POST /auth/check-email` : vérifier l'existence d'un email
- `POST /auth/signup` : créer un compte utilisateur
- `POST /auth/login` : authentifier un utilisateur et récupérer un JWT
- `GET /session` : récupérer toutes les sessions
- `GET /session/:id` : récupérer une session par identifiant
- `POST /session` : enregistrer une nouvelle session (auth requise)
- `GET /session/user/:userId` : récupérer les sessions d'un utilisateur
- `DELETE /session/:id` : supprimer une session
- `GET /users/me` : récupérer le profil de l'utilisateur authentifié
- `POST /users/me/stats` : mettre à jour les statistiques utilisateur
- `PUT /users/me` : mettre à jour le profil utilisateur
- `GET /users/:id` : récupérer un utilisateur par identifiant

## Structure du projet

```
src/
├── controllers/     # Logique métier des sessions & utilisateurs
├── db/             # Connexion MongoDB
├── middleware/     # Middleware (ex: auth)
├── routes/         # Définitions des routes Express
├── types/          # Types TypeScript
└── server.ts       # Point d'entrée de l'application
```

## Contribution

Les contributions sont les bienvenues ! Merci de :

1. Créer une branche dédiée pour vos modifications.
2. Exécuter `npm run format` et `npm run build` avant de soumettre une PR.
3. Décrire clairement vos changements.

## Licence
