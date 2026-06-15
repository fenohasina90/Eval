# Guide du code essentiel du projet 1_NewApp

Ce document présente les fichiers et composants essentiels du projet, avec leur rôle et leur fonctionnement.

---

## Architecture générale du projet

Le projet est divisé en deux parties principales :
- **Backend** (Spring Boot + SQLite) : Stocke les données personnalisées (super coûts, coûts d'ouverture, historique, personnalisation kanban)
- **Frontend** (React + Vite) : Interface utilisateur qui interroge à la fois l'API GLPI et le backend Spring Boot

---

## Partie Backend

### 1. Point d'entrée : `BackendApplication.java`

```java
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

**Rôle** : Classe principale qui démarre l'application Spring Boot.

---

### 2. Configuration : `application.properties`

```properties
# Base de données SQLite
spring.datasource.url=jdbc:sqlite:glpi_kanban.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# JPA/Hibernate (crée/mise à jour automatiquement les tables)
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.community.dialect.SQLiteDialect
```

**Rôle** : Configure la connexion à la base de données et le comportement de JPA/Hibernate.

---

### 3. Structure standard d'une entité (Exemple : `SuperCout.java`)

```java
@Entity
@Table(name = "super_cout")
public class SuperCout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "cout", nullable = false)
    private Double cout;

    // Getters et setters obligatoires
}
```

**Rôle** : Représente une table en base de données. Chaque champ correspond à une colonne.

**Annotations clés** :
- `@Entity` : Indique que c'est une classe mappée à une table
- `@Id` : Champ clé primaire
- `@GeneratedValue` : Valeur générée automatiquement (auto-incrément)
- `@Column` : Configure la colonne (nom, nullable, etc.)

---

### 4. Repository (Exemple : `SuperCoutRepository.java`)

```java
@Repository
public interface SuperCoutRepository extends JpaRepository<SuperCout, Long> {
    // Méthodes automatiquement implémentées par Spring Data JPA :
    // - save() : Créer ou mettre à jour
    // - findById() : Récupérer par ID
    // - findAll() : Récupérer tous
    // - deleteById() : Supprimer par ID
    // - deleteAll() : Supprimer tous
    
    // Méthode personnalisée (Spring génère l'implémentation)
    List<SuperCout> findByTicketId(Long ticketId);
}
```

**Rôle** : Interface pour accéder à la base de données. Spring Data JPA implémente automatiquement les méthodes CRUD.

---

### 5. Service (Exemple : `SuperCoutService.java`)

```java
@Service
public class SuperCoutService {
    @Autowired
    private SuperCoutRepository repository;

    public SuperCoutDTO createSuperCout(Long ticketId, Double cout) {
        SuperCout superCout = new SuperCout();
        superCout.setTicketId(ticketId);
        superCout.setCout(cout);

        SuperCout saved = repository.save(superCout);
        return convertToDTO(saved);
    }

