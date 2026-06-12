# Database Documentation - 1_NewApp

## 1. Base de Données GLPI (Principale)
Ce projet utilise GLPI comme base de données principale pour la gestion des tickets, actifs, utilisateurs, etc.
- **Nom de la base**: Configurée dans GLPI (généralement `glpi`)
- **Type**: MySQL / MariaDB
- **Interaction**: Via l'API REST de GLPI (OAuth2 et Legacy)

---

## 2. Base de Données Backend (SQLite)
Base de données locale pour les fonctionnalités personnalisées (historique, personnalisation du Kanban).
- **Fichier**: `backend/glpi_kanban.db`
- **Type**: SQLite 3
- **Gestion**: via Spring Data JPA et Hibernate

---

## 3. Schéma SQLite (`backend/sql/BD.sql`)

### Table `kanban_customization`
Stocke la personnalisation du tableau Kanban.
```sql
CREATE TABLE kanban_customization (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    colors_by_status TEXT,          -- JSON: Map<statusId, color>
    labels_by_status TEXT,          -- JSON: Map<statusId, label>
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

### Table `ticket_status_history`
Stocke l'historique des changements de statut des tickets.
```sql
CREATE TABLE ticket_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,     -- ID du ticket dans GLPI
    old_status INTEGER,             -- Ancien statut ID (nullable pour la création)
    new_status INTEGER NOT NULL,    -- Nouveau statut ID
    changed_by TEXT,                -- Utilisateur qui a fait le changement
    comment TEXT,                   -- Commentaire (optionnel)
    solution TEXT,                  -- Solution (optionnel)
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 4. Initialisation
Les tables sont créées automatiquement par Hibernate grâce à la configuration:
```properties
spring.jpa.hibernate.ddl-auto=update
```
Le fichier `BD.sql` peut être utilisé pour créer les tables manuellement si nécessaire.

