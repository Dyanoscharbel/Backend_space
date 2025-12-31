# 🔐 Système d'Authentification Admin - Guide d'Utilisation

## 📋 Vue d'ensemble

Le backend dispose maintenant d'un **système d'authentification admin complet** avec JWT et synchronisation incrémentale intelligente.

## 🚀 Fonctionnalités

### 1. Authentification JWT
- Login admin avec token JWT
- Expiration token : 7 jours
- Protection des routes sensibles
- Gestion du changement de mot de passe

### 2. Synchronisation Incrémentale
- **Reprise automatique** là où la dernière synchronisation s'est arrêtée
- Détection des KOI déjà traités
- Mode full sync disponible
- Logs détaillés dans `sync_logs`

## 📦 Installation

### 1. Installer les nouvelles dépendances

```bash
cd Backend_space
pnpm install
# Installe: jsonwebtoken, bcrypt
```

### 2. Configurer les variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# JWT Secret (minimum 32 caractères)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
```

**⚠️ IMPORTANT** : Changez ce secret en production !

### 3. Démarrer le serveur

```bash
pnpm dev
```

Au premier démarrage, un **admin par défaut** est créé automatiquement :
```
Username: admin
Password: admin123
```

**🔴 CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT EN PRODUCTION !**

## 🔑 Endpoints d'Authentification

### 1. Login Admin

**POST** `/api/auth/login`

```json
// Request
{
  "username": "admin",
  "password": "admin123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "username": "admin",
      "email": "admin@exoscope.com",
      "role": "admin",
      "lastLogin": "2025-12-28T10:30:00.000Z"
    }
  }
}
```

### 2. Vérifier le Token

**GET** `/api/auth/verify`

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/auth/verify
```

### 3. Changer le Mot de Passe

**POST** `/api/auth/change-password`

```json
// Request
{
  "oldPassword": "admin123",
  "newPassword": "NewSecurePassword123!"
}

// Headers
Authorization: Bearer YOUR_TOKEN
```

### 4. Créer un Nouvel Admin

**POST** `/api/auth/create-admin`

```json
// Request
{
  "username": "admin2",
  "password": "SecurePassword123!",
  "email": "admin2@exoscope.com"
}

// Headers
Authorization: Bearer YOUR_TOKEN
```

## 🔄 Synchronisation avec Authentification

### Routes Protégées

Toutes les routes de synchronisation nécessitent maintenant l'authentification admin :

- `POST /api/sync/run` - Lancer une synchronisation
- `POST /api/sync/scheduler/start` - Démarrer le scheduler
- `POST /api/sync/scheduler/stop` - Arrêter le scheduler
- `POST /api/sync/scheduler/restart` - Redémarrer le scheduler
- `POST /api/sync/scheduler/configure` - Configurer le cron

### 1. Synchronisation Incrémentale (par défaut)

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Récupérer le token de la réponse
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Lancer la synchronisation incrémentale
curl -X POST http://localhost:3001/api/sync/run \
  -H "Authorization: Bearer $TOKEN"
```

**Comportement :**
- ✅ Vérifie la dernière synchronisation dans `sync_logs`
- ✅ Si récente (<24h) et incomplète, **reprend où elle s'est arrêtée**
- ✅ Ignore les KOI déjà traités
- ✅ Continue avec les KOI restants

**Logs console :**
```
🚀 Manual synchronization triggered by admin: admin
🔄 Incremental synchronization mode (will resume if needed)
🌌 === STARTING SYNCHRONIZATION ===
🔄 MODE: INCREMENTAL (will resume if needed)
📋 Last successful sync: 2025-12-28T08:00:00.000Z
   - Total processed: 10137
   - New KOIs: 281
🔄 RESUME MODE ACTIVATED - Continuing from last interrupted sync
   - Last sync started: 2025-12-28T08:00:00.000Z
   - Already processed: 156/281 KOIs
   - Remaining: 125 KOIs
🆕 281 new KOIs detected
⏭️  Skipping 156 KOIs already processed in last sync
📋 125 KOIs remaining to process
```

### 2. Synchronisation Complète (Full Sync)

```bash
# Force une synchronisation complète (ignore l'incrémental)
curl -X POST "http://localhost:3001/api/sync/run?full=true" \
  -H "Authorization: Bearer $TOKEN"
