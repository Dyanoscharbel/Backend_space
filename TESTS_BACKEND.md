# Tests du Backend - Validation des Patterns

## 🎯 Objectif
S'assurer que la recherche d'exoplanètes ne matche QUE le système demandé, pas les systèmes avec des numéros similaires.

## ✅ Cas de Test

### Test 1: Kepler-11
**Requête:** `/api/exoplanets/system/Kepler-11`

**Doit matcher:**
- ✅ Kepler-11 b
- ✅ Kepler-11 c
- ✅ Kepler-11 d
- ✅ Kepler-11 e

**Ne doit PAS matcher:**
- ❌ Kepler-111 b
- ❌ Kepler-1111 c
- ❌ Kepler-110 d
- ❌ Kepler-112 e

### Test 2: Kepler-442
**Requête:** `/api/exoplanets/system/Kepler-442`

**Doit matcher:**
- ✅ Kepler-442 b
- ✅ Kepler-442 c

**Ne doit PAS matcher:**
- ❌ Kepler-4422 b
- ❌ Kepler-44 b
- ❌ Kepler-4 b

### Test 3: Kepler-7
**Requête:** `/api/exoplanets/system/Kepler-7`

**Doit matcher:**
- ✅ Kepler-7 b
- ✅ Kepler-7 c

**Ne doit PAS matcher:**
- ❌ Kepler-70 b
- ❌ Kepler-77 c
- ❌ Kepler-700 d

## 🔧 Solution Implémentée

### Regex Pattern
```javascript
kepler_name: { $regex: `^${keplerName}[\\s]`, $options: 'i' }
```

### Explication
- `^` : Début de chaîne
- `${keplerName}` : Le nom exact du système (ex: "Kepler-11")
- `[\\s]` : UN espace obligatoire après le numéro
- `$options: 'i'` : Insensible à la casse

### Exemples de Matching
- `^Kepler-11[\s]` matchera "Kepler-11 b" ✅
- `^Kepler-11[\s]` ne matchera PAS "Kepler-111 b" ❌

## 📝 Format des Noms d'Exoplanètes

Les noms d'exoplanètes dans la base MongoDB suivent le format:
```
Kepler-<numéro><espace><lettre>
```

Exemples:
- Kepler-11 b
- Kepler-442 c
- Kepler-186 f

## 🧪 Tests Manuels

### PowerShell (Windows)
```powershell
# Test Kepler-11
Invoke-RestMethod -Uri "http://localhost:3001/api/exoplanets/system/Kepler-11" | ConvertTo-Json -Depth 10

# Test Kepler-442
Invoke-RestMethod -Uri "http://localhost:3001/api/exoplanets/system/Kepler-442" | ConvertTo-Json -Depth 10
```

### cURL (Linux/Mac)
```bash
# Test Kepler-11
curl "http://localhost:3001/api/exoplanets/system/Kepler-11" | jq

# Test Kepler-442
curl "http://localhost:3001/api/exoplanets/system/Kepler-442" | jq
```

### Browser
```
http://localhost:3001/api/exoplanets/system/Kepler-11
http://localhost:3001/api/exoplanets/system/Kepler-442
```

## ✅ Validation

Pour valider que le backend fonctionne correctement:

1. **Lancer le serveur backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Tester avec un système connu**
   ```
   GET http://localhost:3001/api/exoplanets/system/Kepler-11
   ```

3. **Vérifier la réponse**
   - Le champ `totalPlanets` doit correspondre UNIQUEMENT aux planètes de Kepler-11
   - Aucune planète de Kepler-111, Kepler-110, etc. ne doit apparaître

4. **Vérifier les noms**
   - Tous les `name` dans `exoplanets[]` doivent commencer par "Kepler-11 " (avec espace)

## 🐛 Problèmes Potentiels

### Si la regex ne fonctionne pas:
Vérifier le format des données dans MongoDB:
```javascript
db.koi_objects.findOne({ kepler_name: /^Kepler-11/ })
```

### Si aucune donnée n'est retournée:
- Vérifier que la collection s'appelle bien `koi_objects`
- Vérifier que le champ `koi_disposition` contient "CONFIRMED"
- Vérifier la connexion à MongoDB

## 📊 Résultat Attendu

```json
{
  "success": true,
  "data": {
    "systemName": "Kepler-11",
    "exoplanets": [
      {
        "name": "Kepler-11 b",
        "radius": 1.8,
        "temperature": 878,
        "distance": 0.091,
        "classification": "arid",
        ...
      },
      {
        "name": "Kepler-11 c",
        ...
      }
    ],
    "star": {
      "name": "Kepler 11",
      "mass": 0.95,
      "radius": 1.1,
      ...
    },
    "totalPlanets": 6
  }
}
```

## ✨ Conclusion

Le backend est maintenant configuré pour matcher EXACTEMENT le système demandé, sans risque de confusion avec des systèmes aux numéros similaires.