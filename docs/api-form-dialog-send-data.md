# Documentation : Envoi de données depuis un formulaire / boîte de dialogue vers une API

Cette documentation explique comment les données sont envoyées depuis un formulaire ou une boîte de dialogue (Modal) vers une API backend, en utilisant comme exemple la fonctionnalité de réouverture/annulation de ticket (passage de "Terminé" à "En cours").

---

## 1. Architecture globale

```
Frontend (React)          →          Backend (Spring Boot)
├── Composant Modal       →          ├── Controller
├── Service               →          ├── Service
└── API Client            →          └── Repository & Entity
```

---

## 2. Exemple concret : Réouverture / Annulation de ticket

### 2.1 Frontend : Boîte de dialogue (Modal)

**Fichier :** `frontend/src/pages/FrontOffice/TicketKanban.jsx`

Voici le code qui affiche la boîte de dialogue personnalisée pour la réouverture :

```jsx
{/* Special case for reopen dialog */}
{moveDialog?.type === 'reopen' ? (
  <div className="space-y-4">
    <div className="flex gap-2">
      {/* Bouton Annulation */}
      <Button
        variant="outline"
        onClick={() => {
          if (!pendingMove) return;
          applyMove({
            ticketId: pendingMove.ticketId,
            toStatus: pendingMove.toStatus,
            extra: { ...moveForm, action: 'annulation' }, // On spécifie l'action "annulation"
            fromStatus: pendingMove.fromStatus
          });
        }}
        disabled={moveSubmitting}
      >
        Annulation
      </Button>

      {/* Section Réouverture */}
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700 mb-2">Réouverture</div>
        <div className="flex gap-2">
          {/* Champ pour le pourcentage */}
          <Input
            type="number"
            placeholder="Pourcentage (%)"
            value={moveForm.pourcentage || ''}
            onChange={(e) => setMoveForm((prev) => ({ ...prev, pourcentage: e.target.value }))}
          />
          {/* Bouton Valider la réouverture */}
          <Button
            variant="primary"
            onClick={() => {
              if (!pendingMove) return;
              applyMove({
                ticketId: pendingMove.ticketId,
                toStatus: pendingMove.toStatus,
                extra: { ...moveForm, action: 'reouverture' }, // On spécifie l'action "reouverture"
                fromStatus: pendingMove.fromStatus
              });
            }}
            disabled={moveSubmitting || !pendingMove || !moveForm.pourcentage}
          >
            Valider
          </Button>
        </div>
      </div>
    </div>
  </div>
) : (
  {/* ... formulaire classique pour d'autres changements de statut */}
)}
```

**Explication :**
- Lorsque l'utilisateur clique sur "Annulation" ou "Valider", on appelle `applyMove()`
- On ajoute à `extra` une propriété `action` qui indique quel type d'action il faut effectuer (`annulation` ou `reouverture`)
- Pour la réouverture, on transmet aussi `pourcentage` saisi par l'utilisateur

---

### 2.2 Frontend : Logique de traitement

**Fichier :** `frontend/src/services/frontOfficeKanbanTicketService.js`

Voici la fonction `getMoveDialogConfig()` qui détecte le passage de "Terminé" à "En cours" :

```js
export function getMoveDialogConfig({ fromStatus, toStatus }) {
  const from = Number(fromStatus);
  const to = Number(toStatus);
  if (Number.isNaN(from) || Number.isNaN(to) || from === to) return null;

  // Détection du passage de CLOSED (6) à IN_PROGRESS (2)
  if (from === KANBAN_TICKET_STATUSES.CLOSED && to === KANBAN_TICKET_STATUSES.IN_PROGRESS) {
    return {
      title: 'Réouvrir le ticket',
      type: 'reopen', // Type spécial pour afficher la boîte de dialogue personnalisée
      fields: []
    };
  }

  // ... autres configurations de boîtes de dialogue
}
```

Maintenant, la fonction `updateTicketStatus()` qui traite les deux actions :

