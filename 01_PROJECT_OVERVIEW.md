# 1_NewApp - Projet Overview

## Description
1_NewApp est une application web complète qui intègre GLPI (Gestionnaire Libre de Parc Informatique) avec des fonctionnalités personnalisées de gestion de tickets, kanban, import de données et export PDF.

## Architecture
L'application est composée de deux parties principales :

1. **Backend** (Spring Boot 3.x + SQLite)
2. **Frontend** (React 19.x + Vite + Tailwind CSS)

---

## Technologies Utilisées

### Backend
- **Framework**: Spring Boot 3.4.2
- **Langage**: Java 21
- **ORM**: Spring Data JPA + Hibernate
- **Base de données**: SQLite
- **Bibliothèques supplémentaires**:
  - iTextPDF (5.5.13.3) pour la génération de PDF
  - Lombok pour réduire le code boilerplate
  - Springdoc OpenAPI pour la documentation API

### Frontend
- **Framework**: React 19.2.6
- **Build Tool**: Vite 8.0.12
- **Style**: Tailwind CSS 4.3.0
- **Routing**: React Router Dom 7.16.0
- **HTTP Client**: Axios 1.17.0
- **Autres dépendances**: JSZip (pour la gestion des fichiers ZIP)

---

## Structure du Projet
```
1_NewApp/
├── backend/
│   ├── pom.xml
│   ├── glpi_kanban.db (SQLite database)
│   ├── sql/
│   │   └── BD.sql (schema de la DB backend)
│   └── src/main/java/com/eval/backend/
│       ├── BackendApplication.java
│       ├── controller/
│       ├── dto/
│       ├── entity/
│       ├── repository/
│       └── service/
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── import/ (fichiers d'exemple pour import)
    └── src/
        ├── components/
        ├── layouts/
        ├── pages/
        ├── services/
        └── routes/
```

---

## Fonctionnalités Principales
1. **Gestion des tickets GLPI** - Interface front-office et back-office
2. **Kanban Board pour les tickets** - Personnalisable (couleurs, libellés)
3. **Historique des changements de statut de tickets**
4. **Import de données** (Actifs, Tickets, Coûts, Images)
5. **Export PDF** (Détails de ticket, Liste d'actifs)
6. **Réinitialisation complète de la base de données**
7. **Mode sombre** avec persistance locale

