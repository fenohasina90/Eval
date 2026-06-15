# Spring Boot - Guide CRUD Simple + Requête SQL

## 1. Structure du Projet Spring Boot
```
mon-projet/
├── pom.xml                          # Dépendances Maven
└── src/main/java/com/exemple/
    ├── MonApplication.java         # Point d'entrée
    ├── entity/
    │   └── Todo.java               # Entité (table DB)
    ├── repository/
    │   └── TodoRepository.java     # Accès DB
    ├── service/
    │   └── TodoService.java        # Logique métier
    └── controller/
        └── TodoController.java     # Endpoints API
```

---

## 2. Fichier `pom.xml` (Dépendances)
```xml
<dependencies>
    <!-- Spring Boot Web (API REST) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Spring Data JPA (Accès DB) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <!-- H2 Database (DB en mémoire pour test) -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

---

## 3. Configuration `application.properties`
```properties
# H2 Database (en mémoire)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA (crée les tables automatiquement)
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
```

---

## 4. Entité (`Todo.java`)
```java
package com.exemple.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "todo")
public class Todo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String text;

    @Column(nullable = false)
    private Boolean done = false;

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Boolean getDone() { return done; }
    public void setDone(Boolean done) { this.done = done; }
}
```

---

## 5. Repository (`TodoRepository.java`)
```java
package com.exemple.repository;

import com.exemple.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    // --- 1. Méthodes auto-générées (CRUD de base) ---
    // (Spring Data JPA les implémente automatiquement)
    // - save() : créer/mettre à jour
    // - findById() : trouver par ID
    // - findAll() : trouver tous
    // - deleteById() : supprimer par ID
    // - deleteAll() : supprimer tous

    // --- 2. Méthode dérivée (Spring génère la requête SQL) ---
    List<Todo> findByDone(Boolean done);

    // --- 3. Requête SQL personnalisée (avancée) ---
    @Query("SELECT t FROM Todo t WHERE t.text LIKE %:keyword%")
    List<Todo> searchByKeyword(@Param("keyword") String keyword);
}
```

---

## 6. Service (`TodoService.java`)
```java
package com.exemple.service;

import com.exemple.entity.Todo;
import com.exemple.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TodoService {

    @Autowired
    private TodoRepository repository;

    // CREATE
    public Todo createTodo(String text) {
        Todo todo = new Todo();
        todo.setText(text);
        return repository.save(todo);
    }

    // READ (tous)
    public List<Todo> getAllTodos() {
        return repository.findAll();
    }

    // READ (par ID)
    public Optional<Todo> getTodoById(Long id) {
        return repository.findById(id);
    }

    // UPDATE
    public Todo updateTodo(Long id, String text, Boolean done) {
        Todo todo = repository.findById(id).orElseThrow();
        todo.setText(text);
        todo.setDone(done);
        return repository.save(todo);
    }

    // DELETE
    public void deleteTodo(Long id) {
        repository.deleteById(id);
    }

    // --- Requêtes avancées ---
    public List<Todo> getTodosByDone(Boolean done) {
        return repository.findByDone(done);
    }

    public List<Todo> searchTodos(String keyword) {
        return repository.searchByKeyword(keyword);
    }
}
```

---

## 7. Controller (`TodoController.java`)
```java
package com.exemple.controller;

import com.exemple.entity.Todo;
import com.exemple.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*")
public class TodoController {

    @Autowired
    private TodoService service;

    // CREATE
    @PostMapping
    public Todo createTodo(@RequestBody Map<String, String> body) {
        return service.createTodo(body.get("text"));
    }

    // READ (tous)
    @GetMapping
    public List<Todo> getAllTodos() {
        return service.getAllTodos();
    }

    // READ (par ID)
    @GetMapping("/{id}")
    public Todo getTodoById(@PathVariable Long id) {
        return service.getTodoById(id).orElseThrow();
    }

    // UPDATE
    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return service.updateTodo(
                id,
                (String) body.get("text"),
                (Boolean) body.get("done")
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Long id) {
        service.deleteTodo(id);
    }

    // --- Endpoints avancés ---
    @GetMapping("/done/{done}")
    public List<Todo> getTodosByDone(@PathVariable Boolean done) {
        return service.getTodosByDone(done);
    }

    @GetMapping("/search")
    public List<Todo> searchTodos(@RequestParam String keyword) {
        return service.searchTodos(keyword);
    }
}
```

---

## 8. Point d'entrée (`MonApplication.java`)
```java
package com.exemple;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MonApplication {
    public static void main(String[] args) {
        SpringApplication.run(MonApplication.class, args);
    }
}
```

---

## 9. Endpoints API

| Méthode | URL | Description |
| --- | --- | --- |
| POST | `/api/todos` | Créer un todo |
| GET | `/api/todos` | Lister tous les todos |
| GET | `/api/todos/{id}` | Obtenir un todo par ID |
| PUT | `/api/todos/{id}` | Modifier un todo |
| DELETE | `/api/todos/{id}` | Supprimer un todo |
| GET | `/api/todos/done/{done}` | Filtrer les todos par état (true/false) |
| GET | `/api/todos/search?keyword=abc` | Rechercher par mot-clé |

---

## 10. Exemples d'utilisation

### Créer un todo (POST)
```
POST /api/todos
Body: { "text": "Apprendre Spring Boot" }
```

### Rechercher par mot-clé (GET)
```
GET /api/todos/search?keyword=Spring
```

### Filtrer les todos terminés (GET)
```
GET /api/todos/done/true
```
