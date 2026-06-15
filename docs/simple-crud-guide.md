# Guide CRUD Simple - API + MVC (Pas de CSS)

## Architecture
```
projet/
├── backend/          # Backend MVC (Node.js/Express)
│   ├── model.js      # Model (données)
│   ├── controller.js # Controller (logique)
│   ├── routes.js     # Routes API
│   └── server.js     # Serveur
└── frontend/         # Frontend (HTML/JS)
    └── index.html    # Page unique
```

---

## 1. Backend (MVC)

### Installation
```bash
cd backend
npm init -y
npm install express cors
```

---

### `backend/model.js` (Model - Données)
```javascript
// Stockage en mémoire (pas de DB pour simplifier)
let todos = [
  { id: 1, text: "Apprendre le CRUD" },
  { id: 2, text: "Faire le café" }
]

let nextId = 3

// Exports
export function getTodos() { return todos }
export function getTodo(id) { return todos.find(t => t.id == id) }
export function addTodo(text) {
  const todo = { id: nextId++, text }
  todos = [...todos, todo]
  return todo
}
export function updateTodo(id, newText) {
  todos = todos.map(t => t.id == id ? { ...t, text: newText } : t)
  return getTodo(id)
}
export function deleteTodo(id) { todos = todos.filter(t => t.id !== parseInt(id)) }
```
---

### `backend/controller.js` (Controller - Logique)
```javascript
import { getTodos, getTodo, addTodo, updateTodo, deleteTodo } from "./model.js"

export function getTodosController(req, res) {
  res.json(getTodos())
}

export function getTodoController(req, res) {
  const todo = getTodo(req.params.id)
  todo ? res.json(todo) : res.sendStatus(404)
}

export function createTodoController(req, res) {
  const todo = addTodo(req.body.text)
  res.status(201).json(todo)
}

export function updateTodoController(req, res) {
  const todo = updateTodo(req.params.id, req.body.text)
  res.json(todo)
}

export function deleteTodoController(req, res) {
  deleteTodo(req.params.id)
  res.sendStatus(204)
}
```
---

### `backend/routes.js` (Routes API)
```javascript
import express from "express"
import { 
  getTodosController, 
  getTodoController, 
  createTodoController, 
  updateTodoController, 
  deleteTodoController 
} from "./controller.js"
const router = express.Router()

router.get("/todos", getTodosController)
router.get("/todos/:id", getTodoController)
router.post("/todos", createTodoController)
router.put("/todos/:id", updateTodoController)
router.delete("/todos/:id", deleteTodoController)

export default router
```
---

### `backend/server.js` (Serveur)
```javascript
import express from "express"
import cors from "cors"
import todoRouter from "./routes.js"
const app = express()

// Middleware pour lire le JSON
app.use(express.json())
// Autoriser CORS
app.use(cors())
// Routes API
app.use("/api", todoRouter)

// Démarrer le serveur
app.listen(3000, () => console.log("Serveur: http://localhost:3000"))
```

---

## 2. Frontend (HTML + JS)
### `frontend/index.html`
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
</head>
<body>

  <div>
    <h1>Todo List</h1>
    <input id="todoInput" placeholder="Ajouter une tâche" />
    <button onclick="addTodo()">Ajouter</button>
  </div>

  <ul id="todoList"></ul>

  <script>
    const API_URL = "http://localhost:3000/api/todos"
    const todoListEl = document.getElementById("todoList")
    const todoInputEl = document.getElementById("todoInput")
    let todos = []

    // Charger todos
    async function fetchTodos() {
      const res = await fetch(API_URL)
      todos = await res.json()
      renderTodos()
    }

    // Afficher todos
    function renderTodos() {
      todoListEl.innerHTML = todos.map(todo => `
        <li>
          <span>${todo.text}</span>
          <button onclick="deleteTodo(${todo.id})">❌</button>
          <button onclick="promptUpdate(${todo.id})">✏️</button>
        </li>
      `).join("")
    }

    // Ajouter todo
    async function addTodo() {
      if (!todoInputEl.value) return
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: todoInputEl.value })
      })
      todoInputEl.value = ""
      fetchTodos()
    }

    // Modifier todo (prompt)
    async function promptUpdate(id) {
      const newText = prompt("Nouveau texte :")
      if (!newText) return
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText })
      })
      fetchTodos()
    }

    // Supprimer todo
    async function deleteTodo(id) {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" })
      fetchTodos()
    }

    // Démarrer
    fetchTodos()
  </script>
</body>
</html>
```

---

## 3. Explication

### Backend MVC
| Fichier | Rôle |
| --- | --- |
| **Model (`model.js`)** | Gère les données (stockage en mémoire) |
| **Controller (`controller.js`)** | Logique métier (ajouter/supprimer/mettre à jour) |
| **Routes (`routes.js`)** | Définit les endpoints API |
| **Server (`server.js`)** | Lance le serveur Express |

### Endpoints API
| Méthode | URL | Action |
| --- | --- | --- |
| GET | `/api/todos` | Lister tous les todos |
| GET | `/api/todos/:id` | Récupérer un todo par ID |
| POST | `/api/todos` | Créer un todo |
| PUT | `/api/todos/:id` | Modifier un todo |
| DELETE | `/api/todos/:id` | Supprimer un todo |

---

## Pour lancer
1. Démarrer backend:
```bash
cd backend
node server.js
```
2. Ouvrir `frontend/index.html` dans un navigateur.
