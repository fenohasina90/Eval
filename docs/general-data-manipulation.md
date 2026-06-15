# Documentation : Bases de la manipulation des données (Récupération, Envoi)

Cette documentation présente les concepts fondamentaux de la manipulation des données entre un frontend et un backend, avec des exemples pratiques.

---

## 1. Concepts de base : Les méthodes HTTP

Les interactions entre un client (frontend) et un serveur (backend) se font via des requêtes HTTP, utilisant des méthodes standard :

| Méthode | Description | Cas d'usage |
|---------|-------------|-------------|
| `GET`   | Récupérer des données depuis le serveur | Charger une liste d'éléments, récupérer un profil utilisateur |
| `POST`  | Envoyer de nouvelles données au serveur | Créer un nouveau ticket, ajouter un utilisateur |
| `PUT`   | Mettre à jour une ressource existante (remplacement complet) | Modifier un ticket, mettre à jour un profil |
| `PATCH` | Mettre à jour partiellement une ressource | Changer seulement le statut d'un ticket |
| `DELETE`| Supprimer une ressource | Supprimer un ticket, retirer un utilisateur |

---

## 2. Structure d'une requête / réponse HTTP

### 2.1 Une requête HTTP contient :
- **URL** : L'adresse de la ressource (ex: `https://api.example.com/tickets`)
- **Méthode** : `GET`, `POST`, etc.
- **En-têtes (Headers)** : Métadonnées (type de contenu, authentification)
- **Corps (Body)** : Données envoyées (pour `POST`, `PUT`, `PATCH`)
- **Paramètres (Query Params)** : Données dans l'URL (ex: `?page=2&limit=10`)

### 2.2 Une réponse HTTP contient :
- **Code de statut** : Indique le résultat de la requête
- **En-têtes** : Métadonnées de réponse
- **Corps** : Données renvoyées (généralement en JSON)

---

### 2.3 Codes de statut HTTP courants

| Code | Signification |
|------|---------------|
| `200 OK` | Requête réussie (récupération ou modification) |
| `201 Created` | Ressource créée avec succès (POST) |
| `400 Bad Request` | Données invalides dans la requête |
| `401 Unauthorized` | Authentification requise |
| `403 Forbidden` | Accès refusé (même authentifié) |
| `404 Not Found` | Ressource non trouvée |
| `500 Internal Server Error` | Erreur serveur |

---

## 3. Récupération de données (GET)

### 3.1 Exemple : JavaScript natif (Fetch API)

```js
// Récupérer une liste de tickets
async function getTickets() {
  try {
    // Envoie la requête GET
    const response = await fetch('https://api.example.com/tickets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Si authentification est nécessaire :
        'Authorization': 'Bearer VOTRE_TOKEN'
      }
    });

    // Vérifie si la requête a réussi
    if (!response.ok) {
      throw new Error(`Erreur ${response.status} : ${response.statusText}`);
    }

    // Transforme la réponse en JSON
    const tickets = await response.json();
    console.log('Tickets récupérés :', tickets);
    return tickets;

  } catch (error) {
    console.error('Erreur lors de la récupération :', error);
  }
}

// Appeler la fonction
getTickets();
```

---

### 3.2 Exemple : React avec `useEffect`

```jsx
import { useState, useEffect } from 'react';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fonction pour charger les données
    async function fetchTickets() {
      try {
        const response = await fetch('https://api.example.com/tickets');
        if (!response.ok) throw new Error('Erreur de chargement');
        const data = await response.json();
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []); // Tableau de dépendances vide = s'exécute une fois au montage

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  return (
    <ul>
      {tickets.map(ticket => (
        <li key={ticket.id}>{ticket.name}</li>
      ))}
    </ul>
  );
}

export default TicketList;
```

---

### 3.3 Exemple : Avec paramètres dans l'URL

