# Frontend Documentation - 1_NewApp

## Structure du Projet Frontend
```
frontend/
├── package.json (Configuration npm)
├── vite.config.js (Configuration Vite)
├── import/ (Fichiers d'exemple pour l'import CSV)
└── src/
    ├── main.jsx (Point d'entrée)
    ├── index.css (Styles globaux)
    ├── components/ (Composants réutilisables)
    ├── layouts/ (Layouts de page)
    ├── pages/ (Pages de l'application)
    ├── routes/ (Configuration du routing)
    └── services/ (Services API et logique métier)
```

---

## 1. Configuration

### Dépendances Principales (`package.json`)
- **React 19.2.6**: Framework frontend
- **Vite 8.0.12**: Build tool et dev server
- **React Router Dom 7.16.0**: Routing
- **Axios 1.17.0**: Client HTTP
- **Tailwind CSS 4.3.0**: Utilitaires CSS
- **JSZip 3.10.1**: Gestion de fichiers ZIP

### Variables d'Environnement (`.env`)
| Variable | Description |
|----------|-------------|
| VITE_API_BASE_URL | URL de l'API GLPI |
| VITE_OAUTH_CLIENT_ID | OAuth2 client ID |
| VITE_OAUTH_CLIENT_SECRET | OAuth2 client secret |
| VITE_LEGACY_BASE_URL | URL de l'API legacy GLPI |
| VITE_LEGACY_APP_TOKEN | App Token pour GLPI |
| VITE_BACKEND_API_BASE_URL | URL du backend Spring Boot (par défaut: http://localhost:8080) |

---

## 2. Layouts

### `SidebarLayout.jsx` (Back Office)
Layout principal pour le back office avec:
- Sidebar avec navigation
- Barre supérieure avec boutons Reset et Toggle Dark Mode
- Dark mode avec persistance localStorage
- Outlet pour le contenu des pages

### `FrontOfficeLayout.jsx`
Layout pour le front office.

---

## 3. Routing (`routes/router.jsx`)
```
/ → Accueil (Back Office)
├── /dashboard → Dashboard
├── /tickets → Gestion des tickets
├── /reset → Réinitialisation de la base
├── /import → Import de données
└── /personalisation → Personnalisation du Kanban

/front → Front Office
├── / → Liste des actifs
├── /create-ticket → Créer un ticket
├── /tickets-kanban → Tableau Kanban des tickets
└── /ticket-history/:ticketId → Historique d'un ticket
```

---

## 4. Services (`services/`)

### `api.js` (GLPI API)
Gère la communication avec l'API GLPI (OAuth2 et Legacy).
- **OAuth2 API**: Pour les endpoints modernes
- **Legacy API (`/apirest.php`)**: Pour les endpoints classiques
- **Intercepteurs**: Gère automatiquement les tokens et leur renouvellement

### `backend-api.js`
Instance Axios pour communiquer avec le backend Spring Boot (port 8080 par défaut).

### `frontOfficeKanbanTicketService.js`
Logique pour le tableau Kanban du front office:
- `getKanbanCustomization()`: Récupère la personnalisation du Kanban
- `saveKanbanCustomization()`: Sauvegarde la personnalisation
- `resetKanbanCustomization()`: Réinitialise la personnalisation
- `fetchKanbanTickets()`: Récupère les tickets pour le Kanban
- `updateTicketStatus()`: Met à jour le statut d'un ticket et enregistre l'historique
- `getTicketHistory()`: Récupère l'historique d'un ticket
- `exportElementListToPdf()`: Exporte la liste d'actifs en PDF

### `importTicketCsvService.js`
Logique pour l'import de tickets via CSV:
- Gère la mapping des statuts, types et priorités (y compris les libellés malgaches)
- Enregistre l'historique des changements de statut
- Résout les actifs à associer aux tickets

### `resetService.js`
Logique pour la réinitialisation complète:
- Supprime les données de GLPI
- Appelle le endpoint `/api/reset` du backend pour réinitialiser l'historique et la personnalisation

---

## 5. Composants (`components/`)

### `TicketDetailsModal.jsx`
Modal réutilisable pour afficher les détails d'un ticket:
- Utilise `MutationObserver` pour détecter le dark mode
- Affiche la date et l'heure en format DD/MM/YYYY HH:mm
- Boutons pour voir l'historique et exporter en PDF

---

## 6. Pages Clés

### `FrontOffice/ElementList.jsx`
Page pour afficher la liste des actifs avec:
- Filtres par texte, type et statut
- Bouton d'export PDF
- Gestion du dark mode

### `FrontOffice/TicketKanban.jsx`
Tableau Kanban des tickets avec:
- Glisser-déposer pour changer le statut
- Personnalisation des couleurs et libellés
- Affichage de la date d'ouverture formatée

### `Import/ImportData.jsx`
Page pour l'import de données avec:
- Fichiers CSV pour les actifs, tickets et coûts
- Fichier ZIP pour les images
- Checkbox pour rendre le ZIP obligatoire
- Validation avant import

---

## 7. Fonctionnalités Clés

### Dark Mode
- Stocké dans `localStorage`
- Appliqué via classe `dark` sur le `body`
- Détecté et synchronisé dans les composants via `MutationObserver`

### Historique des Statuts
- Sauvegardé automatiquement lors de la création ou du changement de statut
- Consultable via la page `/front/ticket-history/:ticketId`

### Export PDF
- Généré côté backend via iTextPDF
- Disponible pour les détails de ticket et la liste des actifs

---

## 8. Démarrage du Frontend
```bash
cd frontend
npm install
npm run dev
```
Le frontend démarre par défaut sur le port 5173.