```

**Comportement :**
- 🔄 Force le traitement de TOUS les nouveaux KOI
- 🔄 Ne vérifie PAS les KOI déjà traités
- 🔄 Utile pour resynchroniser après des modifications

**Logs console :**
```
🔄 Full synchronization mode requested
🔄 FULL SYNC MODE - Forcing complete synchronization
🌌 === STARTING SYNCHRONIZATION ===
🔄 MODE: FULL SYNC
🆕 281 new KOIs detected
📋 281 KOIs to process
```

## 📊 Statistiques de Synchronisation

Les stats incluent maintenant les informations de reprise :

```json
{
  "success": true,
  "data": {
    "startTime": "2025-12-28T10:30:00.000Z",
    "resumeMode": true,
    "lastSyncReference": "2025-12-28T08:00:00.000Z",
    "totalFromNASA": 10137,
    "newKOIs": 281,
    "skippedFromLastSync": 156,
    "confirmed": 67,
    "falsePositive": 42,
    "candidates": 125,
    "candidatesSent": 118,
    "candidatesClassifiedByAI": 118,
    "candidatesSavedAsFalsePositive": 54,
    "candidatesSavedAsConfirmed": 64,
    "errors": 7,
    "duration": 245600
  }
}
```

**Champs importants :**
- `resumeMode`: `true` si reprise depuis dernière sync
- `lastSyncReference`: Date de référence de la dernière sync
- `skippedFromLastSync`: Nombre de KOI déjà traités (ignorés)

## 🗄️ Base de Données

### Collection `admin_users`

```javascript
{
  _id: ObjectId("..."),
  username: "admin",
  password: "$2b$10$hashed_password",
  role: "admin",
  email: "admin@exoscope.com",
  createdAt: ISODate("2025-12-28T10:00:00.000Z"),
  lastLogin: ISODate("2025-12-28T10:30:00.000Z")
}
```

### Collection `sync_logs` (modifiée)

```javascript
{
  _id: ObjectId("..."),
  startTime: ISODate("2025-12-28T10:30:00.000Z"),
  resumeMode: true,                    // NOUVEAU
  lastSyncReference: ISODate("..."),   // NOUVEAU
  skippedFromLastSync: 156,            // NOUVEAU
  totalFromNASA: 10137,
  newKOIs: 281,
  confirmed: 67,
  // ... autres stats
  success: true,
  duration: 245600,
  createdAt: ISODate("2025-12-28T10:34:05.600Z")
}
```

### Collection `koi_objects`

Chaque KOI sauvegardé a maintenant `sync_date` qui permet de tracer quand il a été traité :

```javascript
{
  kepoi_name: "K00789.01",
  koi_disposition: "CONFIRMED",
  kepler_name: "Kepler-1845 b",
  // ... 90+ colonnes NASA
  IS_AI: true,
  confidence_score: 0.9456,
  ai_prediction: { ... },
  sync_source: "nasa_tap",
  sync_date: ISODate("2025-12-28T10:32:15.789Z"),  // Utilisé pour reprise
  sync_version: "1.0"
}
```

## 🔐 Sécurité

### Headers Requis

Toutes les routes protégées nécessitent le header :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Codes d'Erreur

- `401 Unauthorized` : Token manquant, invalide ou expiré
- `403 Forbidden` : Token valide mais rôle insuffisant
- `409 Conflict` : Synchronisation déjà en cours

### Exemples d'Erreurs

```json
// Token manquant
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please login as admin."
}

// Token expiré
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token expired. Please login again."
}

// Sync déjà en cours
{
  "success": false,
  "error": "Conflict",
  "message": "A synchronization is already in progress"
}
```

## 🧪 Tests

### Test Complet du Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Vérifier le token
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/auth/verify

# 3. Vérifier le statut de sync
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/sync/status

# 4. Lancer une synchronisation incrémentale
curl -X POST http://localhost:3001/api/sync/run \
  -H "Authorization: Bearer $TOKEN"

# 5. Lancer une synchronisation complète
curl -X POST "http://localhost:3001/api/sync/run?full=true" \
  -H "Authorization: Bearer $TOKEN"

# 6. Changer le mot de passe
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "NewSecurePassword123!"
  }'
```

## 📝 Utilisation Frontend

### Exemple React/Next.js

