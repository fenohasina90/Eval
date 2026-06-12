# Setup and Deployment - 1_NewApp

## Prérequis
- **Java**: 21 ou plus
- **Maven**: 3.8 ou plus
- **Node.js**: 18 ou plus
- **npm**: 9 ou plus
- **GLPI**: 10 ou plus installé et configuré
- **XAMPP** (pour Windows): Pour Apache et MySQL (si utilisé pour GLPI)

---

## 1. Configuration de GLPI
Avant de commencer, vous devez configurer GLPI pour l'API:

1. Activer l'API REST dans GLPI
   - Configuration → Générale → API
   - Cocher "Activer l'API"
   - Générer un **App Token** et le sauvegarder

2. Créer un utilisateur API ou utiliser un utilisateur existant
   - Générer un **User Token** pour l'utilisateur (si vous utilisez l'authentification par token)
   - Donner les droits nécessaires à l'utilisateur (gestion des tickets, actifs, etc.)

---

## 2. Configuration du Backend

### Étape 2.1: Fichier `application.properties`
Vérifiez la configuration dans `backend/src/main/resources/application.properties`:
```properties
# SQLite
spring.datasource.url=jdbc:sqlite:glpi_kanban.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.community.dialect.SQLiteDialect
```

### Étape 2.2: Démarrer le Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
Le backend démarre sur http://localhost:8080.

---

## 3. Configuration du Frontend

### Étape 3.1: Fichier `.env`
Créez un fichier `.env` dans le dossier `frontend/` avec les variables nécessaires:
```env
# API GLPI
VITE_API_BASE_URL=http://localhost/glpi/apirest.php
VITE_OAUTH_GRANT_TYPE=password
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_OAUTH_CLIENT_SECRET=your-client-secret
VITE_OAUTH_USERNAME=glpi
VITE_OAUTH_PASSWORD=glpi

# API Legacy GLPI
VITE_LEGACY_BASE_URL=http://localhost/glpi/apirest.php
VITE_LEGACY_APP_TOKEN=your-app-token
VITE_LEGACY_LOGIN=glpi
VITE_LEGACY_PASSWORD=glpi

# Backend Spring Boot
VITE_BACKEND_API_BASE_URL=http://localhost:8080
```

### Étape 3.2: Installer les Dépendances et Démarrer
```bash
cd frontend
npm install
npm run dev
```
Le frontend démarre sur http://localhost:5173.

---

## 4. Tests Rapides

1. Accédez à http://localhost:5173
2. Naviguez vers le front office (`/front`)
3. Vérifiez que la liste des actifs se charge
4. Essayez de créer un ticket
5. Essayez d'exporter la liste en PDF

---

## 5. Déploiement en Production

### Backend
```bash
cd backend
./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
cd frontend
npm run build
# Servir le dossier dist/ avec un serveur web (Apache, Nginx, etc.)
```

---

## 6. Dépannage

### Problème: CORS Errors
- Vérifiez que le backend a `@CrossOrigin(origins = "*")` sur ses controllers
- Vérifiez la configuration CORS de GLPI

### Problème: Authentification GLPI Échoue
- Vérifiez l'App Token et les identifiants
- Vérifiez que l'API est activée dans GLPI
- Vérifiez les droits de l'utilisateur

### Problème: Erreurs SQLite
- Vérifiez que le backend a les droits d'écriture dans son dossier
- Vérifiez que `hibernate-community-dialects` est bien dans le pom.xml

