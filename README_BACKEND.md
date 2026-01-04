# Configuration Backend Laravel - EuropShip

## Installation rapide

### 1. Prérequis
- PHP >= 8.2
- Composer
- MySQL/MariaDB
- Extension PHP : `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`

### 2. Installation

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
composer install

# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé d'application
php artisan key:generate
```

### 3. Configuration de la base de données

Éditer `.env` et configurer :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=europship
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe
```

### 4. Configuration de l'email

Pour l'envoi des OTP par email, configurer dans `.env` :

**Option 1 : Gmail (recommandé pour le développement)**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_app  # Mot de passe d'application Gmail
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@europship.com"
MAIL_FROM_NAME="EuropShip"
```

**Option 2 : Mailtrap (pour les tests)**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=votre_username_mailtrap
MAIL_PASSWORD=votre_password_mailtrap
MAIL_ENCRYPTION=null
```

### 5. Créer la base de données et exécuter les migrations

```bash
# Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE europship;
EXIT;

# Exécuter les migrations
php artisan migrate
```

### 6. Démarrer le serveur

```bash
php artisan serve
```

Le serveur sera accessible sur `http://localhost:8000`

## Configuration Frontend

Dans le fichier `.env` du frontend (ou `vite.config.ts`), ajouter :

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Ou créer un fichier `.env.local` dans la racine du projet frontend :

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Test avec l'email unique

Actuellement, le système utilise l'email de test `adlizineb2004@gmail.com` pour les deux rôles (admin et agent).

Pour tester :
1. Démarrer le backend : `php artisan serve`
2. Démarrer le frontend : `npm run dev`
3. Aller sur la page de login
4. Cliquer sur "Send OTP Code"
5. Vérifier l'email (ou la console en mode debug)
6. Entrer le code OTP à 6 chiffres
7. Se connecter

## Passage aux 6 emails réels

### Étape 1 : Ajouter les utilisateurs dans la base de données

```sql
INSERT INTO users (email, role, status, created_at, updated_at) VALUES
('admin1@europship.com', 'admin', 'active', NOW(), NOW()),
('agent1@europship.com', 'agent', 'active', NOW(), NOW()),
('agent2@europship.com', 'agent', 'active', NOW(), NOW()),
('agent3@europship.com', 'agent', 'active', NOW(), NOW()),
('agent4@europship.com', 'agent', 'active', NOW(), NOW()),
('agent5@europship.com', 'agent', 'active', NOW(), NOW());
```

### Étape 2 : Modifier AuthController.php

Modifier la méthode `requestOtp` pour identifier l'utilisateur. Options :

**Option A : Identifier par un paramètre dans la requête**
```php
public function requestOtp(Request $request)
{
    $request->validate([
        'email' => 'required|email',
    ]);
    
    $email = $request->email;
    $user = User::where('email', $email)->first();
    // ... reste du code
}
```

**Option B : Identifier par un identifiant unique (ID, username, etc.)**
```php
public function requestOtp(Request $request)
{
    $request->validate([
        'user_identifier' => 'required|string',
    ]);
    
    // Logique pour trouver l'utilisateur
    $user = User::where('email', $request->user_identifier)
        ->orWhere('id', $request->user_identifier)
        ->first();
    // ... reste du code
}
```

**Option C : Utiliser une table de mapping**
Créer une table `user_identifiers` qui mappe un identifiant unique à un email.

## API Endpoints

### Authentification

- **POST** `/api/auth/request-otp`
  - Demande un code OTP
  - Réponse : `{ "success": true, "message": "OTP has been sent to your email." }`

- **POST** `/api/auth/verify-otp`
  - Body : `{ "otp": "123456" }`
  - Réponse : `{ "success": true, "token": "...", "user": {...} }`

- **GET** `/api/auth/me` (protégé)
  - Headers : `Authorization: Bearer {token}`
  - Réponse : `{ "user": {...} }`

- **POST** `/api/auth/logout` (protégé)
  - Headers : `Authorization: Bearer {token}`

### Logs (Admin uniquement)

- **GET** `/api/logs/actions` - Liste des logs d'actions
- **GET** `/api/logs/actions/statistics` - Statistiques des actions
- **GET** `/api/logs/actions/{entityType}/{entityId}` - Logs pour une entité spécifique
- **GET** `/api/logs/logins` - Liste des logs de connexion

## Middleware d'audit trail

Pour logger automatiquement les actions sur les leads :

```php
Route::put('/leads/{id}', [LeadController::class, 'update'])
    ->middleware(['auth:sanctum', 'log.lead.action']);
```

Le middleware `log.lead.action` enregistrera automatiquement :
- L'utilisateur qui a effectué l'action
- Le type d'action (create, update, delete)
- Les valeurs précédentes et nouvelles
- L'IP et le user agent
- La date et l'heure

## Sécurité

- ✅ OTP hashés avant stockage
- ✅ Expiration automatique (5 minutes)
- ✅ Rate limiting (5 demandes OTP / 15 min, 10 vérifications / 15 min)
- ✅ Logs complets de toutes les actions
- ✅ CORS configuré pour le frontend
- ✅ Sanctum pour l'authentification JWT

## Dépannage

### Erreur : "Class 'App\Models\Otp' not found"
```bash
composer dump-autoload
```

### Erreur : "SQLSTATE[HY000] [2002] Connection refused"
Vérifier que MySQL est démarré et que les credentials dans `.env` sont corrects.

### OTP non reçu
- Vérifier la configuration email dans `.env`
- Vérifier les logs Laravel : `storage/logs/laravel.log`
- En mode debug, l'OTP est retourné dans la réponse JSON

### CORS errors
Vérifier que `config/cors.php` contient l'URL du frontend dans `allowed_origins`.



