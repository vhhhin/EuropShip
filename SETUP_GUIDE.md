# Guide de Configuration - EuropShip OTP Authentication

Ce guide vous aidera à configurer le système d'authentification OTP avec audit trail pour EuropShip.

## 📋 Vue d'ensemble

Le système comprend :
- **Backend Laravel** : API REST avec authentification OTP par email
- **Frontend React** : Interface utilisateur avec formulaire OTP
- **Base de données** : MySQL avec tables pour users, OTPs, et logs
- **Audit Trail** : Logs complets de toutes les actions

## 🚀 Installation Rapide

### Étape 1 : Backend Laravel

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances PHP
composer install

# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé d'application
php artisan key:generate
```

### Étape 2 : Configuration Base de Données

1. Créer une base de données MySQL :
```sql
CREATE DATABASE europship;
```

2. Configurer `.env` dans `backend/` :
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=europship
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe
```

3. Exécuter les migrations :
```bash
php artisan migrate
```

### Étape 3 : Configuration Email

Configurer l'envoi d'emails dans `backend/.env` :

**Pour Gmail :**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_app
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@europship.com"
MAIL_FROM_NAME="EuropShip"
```

**Pour Mailtrap (tests) :**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=votre_username
MAIL_PASSWORD=votre_password
MAIL_ENCRYPTION=null
```

### Étape 4 : Démarrer le Backend

```bash
php artisan serve
```

Le backend sera accessible sur `http://localhost:8000`

### Étape 5 : Configuration Frontend

1. Créer un fichier `.env.local` à la racine du projet :
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

2. Installer les dépendances (si pas déjà fait) :
```bash
npm install
```

3. Démarrer le frontend :
```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:8080`

## 🧪 Test du Système

### Test avec l'email unique

1. Ouvrir `http://localhost:8080/login`
2. Cliquer sur "Send OTP Code"
3. Vérifier l'email (ou la console en mode debug)
4. Entrer le code OTP à 6 chiffres
5. Se connecter

**Note** : En mode debug (`APP_DEBUG=true`), l'OTP est retourné dans la réponse JSON pour faciliter les tests.

### Vérifier les logs

Les logs sont automatiquement créés dans la base de données :

```sql
-- Voir les logs de connexion
SELECT * FROM login_logs ORDER BY created_at DESC LIMIT 10;

-- Voir les logs d'actions
SELECT * FROM action_logs ORDER BY created_at DESC LIMIT 10;
```

## 📧 Passage aux 6 Emails Réels

### Option 1 : Ajouter les utilisateurs manuellement

```sql
INSERT INTO users (email, role, status, created_at, updated_at) VALUES
('admin1@europship.com', 'admin', 'active', NOW(), NOW()),
('agent1@europship.com', 'agent', 'active', NOW(), NOW()),
('agent2@europship.com', 'agent', 'active', NOW(), NOW()),
('agent3@europship.com', 'agent', 'active', NOW(), NOW()),
('agent4@europship.com', 'agent', 'active', NOW(), NOW()),
('agent5@europship.com', 'agent', 'active', NOW(), NOW());
```

### Option 2 : Modifier AuthController

Modifier `backend/app/Http/Controllers/AuthController.php` pour identifier l'utilisateur par email ou autre identifiant.

**Exemple : Identifier par email dans la requête**
```php
public function requestOtp(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:users,email',
    ]);
    
    $email = $request->email;
    $user = User::where('email', $email)->first();
    // ... reste du code
}
```

Puis modifier le frontend pour envoyer l'email dans la requête.

## 🔒 Sécurité

- ✅ OTP hashés avec bcrypt
- ✅ Expiration automatique (5 minutes)
- ✅ Rate limiting (5 demandes / 15 min, 10 vérifications / 15 min)
- ✅ Logs complets de toutes les actions
- ✅ CORS configuré
- ✅ Sanctum pour JWT

## 📊 Audit Trail

### Logs automatiques

Le système enregistre automatiquement :
- **Login logs** : Toutes les tentatives de connexion (succès/échec)
- **Action logs** : Toutes les modifications importantes (changement de statut, création, etc.)

### Utiliser le middleware

Pour logger automatiquement les actions sur les leads :

```php
Route::put('/leads/{id}', [LeadController::class, 'update'])
    ->middleware(['auth:sanctum', 'log.lead.action']);
```

### Consulter les logs via API

```bash
# Liste des logs d'actions (admin uniquement)
GET /api/logs/actions

# Statistiques (admin uniquement)
GET /api/logs/actions/statistics

# Logs de connexion (admin uniquement)
GET /api/logs/logins
```

## 🐛 Dépannage

### Erreur : "Class not found"
```bash
composer dump-autoload
```

### Erreur : "Connection refused" (MySQL)
- Vérifier que MySQL est démarré
- Vérifier les credentials dans `.env`

### OTP non reçu
- Vérifier la configuration email
- Vérifier les logs : `backend/storage/logs/laravel.log`
- En mode debug, l'OTP est dans la réponse JSON

### CORS errors
- Vérifier `backend/config/cors.php`
- Ajouter l'URL du frontend dans `allowed_origins`

### Frontend ne se connecte pas au backend
- Vérifier que `VITE_API_BASE_URL` est défini dans `.env.local`
- Redémarrer le serveur de développement : `npm run dev`

## 📝 Structure des Fichiers

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── ActionLogController.php
│   │   │   └── LoginLogController.php
│   │   └── Middleware/
│   │       ├── LogAction.php
│   │       └── LogLeadAction.php
│   └── Models/
│       ├── User.php
│       ├── Otp.php
│       ├── LoginLog.php
│       └── ActionLog.php
├── database/
│   └── migrations/
│       ├── 2025_01_01_000001_create_users_table.php
│       ├── 2025_01_01_000002_create_otps_table.php
│       ├── 2025_01_01_000003_create_login_logs_table.php
│       └── 2025_01_01_000004_create_action_logs_table.php
└── routes/
    └── api.php

src/
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── auth.ts
└── pages/
    └── LoginPage.tsx
```

## ✅ Checklist de Déploiement

- [ ] Backend installé et configuré
- [ ] Base de données créée et migrations exécutées
- [ ] Configuration email fonctionnelle
- [ ] Frontend configuré avec `VITE_API_BASE_URL`
- [ ] Test de connexion OTP réussi
- [ ] Logs vérifiés dans la base de données
- [ ] Rate limiting testé
- [ ] CORS configuré correctement
- [ ] Passage aux 6 emails réels (si applicable)

## 📞 Support

Pour toute question ou problème, consulter :
- `backend/README.md` : Documentation détaillée du backend
- `README_BACKEND.md` : Guide de configuration complet