    public List<SuperCoutDTO> getSuperCoutsByTicketId(Long ticketId) {
        return repository.findByTicketId(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private SuperCoutDTO convertToDTO(SuperCout superCout) {
        return new SuperCoutDTO(
                superCout.getId(),
                superCout.getTicketId(),
                superCout.getCout()
        );
    }
}
```

**Rôle** : Contient la logique métier. Convertit les entités en DTOs pour les renvoyer au frontend.

---

### 6. Controller (Exemple : `SuperCoutController.java`)

```java
@RestController
@RequestMapping("/api/super-cout")
@CrossOrigin(origins = "*")
public class SuperCoutController {
    @Autowired
    private SuperCoutService service;

    @GetMapping
    public List<SuperCoutDTO> getAllSuperCouts() {
        return service.getAllSuperCouts();
    }

    @GetMapping("/ticket/{ticketId}")
    public List<SuperCoutDTO> getSuperCoutsByTicketId(@PathVariable Long ticketId) {
        return service.getSuperCoutsByTicketId(ticketId);
    }

    @PostMapping
    public SuperCoutDTO createSuperCout(@RequestBody Map<String, Object> request) {
        Long ticketId = Long.valueOf(request.get("ticketId").toString());
        Double cout = Double.valueOf(request.get("cout").toString());
        return service.createSuperCout(ticketId, cout);
    }

    @DeleteMapping("/{id}")
    public void deleteSuperCout(@PathVariable Long id) {
        service.deleteSuperCout(id);
    }
}
```

**Rôle** : Point d'entrée API REST. Expose les endpoints HTTP et renvoie les réponses en JSON.

**Annotations clés** :
- `@RestController` : Indique que c'est un contrôleur REST
- `@RequestMapping` : Préfixe d'URL pour tous les endpoints de la classe
- `@CrossOrigin` : Autorise les requêtes CORS depuis le frontend
- `@GetMapping` : Requête GET (récupérer)
- `@PostMapping` : Requête POST (créer)
- `@DeleteMapping` : Requête DELETE (supprimer)
- `@PathVariable` : Paramètre dans l'URL (ex: `/ticket/123`)
- `@RequestBody` : Données dans le corps de la requête

---

## Partie Frontend

### 1. Point d'entrée : `main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './routes/router'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

**Rôle** : Démarre l'application React et configure le routeur.

---

### 2. Configuration du routeur : `router.jsx`

```jsx
import { createBrowserRouter } from 'react-router-dom'
import SidebarLayout from '../layouts/SidebarLayout'
import FrontOfficeLayout from '../layouts/FrontOfficeLayout'
import Accueil from '../pages/Accueil'
import TicketKanban from '../pages/FrontOffice/TicketKanban'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <BackofficeGate>
        <SidebarLayout />
      </BackofficeGate>
    ),
    children: [
      { index: true, element: <Accueil /> },
      { path: 'dashboard', element: <Dashboard /> },
    ],
  },
  {
    path: '/front',
    element: <FrontOfficeLayout />,
    children: [
      { path: 'tickets-kanban', element: <TicketKanban /> },
    ]
  }
])

export default router
```

**Rôle** : Définit les routes de l'application et associe chaque URL à un composant.

---

### 3. Configuration API GLPI : `api.js`

C'est le fichier le plus important pour la communication avec GLPI. Il gère :
- L'authentification OAuth2 et Legacy
- Les requêtes HTTP avec interceptors
- Le renouvellement automatique des tokens

```js
// Instance Axios pour l'API OAuth2
export const api = axios.create({ baseURL: BASE_URL })

// Intercepteur pour injecter le token
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

// Instance Axios pour l'API Legacy (apirest.php)
export const legacy = axios.create({ baseURL: LEGACY_BASE_URL })
```

**Utilisation** :
```js
import { legacy } from './api'

// Récupérer des tickets
const response = await legacy.get('/Ticket', { 
  params: { range: '0-9999' } 
})

// Récupérer un ticket par ID
const ticket = await legacy.get(`/Ticket/${ticketId}`)
```

---

### 4. Configuration API Backend : `backend-api.js`

```js
import axios from 'axios'

const backendApi = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default backendApi
```

**Rôle** : Client Axios préconfiguré pour communiquer avec le backend Spring Boot.

---

### 5. Service Frontend (Exemple : `superCoutService.js`)

```js
import backendApi from './backend-api'

export const superCoutService = {
  getAll: async () => {
    const response = await backendApi.get('/api/super-cout')
    return response.data
  },

  getByTicketId: async (ticketId) => {
    const response = await backendApi.get(`/api/super-cout/ticket/${ticketId}`)
    return response.data
  },

  create: async (ticketId, cout) => {
    const response = await backendApi.post('/api/super-cout', { ticketId, cout })
    return response.data
  },

  delete: async (id) => {
    return backendApi.delete(`/api/super-cout/${id}`)
  },
}
```

**Rôle** : Wrapper autour de l'API backend pour simplifier les appels depuis les composants.

---

### 6. Composants réutilisables (`components/`)

Tous les composants sont exportés depuis `components/index.js` :

```js
export { default as Button } from './Button'
export { default as Input } from './Input'
export { default as Modal } from './Modal'
export { Table, Thead, Tbody, Tr, Th, Td } from './Table'
export { H1, H2, H3, P } from './Typography'
```

**Utilisation** :
```jsx
import { Button, Input, H1, Table, Tr, Td } from '../components'
```

---

### 7. Layouts (`layouts/`)

Deux layouts principaux :
1. **`SidebarLayout.jsx`** : Pour le back-office (avec barre latérale)
2. **`FrontOfficeLayout.jsx`** : Pour le front-office (interface plus simple)

---

## Flux de données typique

### Exemple : Réouverture d'un ticket depuis le kanban

1. **Utilisateur** : Déplace un ticket de "Terminé" vers "En cours"
2. **`TicketKanban.jsx`** : Détecte le mouvement et affiche la boîte de dialogue
3. **Utilisateur** : Choisit "Réouverture" et saisit un pourcentage
4. **`frontOfficeKanbanTicketService.js`** :
   - Récupère le dernier super cout du ticket via `superCoutService`
   - Calcule le cout d'ouverture : `(dernier_super_cout * pourcentage) / 100`
   - Crée un nouveau cout d'ouverture via `coutOuvertureService`
5. **Backend** :
   - `CoutOuvertureController` reçoit la requête POST
   - `CoutOuvertureService` sauvegarde en base via le repository
6. **Frontend** : Rafraîchit les données affichées

---

## Autres fichiers essentiels

### Base de données backend : `sql/BD.sql`

Contient le schéma SQL pour créer les tables (si `ddl-auto=update` ne suffit pas).

### Configuration Vite : `vite.config.js`

Configure le proxy pour rediriger les requêtes `/api` et `/apirest` vers GLPI.

### Fichiers d'import : `frontend/import/`

Contient des fichiers CSV et ZIP d'exemple pour tester l'import de données.
