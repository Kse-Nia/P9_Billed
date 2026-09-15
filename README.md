# P9_Billed - Débuggez et testez un SaaS RH
 
 
Billed est une solution SaaS destinée aux équipes RH. 
Ce projet porte sur la fonctionnalité "notes de frais" : correction de bugs sur les parcours
employé et administrateur, mise en place de tests unitaires et d'intégration avec Jest, et rédaction d'un plan de test End-to-End.
 
---
  
## Structure
 
Le repository contient le Frontent et Backend :
 
```
P9_Billed/
├── Billed-app-FR-Back/     # API Express + SQLite (port 5678)
├── Billed-app-FR-Front/    # Application front (port 8080)
└── README.md
```
 
Les deux dossiers sont fournis par OpenClassrooms.
 
## Prérequis
 
- **npm**
- **Node.js (utiliser nvm pour avoir une version compatible, v18.16.1 de préférence)
- **live-server** extension pour lancer le front :

```bash
npm install -g live-server
```
 
---
 
## Installation et lancement
 
### 1. Back-end
 
```bash
cd Billed-app-FR-Back
npm install
npm run run:dev
```
 
L'API est disponible sur **http://localhost:5678**.
 
### 2. Front-end
 
```bash
cd Billed-app-FR-Front
npm install
live-server
```
 
L'application est disponible sur **http://127.0.0.1:8080** (le port peut
varier si 8080 est occupé)
 
---
 
## Comptes de démonstration
 
| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administrateur RH | `admin@test.tld` | `admin` |
| Employé | `employee@test.tld` | `employee` |
 
---
 
## Tests
 
Les tests sont écrits à l'aide de **Jest**, dans
`Billed-app-FR-Front/src/__tests__/`.
 
 # Lancer les tests
```bash
npm run test
 
# Lancer un fichier de test en particulier
npx jest src/__tests__/Bills.js
```
 
## Couverture de code
 
Le rapport est généré automatiquement par Jest dans `coverage/`.
Il est consultable à l'adresse :
 
**http://127.0.0.1:8080/coverage/lcov-report/index.html**
 
Objectif du projet : **80 % minimum de couverture par fichier** sur les
conteneurs et les vues concernés.
 
 
## Bugs corrigés
 
Quatre correctifs issus du Kanban Notion du projet :
 
| # | Origine | Périmètre | Description | Correctif |
|---|---------|-----------|-------------|-----------|
| 1 | Bug hunt | Login | Le parcours de connexion administrateur ne fonctionne pas | — |
| 2 | Bug hunt | Bills (employé) | Le justificatif accepte des formats non autorisés (seuls `jpg`, `jpeg`, `png` doivent l'être) | — |
| 3 | Bug report | Bills (employé) | Les notes de frais ne sont pas triées par date décroissante | — |
| 4 | Bug report | Dashboard (admin) | Comportement incorrect à l'ouverture des tickets / affichage du justificatif | — |
 
 
## Plan de test E2E
 
Le plan de test End-to-End couvre le **parcours employé** :
 
1. Connexion
2. Consultation de la liste des notes de frais
3. Création d'une nouvelle note de frais (formulaire + upload du justificatif)
4. Vérification du statut « en attente »
5. Déconnexion
Chaque scénario décrit : l'étape testée, les données d'entrée, le résultat
attendu et le résultat obtenu.
 
📄 Document : `docs/plan-de-test-e2e.pdf`
 
---
 
## Stack technique
 
**Front-end**
 
- JavaScript ES6 (sans framework), architecture MVC maison
- Bootstrap 5 et jQuery (modales)
- Jest, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `jest-html-reporter` pour le rapport de tests
**Back-end**
 
- Node.js / Express
- SQLite (via Sequelize)
- Authentification JWT
---