```typescript
// services/authService.ts
export class AuthService {
  private static token: string | null = null;

  static async login(username: string, password: string) {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('admin_token', this.token);
      return data.data.user;
    }
    
    throw new Error(data.message);
  }

  static async runSync(fullSync = false) {
    const token = this.token || localStorage.getItem('admin_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `http://localhost:3001/api/sync/run${fullSync ? '?full=true' : ''}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  }

  static logout() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }
}
```

### Composant Login

```tsx
// components/AdminLogin.tsx
'use client';

import { useState } from 'react';
import { AuthService } from '@/services/authService';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await AuthService.login(username, password);
      console.log('Logged in as:', user.username);
      // Rediriger vers dashboard admin
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Composant Sync

```tsx
// components/AdminSyncControl.tsx
'use client';

import { useState } from 'react';
import { AuthService } from '@/services/authService';

export function AdminSyncControl() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async (fullSync = false) => {
    setSyncing(true);
    setResult(null);

    try {
      const data = await AuthService.runSync(fullSync);
      setResult(data.data);
      console.log('Sync completed:', data);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Synchronization failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <h2>Synchronisation NASA</h2>
      
      <div className="buttons">
        <button 
          onClick={() => handleSync(false)} 
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Incrémentale'}
        </button>
        
        <button 
          onClick={() => handleSync(true)} 
          disabled={syncing}
          className="danger"
        >
          Sync Complète (Full)
        </button>
      </div>

      {result && (
        <div className="result">
          <h3>Résultats</h3>
          {result.resumeMode && (
            <p className="info">
              🔄 Mode reprise activé - {result.skippedFromLastSync} KOI ignorés
            </p>
          )}
          <ul>
            <li>Total NASA: {result.totalFromNASA}</li>
            <li>Nouveaux: {result.newKOIs}</li>
            <li>Confirmés: {result.confirmed}</li>
            <li>Faux positifs: {result.falsePositive}</li>
            <li>Candidats: {result.candidates}</li>
            <li>Durée: {(result.duration / 1000).toFixed(2)}s</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 🛡️ Bonnes Pratiques

### 1. Sécurité JWT

```env
# Générer un secret fort (32+ caractères)
JWT_SECRET=$(openssl rand -base64 32)
```

### 2. HTTPS en Production

```javascript
// server.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 3. Rate Limiting

```bash
pnpm install express-rate-limit
```

```javascript
// server.js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
```

### 4. Logs d'Audit

Tous les événements importants sont loggés :
- ✅ Tentatives de login (succès/échec)
- ✅ Changements de mot de passe
- ✅ Lancements de synchronisation
- ✅ Démarrages/arrêts du scheduler

## 🚨 Dépannage

### Erreur "Invalid token"

```bash
# Vérifier la variable JWT_SECRET dans .env
echo $JWT_SECRET

# Relancer le serveur après modification
pnpm dev
```

### Synchronisation ne reprend pas

```bash
# Vérifier les logs de la dernière sync
curl http://localhost:3001/api/sync/status

# Forcer une full sync si nécessaire
curl -X POST "http://localhost:3001/api/sync/run?full=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Admin par défaut ne fonctionne pas

```bash
# Vérifier que l'admin existe dans MongoDB
mongosh kepler_database
> db.admin_users.find()

# Recréer l'admin si nécessaire
> db.admin_users.deleteMany({})
# Redémarrer le serveur pour recréer l'admin
```

## 📚 Ressources

- JWT : https://jwt.io/
- bcrypt : https://github.com/kelektiv/node.bcrypt.js
- MongoDB Security : https://www.mongodb.com/docs/manual/security/

## 🎉 Résumé

Votre backend dispose maintenant de :

✅ **Authentification JWT complète**
✅ **Protection des routes sensibles**
✅ **Synchronisation incrémentale intelligente**
✅ **Reprise automatique après interruption**
✅ **Admin par défaut créé automatiquement**
✅ **Logs détaillés de toutes les opérations**
✅ **Mode full sync optionnel**

**Prochaines étapes suggérées :**
1. Changer le mot de passe admin par défaut
2. Créer l'interface frontend pour l'admin
3. Ajouter rate limiting pour la sécurité
4. Configurer HTTPS en production
5. Mettre en place des alertes de monitoring