```js
export async function updateTicketStatus(ticketId, toStatus, extra = {}, oldStatus = null) {
  // ... code pour mettre à jour le statut du ticket dans GLPI ...

  // --- Traitement de l'action Annulation ---
  if (extra?.action === 'annulation') {
    try {
      // Récupère tous les super couts du ticket
      const superCouts = await superCoutService.getByTicketId(Number(ticketId));
      if (superCouts && superCouts.length > 0) {
        // Récupère le dernier super cout
        const lastSuperCout = superCouts[superCouts.length - 1];
        // Supprime le dernier super cout via l'API
        await superCoutService.delete(lastSuperCout.id);
      }
    } catch (error) {
      console.error('Failed to delete super cout:', error);
    }
  }

  // --- Traitement de l'action Réouverture ---
  if (extra?.action === 'reouverture' && extra?.pourcentage != null) {
    try {
      // Récupère tous les super couts du ticket
      const superCouts = await superCoutService.getByTicketId(Number(ticketId));
      if (superCouts && superCouts.length > 0) {
        const lastSuperCout = superCouts[superCouts.length - 1];
        // Convertit le pourcentage en nombre (remplace la virgule par un point)
        const pourcentage = Number(String(extra.pourcentage).replace(',', '.'));
        // Calcule le cout de réouverture : (dernier super cout * pourcentage) / 100
        const coutOuverture = (lastSuperCout.cout * pourcentage) / 100;
        
        // Crée le cout de réouverture via l'API
        await coutOuvertureService.create(
          Number(ticketId),
          coutOuverture,
          pourcentage,
          lastSuperCout.cout
        );
      }
    } catch (error) {
      console.error('Failed to create cout ouverture:', error);
    }
  }

  // ... reste de la fonction ...
}
```

---

### 2.3 Frontend : Services API

**Fichier :** `frontend/src/services/superCoutService.js`
```js
import backendApi from './backend-api';

export const superCoutService = {
  // Récupère tous les super couts d'un ticket
  getByTicketId: async (ticketId) => {
    const response = await backendApi.get(`/api/super-cout/ticket/${ticketId}`);
    return response.data;
  },
  
  // Supprime un super cout par son ID
  delete: async (id) => {
    return backendApi.delete(`/api/super-cout/${id}`);
  },
  
  // ... autres méthodes ...
};
```

**Fichier :** `frontend/src/services/coutOuvertureService.js`
```js
import backendApi from './backend-api';

export const coutOuvertureService = {
  // Crée un nouveau cout de réouverture
  create: async (ticketId, coutOuverture, pourcentage, superCoutInitial) => {
    const response = await backendApi.post('/api/cout-ouverture', { 
      ticketId, 
      coutOuverture, 
      pourcentage, 
      superCoutInitial 
    });
    return response.data;
  },
  
  // ... autres méthodes ...
};
```

**Fichier :** `frontend/src/services/backend-api.js`
Client Axios préconfiguré pour communiquer avec le backend :
```js
import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://localhost:8080', // URL du backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default backendApi;
```

---

## 3. Backend : Réception et traitement des données

### 3.1 Controller (Point d'entrée API)

**Fichier :** `backend/src/main/java/com/eval/backend/controller/CoutOuvertureController.java`

```java
@RestController
@RequestMapping("/api/cout-ouverture")
@CrossOrigin(origins = "*") // Autorise les requêtes CORS depuis le frontend
public class CoutOuvertureController {

    @Autowired
    private CoutOuvertureService service;

    // Point d'API POST pour créer un cout de réouverture
    @PostMapping
    public CoutOuvertureDTO createCoutOuverture(@RequestBody Map<String, Object> request) {
        // Récupère et convertit les données du corps de la requête
        Long ticketId = Long.valueOf(request.get("ticketId").toString());
        Double coutOuverture = Double.valueOf(request.get("coutOuverture").toString());
        Double pourcentage = Double.valueOf(request.get("pourcentage").toString());
        Double superCoutInitial = Double.valueOf(request.get("superCoutInitial").toString());
        
        // Appelle le service pour créer l'entité en base de données
        return service.createCoutOuverture(ticketId, coutOuverture, pourcentage, superCoutInitial);
    }

    // ... autres points d'API ...
}
```

