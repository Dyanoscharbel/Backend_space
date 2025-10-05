# 🔗 Test Guide: Chatbot avec Liens NASA

## 🚀 Exemples de questions et liens attendus

### 1. Questions sur Kepler
**Question :** `"Tell me about the Kepler mission"`
**Liens attendus :**
- NASA Kepler Mission
- Kepler Discoveries

### 2. Questions sur la zone habitable
**Question :** `"What is the habitable zone?"`
**Liens attendus :**
- Habitable Zone (NASA)

### 3. Questions sur les méthodes de détection
**Question :** `"How do we discover exoplanets?"`
**Liens attendus :**
- Exoplanet Detection Methods

### 4. Questions sur TESS
**Question :** `"What is TESS?"`
**Liens attendus :**
- TESS Mission

### 5. Questions sur JWST/atmosphères
**Question :** `"How does James Webb study exoplanet atmospheres?"`
**Liens attendus :**
- James Webb Exoplanet Science

### 6. Questions sur les données
**Question :** `"Where can I find exoplanet data?"`
**Liens attendus :**
- NASA Exoplanet Archive

### 7. Questions sur la vie
**Question :** `"How do we search for life on exoplanets?"`
**Liens attendus :**
- Search for Life

### 8. Questions générales
**Question :** `"What are exoplanets?"`
**Liens attendus :**
- NASA Exoplanet Exploration

## 📋 Test Postman pour les liens

### Endpoint: POST `/api/chat/send`

```json
{
    "message": "Tell me about the Kepler mission and how it discovers exoplanets"
}
```

### Réponse attendue :
```json
{
    "success": true,
    "data": {
        "userMessage": "Tell me about the Kepler mission and how it discovers exoplanets",
        "botResponse": "The Kepler mission... [response text with links at the end]\n\n🔗 **Explore Further:**\n• [NASA Kepler Mission](https://www.nasa.gov/mission_pages/kepler/main/index.html) - Official NASA Kepler mission page\n• [Kepler Discoveries](https://exoplanets.nasa.gov/discovery/kepler-discoveries/) - Overview of Kepler's exoplanet discoveries\n• [Exoplanet Detection Methods](https://exoplanets.nasa.gov/alien-worlds/ways-to-find-a-planet/) - How we discover exoplanets",
        "timestamp": "2025-10-05T...",
        "model": "gemini-1.5-flash",
        "hasExoplanetData": true,
        "links": [
            {
                "title": "NASA Kepler Mission",
                "url": "https://www.nasa.gov/mission_pages/kepler/main/index.html",
                "description": "Official NASA Kepler mission page"
            },
            {
                "title": "Kepler Discoveries", 
                "url": "https://exoplanets.nasa.gov/discovery/kepler-discoveries/",
                "description": "Overview of Kepler's exoplanet discoveries"
            },
            {
                "title": "Exoplanet Detection Methods",
                "url": "https://exoplanets.nasa.gov/alien-worlds/ways-to-find-a-planet/",
                "description": "How we discover exoplanets"
            }
        ]
    }
}
```

## 🔍 Vérifications importantes

1. **Format des liens dans le message :**
   - Section "🔗 **Explore Further:**"
   - Format markdown : `[Title](URL) - Description`

2. **Propriété `links` dans la réponse :**
   - Array d'objets avec `title`, `url`, `description`
   - Maximum 3 liens par réponse

3. **Liens contextuels :**
   - Les liens changent selon le sujet de la question
   - Toujours au moins un lien général si aucun lien spécifique

4. **Liens de fallback :**
   - En cas d'erreur, inclut des liens vers NASA Exoplanet Exploration et Kepler Mission

## 🧪 Tests recommandés

1. **Test spécifique Kepler :** `"Tell me about Kepler-442b"`
2. **Test zone habitable :** `"What makes a planet habitable?"`
3. **Test méthodes :** `"How do we detect exoplanets?"`
4. **Test JWST :** `"How does Webb study atmospheres?"`
5. **Test données :** `"Where can I find exoplanet catalogs?"`
6. **Test vie :** `"How do we search for biosignatures?"`
7. **Test erreur :** Message vide pour tester les liens de fallback