```js
// Récupérer la page 2 des tickets, avec 10 éléments par page
async function getTicketsPaginated() {
  const response = await fetch('https://api.example.com/tickets?page=2&limit=10');
  const data = await response.json();
  return data;
}

// Avec des paramètres dynamiques
async function searchTickets(query) {
  const params = new URLSearchParams({
    q: query,
    status: 'en_cours'
  });
  const response = await fetch(`https://api.example.com/tickets?${params}`);
  return response.json();
}
```

---

## 4. Envoi de données (POST)

### 4.1 Exemple : JavaScript natif

```js
// Créer un nouveau ticket
async function createTicket(newTicket) {
  try {
    const response = await fetch('https://api.example.com/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Indique que le corps est du JSON
      },
      body: JSON.stringify(newTicket) // Convertit l'objet JS en chaîne JSON
    });

    if (!response.ok) throw new Error('Erreur de création');

    const createdTicket = await response.json();
    console.log('Ticket créé :', createdTicket);
    return createdTicket;

  } catch (error) {
    console.error('Erreur :', error);
  }
}

// Utilisation
const nouveauTicket = {
  name: 'Problème de connexion',
  description: 'Je ne peux pas accéder au réseau',
  priority: 'haute'
};

createTicket(nouveauTicket);
```

---

### 4.2 Exemple : React avec formulaire

```jsx
import { useState } from 'react';

function TicketForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); // Empêche le rechargement de la page

    const newTicket = { name, description };

    try {
      const response = await fetch('https://api.example.com/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });

      if (!response.ok) throw new Error('Erreur de création');
      alert('Ticket créé !');
      setName(''); // Réinitialise le formulaire
      setDescription('');
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nom :</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Description :</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <button type="submit">Créer le ticket</button>
    </form>
  );
}