**Fichier :** `backend/src/main/java/com/eval/backend/controller/SuperCoutController.java`
```java
@RestController
@RequestMapping("/api/super-cout")
@CrossOrigin(origins = "*")
public class SuperCoutController {

    @Autowired
    private SuperCoutService service;

    // Point d'API DELETE pour supprimer un super cout
    @DeleteMapping("/{id}")
    public void deleteSuperCout(@PathVariable Long id) {
        service.deleteSuperCout(id);
    }

    // ... autres points d'API ...
}
```

---

### 3.2 Service (Logique métier)

**Fichier :** `backend/src/main/java/com/eval/backend/service/CoutOuvertureService.java`
```java
@Service
public class CoutOuvertureService {

    @Autowired
    private CoutOuvertureRepository repository;

    public CoutOuvertureDTO createCoutOuverture(Long ticketId, Double coutOuverture, Double pourcentage, Double superCoutInitial) {
        // Crée une nouvelle entité CoutOuverture
        CoutOuverture coutOuvertureEntity = new CoutOuverture();
        coutOuvertureEntity.setTicketId(ticketId);
        coutOuvertureEntity.setCoutOuverture(coutOuverture);
        coutOuvertureEntity.setPourcentage(pourcentage);
        coutOuvertureEntity.setSuperCoutInitial(superCoutInitial);

        // Sauvegarde l'entité en base de données
        CoutOuverture saved = repository.save(coutOuvertureEntity);
        
        // Convertit l'entité en DTO pour la réponse
        return convertToDTO(saved);
    }

    // ... autres méthodes ...
}
```

---

### 3.3 Repository (Accès à la base de données)

**Fichier :** `backend/src/main/java/com/eval/backend/repository/CoutOuvertureRepository.java`
```java
@Repository
public interface CoutOuvertureRepository extends JpaRepository<CoutOuverture, Long> {
    // Méthode automatiquement implémentée par Spring Data JPA
    List<CoutOuverture> findByTicketId(Long ticketId);
}
```

---

### 3.4 Entity (Modèle de données)

**Fichier :** `backend/src/main/java/com/eval/backend/entity/CoutOuverture.java`
```java
@Entity
@Table(name = "cout_ouverture")
public class CoutOuverture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "cout_ouverture", nullable = false)
    private Double coutOuverture;

    @Column(name = "pourcentage", nullable = false)
    private Double pourcentage;

    @Column(name = "super_cout_initial", nullable = false)
    private Double superCoutInitial;

    // Getters et Setters
    // ...
}
```

---

## 4. Résumé du flux complet

```
1. UTILISATEUR       → Déplace un ticket de "Terminé" vers "En cours"
2. TICKETKANBAN.JSX  → Détecte le type de mouvement et affiche la boîte de dialogue
3. UTILISATEUR       → Clique sur "Annulation" ou "Réouverture" + saisit le pourcentage
4. TICKETKANBAN.JSX  → Appelle applyMove() avec les données extra
5. FRONTOFFICEKANBANTICKETSERVICE.JS  → Appelle les services API appropriés
6. COUTOUVERTURESERVICE.JS / SUPERCOUTSERVICE.JS  → Envoie la requête HTTP via Axios
7. BACKEND           → Reçoit la requête via le Controller
8. COUTOUVERTURECONTROLLER.JS  → Traite la requête et appelle le Service
9. COUTOUVERTURESERVICE.JS  → Sauvegarde/supprime les données via le Repository
10. DATABASE         → Les modifications sont persistées
11. BACKEND          → Renvoie une réponse au Frontend
12. FRONTEND         → Réactualise les données affichées
```

---

## 5. Points clés à retenir

1. **CORS** : Utilisez `@CrossOrigin(origins = "*")` sur le Controller backend pour autoriser les requêtes depuis le frontend
2. **DTO vs Entity** : Utilisez des DTO (Data Transfer Object) pour échanger des données entre le frontend et le backend, et des Entity pour la base de données
3. **Gestion des erreurs** : Utilisez des `try/catch` pour gérer les erreurs et afficher des messages à l'utilisateur
4. **Formatage des nombres** : Remplacez les virgules par des points pour les nombres décimaux (compatibilité entre locales)
5. **Type d'action** : Utilisez un champ `action` dans l'objet `extra` pour identifier quel traitement effectuer côté service
