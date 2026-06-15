# CRUD Todo List - API + MVC (Pas de CSS)
```txt
projet/
├── backend/          # Backend MVC (Node.js/Express)
│   ├── model.js      # Model (données)
│   ├── controller.js # Controller (logique)
│   ├── routes.js     # Routes API
│   └── server.js     # Serveur
└── frontend/         # Frontend (HTML/JS)
    └── index.html    # Page unique
``` 
## 1. Backend (MVC)
**Installation des dépendances**
```Bash
    cd backend
    npm init -y
    npm install express cors
```
**`backend/model.js` (Model - Données)**

```js
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

export function deleteTodo(id) { todos = todos.filter(t => t.id !== parseInt(id) }
```
**`backend/controller.js` (Controller - Logique)**

