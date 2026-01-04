# Système d'Authentification OTP Complet - EuroShip

## ✅ Système Complet et Fonctionnel

### 📋 Résumé des Fonctionnalités

Le système d'authentification OTP est maintenant **complet et fonctionnel** pour les 6 comptes réels d'EuroShip.

## 🔧 Backend Laravel (europship-backend)

### ✅ Base de Données

**Tables créées et configurées :**

1. **`users`** :
   - `id`, `email` (unique), `role` (admin/agent), `status` (active/inactive), `timestamps`

2. **`otps`** :
   - `id`, `user_id` (foreign key), `code_hash` (hashé), `expires_at`, `timestamps`
   - Index sur `user_id` et `expires_at`

3. **`login_logs`** :
   - `id`, `user_id`, `role`, `otp_generated_at`, `otp_verified_at`, `success`, `ip_address`, `user_agent`, `timestamps`
   - Index sur `user_id` et `created_at`

4. **`action_logs`** :
   - `id`, `user_id`, `role`, `action_type`, `entity_type`, `entity_id`, `previous_value`, `new_value`, `ip_address`, `user_agent`, `timestamps`
   - Index sur `user_id`, `entity_type/entity_id`, et `action_type`

### ✅ Utilisateurs Seedés

Les 6 comptes réels sont dans le seeder :

```php
- houssamghazzouz@europship.com (agent)
- adib@europship.com (agent)
- yassinfallahi@europship.com (agent)
- rabimastour@europship.com (agent)
- admin@europship.com (admin)
- platform-admin@europship.com (admin)
```

**Commande pour seeder :**
```bash
cd europship-backend
php artisan db:seed --class=UserSeeder
```

### ✅ AuthController

**1. `loginOTP(Request $request)` :**
- ✅ Valide l'email (obligatoire)
- ✅ Vérifie que l'utilisateur existe et `status = active`
- ✅ Rate limiting : max 5 tentatives par utilisateur par 5 minutes
- ✅ Génère OTP à 6 chiffres (hashé avec bcrypt)
- ✅ Stocke OTP avec expiration 5 minutes
- ✅ Envoie OTP par email via Laravel Mailer
- ✅ Enregistre dans `login_logs`
- ✅ Retourne `{ success: true, message: "..." }`

**2. `verifyOTP(Request $request)` :**
- ✅ Valide email + OTP (obligatoires)
- ✅ Vérifie OTP hashé + expiration
- ✅ Marque OTP comme utilisé (suppression)
- ✅ Enregistre dans `login_logs` (succès/échec)
- ✅ Génère JWT avec payload `{sub: user_id, role, exp: +8h}`
- ✅ Retourne JWT + info utilisateur
- ✅ Retourne 401 si OTP invalide/expiré

**3. `me(Request $request)` :**
- ✅ Route protégée JWT
- ✅ Retourne info utilisateur actuel

**4. `logout(Request $request)` :**
- ✅ Route protégée JWT
- ✅ Déconnexion (JWT stateless)

### ✅ OTPService

- ✅ `generateAndStoreOTP(User $user)` : Génère OTP 6 chiffres, hash avec bcrypt, stocke avec expiration 5 min
- ✅ `sendOTP(User $user, $otp)` : Envoie OTP par email via Laravel Mailer
- ✅ `verifyOTP(User $user, $code)` : Vérifie OTP hashé + expiration, supprime OTP après utilisation

### ✅ Middleware

**1. `JWTAuth` :**
- ✅ Vérifie JWT dans `Authorization: Bearer ...`
- ✅ Décode JWT avec secret
- ✅ Charge utilisateur depuis DB et l'injecte dans `$request->user()`
- ✅ Retourne 401 si invalide/absent/expiré

**2. `RoleMiddleware` :**
- ✅ Restreint l'accès par rôle (admin/agent)
- ✅ Utilise le payload JWT pour vérifier le rôle

### ✅ Routes API

**Publiques :**
- `POST /api/auth/request-otp` → `AuthController@loginOTP`
- `POST /api/auth/verify-otp` → `AuthController@verifyOTP`

**Protégées (JWT) :**
- `GET /api/auth/me` → `AuthController@me`
- `POST /api/auth/logout` → `AuthController@logout`
- `POST /api/actions` → `ActionLogController@store`
- `GET /api/actions` → `ActionLogController@index`

### ✅ Sécurité

- ✅ OTP hashés avec bcrypt avant stockage
- ✅ Rate limiting : 5 tentatives par utilisateur par 5 minutes
- ✅ Expiration OTP : 5 minutes
- ✅ JWT avec secret dans `.env`
- ✅ Logs complets de toutes les actions
- ✅ Validation des entrées (email, OTP)
- ✅ Vérification du statut utilisateur (active/inactive)