export default TicketForm;
```

---

## 5. Mise à jour de données (PUT / PATCH)

### 5.1 Exemple : Mettre à jour complètement (PUT)

```js
async function updateTicket(ticketId, updatedData) {
  const response = await fetch(`https://api.example.com/tickets/${ticketId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
  });
  return response.json();
}

// Utilisation
updateTicket(123, {
  name: 'Problème de connexion (mis à jour)',
  description: 'Toujours pas résolu',
  status: 'en_cours'
});
```

---

### 5.2 Exemple : Mettre à jour partiellement (PATCH)

```js
// Changer seulement le statut du ticket
async function updateTicketStatus(ticketId, newStatus) {
  const response = await fetch(`https://api.example.com/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });
  return response.json();
}

// Utilisation
updateTicketStatus(123, 'résolu');
```

---

## 6. Suppression de données (DELETE)

```js
async function deleteTicket(ticketId) {
  try {
    const response = await fetch(`https://api.example.com/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer VOTRE_TOKEN'
      }
    });

    if (!response.ok) throw new Error('Erreur de suppression');
    console.log('Ticket supprimé');

  } catch (error) {
    console.error(error);
  }
}

// Utilisation
deleteTicket(123);
```

---

## 7. Backend : Exemples basiques

### 7.1 Exemple : Node.js / Express

```js
import express from 'express';
const app = express();
app.use(express.json()); // Pour parser le corps des requêtes JSON

// Base de données simulée
let tickets = [
  { id: 1, name: 'Problème de connexion', status: 'en_cours' }
];

// GET : Récupérer tous les tickets
app.get('/tickets', (req, res) => {
  res.status(200).json(tickets);
});

// GET : Récupérer un ticket par ID
app.get('/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === parseInt(req.params.id));
  if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé' });
  res.status(200).json(ticket);
});

// POST : Créer un ticket
app.post('/tickets', (req, res) => {
  const newTicket = {
    id: tickets.length + 1,
    name: req.body.name,
    status: 'nouveau'
  };
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

// PUT : Mettre à jour un ticket
app.put('/tickets/:id', (req, res) => {
  const index = tickets.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Non trouvé' });
  
  tickets[index] = { ...tickets[index], ...req.body };
  res.status(200).json(tickets[index]);
});

// DELETE : Supprimer un ticket
app.delete('/tickets/:id', (req, res) => {
  tickets = tickets.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send(); // 204 = Pas de contenu
});

// Démarrer le serveur
app.listen(3000, () => console.log('Serveur démarré sur http://localhost:3000'));
```

---

### 7.2 Exemple : Spring Boot (Java)

```java
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    // Base de données simulée
    private List<Ticket> tickets = new ArrayList<>(
        List.of(new Ticket(1, "Problème de connexion", "en_cours"))
    );

    // GET : Tous les tickets
    @GetMapping
    public List<Ticket> getAllTickets() {
        return tickets;
    }

    // GET : Un ticket par ID
    @GetMapping("/{id}")
    public Ticket getTicket(@PathVariable Long id) {
        return tickets.stream()
            .filter(t -> t.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

    // POST : Créer un ticket
    @PostMapping
    public Ticket createTicket(@RequestBody Ticket ticket) {
        ticket.setId((long) (tickets.size() + 1));
        tickets.add(ticket);
        return ticket;
    }

    // PUT : Mettre à jour
    @PutMapping("/{id}")
    public Ticket updateTicket(@PathVariable Long id, @RequestBody Ticket updatedTicket) {
        Ticket ticket = tickets.stream()
            .filter(t -> t.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Non trouvé"));
        ticket.setName(updatedTicket.getName());
        ticket.setStatus(updatedTicket.getStatus());
        return ticket;
    }

    // DELETE : Supprimer
    @DeleteMapping("/{id}")
    public void deleteTicket(@PathVariable Long id) {
        tickets.removeIf(t -> t.getId().equals(id));
    }

    // Classe Ticket (modèle)
    public static class Ticket {
        private Long id;
        private String name;
        private String status;
        // Constructeurs, getters et setters
    }
}
```

---

## 8. Gestion des erreurs (Bonnes pratiques)

### 8.1 Côté frontend

```js
async function fetchData(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Gérer les codes d'erreur spécifiques
      switch (response.status) {
        case 401: throw new Error('Veuillez vous connecter');
        case 404: throw new Error('Ressource non trouvée');
        case 500: throw new Error('Erreur serveur, réessayez plus tard');
        default: throw new Error('Erreur inattendue');
      }
    }

    return await response.json();

  } catch (error) {
    // Afficher un message à l'utilisateur
    alert(error.message);
    // Enregistrer l'erreur pour le débogage
    console.error('Erreur:', error);
    // Optionnel : renvoyer une valeur par défaut
    return null;
  }
}
```

---

### 8.2 Côté backend

```js
// Express
app.get('/tickets/:id', (req, res) => {
  try {
    const ticket = tickets.find(t => t.id === parseInt(req.params.id));
    if (!ticket) {
      return res.status(404).json({ 
        error: 'NOT_FOUND', 
        message: 'Ticket non trouvé' 
      });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Erreur serveur' 
    });
  }
});
```

---

## 9. Bonnes pratiques générales

1. **Utilisez des noms de routes clairs** :
   - `GET /tickets` (récupérer tous les tickets)
   - `GET /tickets/:id` (récupérer un ticket)
   - `POST /tickets` (créer un ticket)
   - `PUT /tickets/:id` (mettre à jour un ticket)
   - `DELETE /tickets/:id` (supprimer un ticket)

2. **Validez les données** :
   - Côté frontend (formulaires)
   - Côté backend (toujours valider, ne pas faire confiance au frontend)

3. **Utilisez HTTPS** :
   - Sécurise les données échangées

4. **Gérez les états de chargement** :
   - Affichez un "Chargement..." pendant que les données sont récupérées
   - Désactivez les boutons pendant l'envoi

5. **Cachez les données quand c'est pertinent** :
   - Évitez les requêtes inutiles pour des données qui ne changent pas souvent

6. **Utilisez des IDs uniques** :
   - Pour identifier chaque ressource (UUID, entier auto-incrémenté)
