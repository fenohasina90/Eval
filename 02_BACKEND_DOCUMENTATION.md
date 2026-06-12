# Backend Documentation - 1_NewApp

## Structure du Projet Backend
```
backend/
├── pom.xml (Configuration Maven)
├── glpi_kanban.db (Base de données SQLite)
├── sql/
│   └── BD.sql (Schéma de la base de données)
└── src/main/java/com/eval/backend/
    ├── BackendApplication.java (Point d'entrée Spring Boot)
    ├── controller/
    │   ├── KanbanCustomizationController.java
    │   ├── TicketStatusHistoryController.java
    │   ├── PdfController.java
    │   └── ResetController.java
    ├── dto/
    │   ├── KanbanCustomizationDTO.java
    │   └── TicketStatusHistoryDTO.java
    ├── entity/
    │   ├── KanbanCustomization.java
    │   └── TicketStatusHistory.java
    ├── repository/
    │   ├── KanbanCustomizationRepository.java
    │   └── TicketStatusHistoryRepository.java
    └── service/
        ├── KanbanCustomizationService.java
        ├── TicketStatusHistoryService.java
        └── PdfService.java
```

---

## 1. Configuration (`pom.xml`)

### Dépendances Principales
- **Spring Boot Starter Data JPA**: Pour la persistance des données
- **Spring Boot Starter Web**: Pour les APIs REST
- **SQLite JDBC**: Driver pour la base de données SQLite
- **Hibernate Community Dialects**: Pour le support de SQLite avec Hibernate
- **iTextPDF 5.5.13.3**: Pour la génération de PDF
- **Lombok**: Pour réduire le code boilerplate
- **Springdoc OpenAPI**: Pour la documentation Swagger (désactivée par défaut)

### Configuration
- Java Version: 21
- Spring Boot Version: 3.4.2

---

## 2. Base de Données (SQLite)

### Fichier de Configuration
`src/main/resources/application.properties`

```properties
# SQLite Database
spring.datasource.url=jdbc:sqlite:glpi_kanban.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.community.dialect.SQLiteDialect
```

### Schéma de la Base de Données (`sql/BD.sql`)

#### Table `kanban_customization`
Stocke la personnalisation du tableau Kanban (couleurs et libellés).
| Colonne             | Type         | Description                                  |
|---------------------|--------------|----------------------------------------------|
| id                  | INTEGER (PK) | Identifiant unique                           |
| colors_by_status    | TEXT         | JSON des couleurs par statut                 |
| labels_by_status    | TEXT         | JSON des libellés par statut                 |
| created_at          | TIMESTAMP    | Date de création                             |
| updated_at          | TIMESTAMP    | Date de dernière modification                |

#### Table `ticket_status_history`
Stocke l'historique des changements de statut des tickets.
| Colonne             | Type         | Description                                  |
|---------------------|--------------|----------------------------------------------|
| id                  | INTEGER (PK) | Identifiant unique                           |
| ticket_id           | INTEGER (FK) | ID du ticket concerné                        |
| old_status          | INTEGER      | Ancien statut (nullable)                     |
| new_status          | INTEGER      | Nouveau statut                               |
| changed_by          | TEXT         | Utilisateur qui a effectué le changement    |
| comment             | TEXT         | Commentaire (optionnel)                      |
| solution            | TEXT         | Solution (optionnel)                         |
| changed_at          | TIMESTAMP    | Date et heure du changement                  |

---

## 3. Couche Entity (JPA Entities)

### `KanbanCustomization.java`
Entité pour la personnalisation du Kanban.
- Utilise Lombok `@Data` pour générer les getters/setters automatiquement
- Méthodes `@PrePersist` et `@PreUpdate` pour gérer les timestamps

### `TicketStatusHistory.java`
Entité pour l'historique des statuts.
- Gère automatiquement le timestamp `changed_at` via `@PrePersist`
- Contient tous les détails du changement de statut

---

## 4. Couche DTO (Data Transfer Objects)

### `KanbanCustomizationDTO.java`
DTO pour les échanges API de personnalisation du Kanban.
```java
@Data
public class KanbanCustomizationDTO {
    private Map<Integer, String> colorsByStatus;
    private Map<Integer, String> labelsByStatus;
}
```

### `TicketStatusHistoryDTO.java`
DTO pour les échanges API de l'historique.
- Contient tous les champs de l'entité pour l'affichage

---

## 5. Couche Repository (JPA Repositories)

### `KanbanCustomizationRepository.java`
```java
@Repository
public interface KanbanCustomizationRepository extends JpaRepository<KanbanCustomization, Long> {
    // Méthodes héritées de JpaRepository : findAll(), save(), deleteAll(), etc.
}
```

### `TicketStatusHistoryRepository.java`
```java
@Repository
public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, Long> {
    // Récupère l'historique d'un ticket trié par date décroissante
    List<TicketStatusHistory> findByTicketIdOrderByChangedAtDesc(Long ticketId);
}
```

---

## 6. Couche Service (Business Logic)

### `KanbanCustomizationService.java`
Gère la personnalisation du tableau Kanban.
- **Valeurs par défaut**: Couleurs et libellés prédéfinis pour les statuts 1, 2, et 6
- **Méthodes importantes**:
  - `getCustomization()`: Récupère la personnalisation (ou valeurs par défaut)
  - `saveCustomization(dto)`: Enregistre la personnalisation
  - `resetCustomization()`: Réinitialise aux valeurs par défaut
- **Conversion**: Utilise Jackson ObjectMapper pour convertir entre JSON et Map

### `TicketStatusHistoryService.java`
Gère l'historique des changements de statut des tickets.
- **Méthodes importantes**:
  - `createHistory(...)`: Crée une nouvelle entrée d'historique
  - `getHistoryForTicket(ticketId)`: Récupère l'historique d'un ticket
  - `deleteAllHistory()`: Supprime tout l'historique (pour la réinitialisation)

### `PdfService.java`
Gère la génération de PDF.
- **Fonctionnalités**:
  - `generateTicketPdf(ticket, history)`: Génère un PDF pour un ticket (détails + historique)
  - `generateElementListPdf(elements, title)`: Génère un PDF pour la liste des actifs (format paysage)
- **Utilisation**: Utilise iTextPDF pour générer les documents

---

## 7. Couche Controller (REST Endpoints)

### `KanbanCustomizationController.java`
Endpoints pour la personnalisation du Kanban.
- `GET /api/kanban-customization`: Récupère la personnalisation
- `PUT /api/kanban-customization`: Sauvegarde la personnalisation
- `DELETE /api/kanban-customization`: Réinitialise la personnalisation

### `TicketStatusHistoryController.java`
Endpoints pour l'historique des tickets.
- `GET /api/ticket-history/ticket/{ticketId}`: Récupère l'historique d'un ticket
- `POST /api/ticket-history`: Crée une nouvelle entrée d'historique
- `DELETE /api/ticket-history`: Supprime tout l'historique

### `PdfController.java`
Endpoints pour les exports PDF.
- `POST /api/pdf/ticket`: Génère un PDF pour un ticket
- `POST /api/pdf/elements`: Génère un PDF pour la liste d'actifs

### `ResetController.java`
Endpoint pour la réinitialisation complète du backend.
- `DELETE /api/reset`: Réinitialise l'historique et la personnalisation du Kanban

---

## 8. Démarrage du Backend
```bash
cd backend
./mvnw spring-boot:run
```
Le backend démarre par défaut sur le port 8080.