## 🎨 Frontend React

### ✅ LoginPage

**Formulaire de connexion :**

1. **Étape 1 - Demande OTP :**
   - ✅ Input email **obligatoire** (pas de valeur par défaut)
   - ✅ Validation email côté client
   - ✅ Bouton "Send OTP Code"
   - ✅ Gestion des erreurs (403, 429, etc.)

2. **Étape 2 - Vérification OTP :**
   - ✅ Input OTP à 6 chiffres (composant InputOTP)
   - ✅ Affichage de l'email utilisé
   - ✅ Bouton "Verify & Sign In"
   - ✅ Bouton "Use different email" pour revenir
   - ✅ Gestion des erreurs (401, etc.)

### ✅ AuthContext

- ✅ `requestOtp(email: string)` : Appel API avec email
- ✅ `verifyOtp(otp: string, email: string)` : Appel API avec OTP + email
- ✅ `logout()` : Déconnexion
- ✅ Gestion de l'état utilisateur
- ✅ Vérification de session au chargement

### ✅ lib/auth.ts

- ✅ `requestOtp(email: string)` : POST `/api/auth/request-otp` avec `{ email }`
- ✅ `verifyOtp(otp: string, email: string)` : POST `/api/auth/verify-otp` avec `{ email, otp }`
- ✅ `getCurrentUser()` : GET `/api/auth/me` avec JWT
- ✅ `logout()` : POST `/api/auth/logout` avec JWT
- ✅ Stockage JWT dans `localStorage`

## 📝 Configuration Requise

### Backend (.env)

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=europship_db
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_genere

# Mail (pour envoyer OTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_app
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@europship.com"
MAIL_FROM_NAME="EuropShip"
```

### Frontend (.env.local)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🚀 Installation et Démarrage

### 1. Backend

```bash
cd europship-backend

# Installer les dépendances
composer install

# Configurer .env
cp .env.example .env
php artisan key:generate

# Configurer JWT_SECRET dans .env
# Générer un secret : php artisan jwt:secret (ou manuellement)

# Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE europship_db;
EXIT;

# Exécuter les migrations
php artisan migrate

# Seeder les utilisateurs
php artisan db:seed --class=UserSeeder

# Démarrer le serveur
php artisan serve
```

### 2. Frontend

```bash
# Créer .env.local avec VITE_API_BASE_URL
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🧪 Test du Système

1. **Ouvrir** `http://localhost:8080/login`
2. **Entrer** un email valide (ex: `admin@europship.com`)
3. **Cliquer** sur "Send OTP Code"
4. **Vérifier** l'email pour le code OTP
5. **Entrer** le code OTP (6 chiffres)
6. **Cliquer** sur "Verify & Sign In"
7. **Redirection** vers `/dashboard` selon le rôle

## 📊 Logs et Audit Trail

### Login Logs

Toutes les tentatives de connexion sont loguées dans `login_logs` :
- Email de l'utilisateur
- Rôle
- Date/heure de génération OTP
- Date/heure de vérification OTP
- Succès/échec
- IP address
- User agent

### Action Logs

Les actions importantes peuvent être loguées dans `action_logs` via le middleware `log.action` ou `log.lead.action`.

## 🔒 Sécurité Implémentée

- ✅ OTP hashés (bcrypt)
- ✅ Expiration automatique (5 minutes)
- ✅ Rate limiting (5 tentatives / 5 min)
- ✅ JWT sécurisé avec secret
- ✅ Validation des entrées
- ✅ Vérification du statut utilisateur
- ✅ Logs complets
- ✅ CORS configuré

## 📌 Notes Importantes

1. **Email obligatoire** : L'utilisateur doit saisir son email (pas de valeur par défaut)
2. **6 comptes réels** : Seulement les 6 comptes seedés peuvent se connecter
3. **OTP unique** : Chaque OTP est utilisé une seule fois puis supprimé
4. **JWT stateless** : Pas de session serveur, token JWT uniquement
5. **Logs complets** : Toutes les actions sont loguées pour audit

## ✅ Checklist de Validation

- [x] 6 comptes réels seedés
- [x] Tables de base de données créées
- [x] AuthController complet (loginOTP, verifyOTP, me, logout)
- [x] OTPService fonctionnel
- [x] Middleware JWT configuré
- [x] Routes API configurées
- [x] Frontend demande email (pas de valeur par défaut)
- [x] Frontend envoie email + OTP au backend
- [x] Gestion des erreurs (403, 401, 429)
- [x] Logs fonctionnels
- [x] Sécurité implémentée
- [x] Redirection selon rôle

## 🎯 Système Prêt pour Production

Le système est maintenant **complet et fonctionnel** pour les 6 comptes réels d'EuroShip. Tous les composants sont en place et testés.



