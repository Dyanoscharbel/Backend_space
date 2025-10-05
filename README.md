# 🌌 Space Exoplanets Backend API

A comprehensive Node.js/Express backend API for managing exoplanet data from NASA's Kepler mission with MongoDB integration, AI-powered classification, and automated synchronization.

## 🚀 Features

- **NASA TAP API Integration**: Automatic synchronization with NASA's Exoplanet Archive
- **AI Classification**: Machine Learning inference for exoplanet candidate validation
- **MongoDB Storage**: Complete KOI (Kepler Objects of Interest) data management
- **Automated Scheduling**: Cron-based weekly synchronization
- **Planet Classification**: Automatic categorization into terrestrial, gas giant, extreme worlds, etc.
- **Kepler Naming**: Automatic generation of Kepler names for confirmed exoplanets
- **AI Chatbot**: Gemini-powered conversational AI for space and exoplanet questions
- **RESTful API**: Comprehensive endpoints for data retrieval and system management

## 📋 Table of Contents

- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
  - [Exoplanets Routes](#exoplanets-routes)
  - [Synchronization Routes](#synchronization-routes)
- [Services](#-services)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Usage Examples](#-usage-examples)
- [Development](#-development)

## 🛠 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Add your Gemini API key** (required for chatbot functionality)
```env
GEMINI_API_KEY=your_actual_api_key_here
```
Get your key from: https://makersuite.google.com/app/apikey

5. **Test the chatbot**
```bash
npm run test:chatbot
```

6. **Start the server**
```bash
# Easy setup (Windows)
npm run setup

# Or manually:
# Development mode
npm run dev

# Production mode
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/kepler_exoplanets
DB_NAME=kepler_exoplanets

# AI Inference API
BACKEND_INFER_URL=http://localhost:5000/api/infer

# Gemini AI Chatbot
GEMINI_API_KEY=your_gemini_api_key_here

# Scheduler Configuration
AUTO_START_SYNC=false

# CORS Origins (comma separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📡 API Endpoints

### Base URL: `http://localhost:3001`

### Exoplanets Routes

#### `GET /api/exoplanets/system/:keplerName`
**Description**: Retrieve a complete planetary system by Kepler name

**Parameters**:
- `keplerName` (path): Name of the Kepler system (e.g., "Kepler-442")

**Response**:
```json
{
  "success": true,
  "system": {
    "systemName": "Kepler-442",
    "starInfo": {
      "effectiveTemperature": 4402,
      "stellarRadius": 0.61,
      "stellarMass": 0.60
    },
    "exoplanets": [
      {
        "keplerName": "Kepler-442 b",
        "classification": {
          "type": "terrestrial",
          "habitabilityScore": 0.85
        },
        "orbitalPeriod": 112.3,
        "planetRadius": 1.34,
        "equilibriumTemperature": 233
      }
    ],
    "totalPlanets": 2
  }
}
```

#### `GET /api/exoplanets/search`
**Description**: Search for Kepler planetary systems by name

**Query Parameters**:
- `q` (string): Search term (Kepler system name, e.g., "Kepler-442")
- `limit` (number): Maximum number of systems to return (default: 50, max: 100)

**Example**:
```
GET /api/exoplanets/search?q=Kepler-442&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "systems": [
      {
        "systemName": "Kepler-442",
        "planetCount": 2,
        "sampleData": {
          "starMass": 0.61,
          "starRadius": 0.60
        }
      }
    ],
    "totalFound": 1,
    "searchTerm": "Kepler-442",
    "limit": 10
  },
  "timestamp": "2025-10-05T14:30:00.000Z"
}
```

#### `GET /api/exoplanets/all`
**Description**: Get all exoplanets with complete data and automatic classification

**Query Parameters**:
- `limit` (number): Results per page (default: 100, max: 1000)
- `skip` (number): Number of results to skip for pagination (default: 0)
- `status` (string): Filter by disposition (optional: 'CONFIRMED', 'CANDIDATE', 'FALSE POSITIVE')

**Response**: Returns detailed exoplanet data including all NASA KOI fields plus automatic classification:
```json
{
  "success": true,
  "data": {
    "exoplanets": [
      {
        // All original NASA KOI data (127+ fields)
        "kepoi_name": "K00042.01",
        "kepler_name": "Kepler-11 b",
        "koi_disposition": "CONFIRMED",
        "koi_period": 10.3039,
        "koi_prad": 1.97,
        "koi_teq": 1473,
        "koi_steff": 5680,
        "koi_smass": 0.95,
        "koi_srad": 1.065,
        
        // AI Classification (if processed by AI)
        "IS_AI": true,
        "ai_prediction": "CONFIRMED",
        "ai_confidence": 0.96,
        
        // Automatic Planet Classification
        "classification": {
          "type": "hot_super_earth",
          "score": 0.89,
          "habitabilityScore": 0.12
        },
        "planetType": "hot_super_earth",
        "texture": "volcanic",
        "description": "A super-Earth with extreme temperatures",
        "confidence": 0.89,
        
        // Calculated fields
        "systemName": "Kepler-11",
        
        // Metadata
        "sync_source": "nasa_tap",
        "sync_date": "2025-10-05T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 9564,
      "limit": 100,
      "skip": 0,
      "hasMore": true
    },
    "stats": {
      "confirmed": 2456,
      "candidates": 4789,
      "falsePositives": 2319,
      "total": 9564
    }
  }
}

#### `GET /api/exoplanets/classifications`
**Description**: Get available planet classification types

**Response**:
```json
{
  "success": true,
  "classifications": [
    {
      "type": "terrestrial",
      "description": "Rocky planets similar to Earth",
      "emoji": "🌍"
    },
    {
      "type": "gas_giant",
      "description": "Large gaseous planets",
      "emoji": "⛽"
    }
  ]
}
```

#### `GET /api/exoplanets/health`
**Description**: Health check for exoplanets service

### Chat Routes

#### `POST /api/chat/send`
**Description**: Send a message to the AI chatbot and get a response about space and exoplanets

**Request Body**:
```json
{
  "message": "What are exoplanets?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant", 
      "content": "Hi! I'm here to help you learn about space and exoplanets! 🚀"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userMessage": "What are exoplanets?",
    "botResponse": "Exoplanets are planets that orbit stars outside our solar system! 🪐 Since the first confirmed discovery in 1995, we've found thousands of these fascinating worlds using missions like Kepler...",
    "timestamp": "2025-10-05T14:30:00.000Z",
    "model": "gemini-1.5-flash",
    "hasExoplanetData": true
  }
}
```

#### `GET /api/chat/suggestions`
**Description**: Get suggested questions to ask the chatbot

**Response**:
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "What are exoplanets and how are they discovered? 🔭",
      "Tell me about the Kepler space telescope mission 🚀",
      "What makes a planet potentially habitable? 🌍",
      "Tell me about Kepler-442 system"
    ],
    "count": 10
  }
}
```

#### `POST /api/chat/conversation`
**Description**: Manage a full conversation with context

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-10-05T14:00:00.000Z"
    }
  ],
  "newMessage": "What's the most interesting exoplanet?"
}
```

#### `GET /api/chat/health`
**Description**: Health check for chatbot service

### Synchronization Routes

#### `GET /api/sync/status`
**Description**: Get comprehensive synchronization system status

**Response**:
```json
{
  "success": true,
  "status": {
    "system": {
      "operational": true,
      "lastCheck": "2025-10-05T14:30:00Z"
    },
    "database": {
      "connected": true,
      "totalKOIs": 9564,
      "confirmedExoplanets": 2456,
      "candidates": 4789,
      "falsePositives": 2319
    },
    "scheduler": {
      "isActive": true,
      "isRunning": false,
      "lastRun": "2025-09-29T02:00:00Z",
      "nextRun": "2025-10-06T02:00:00Z",
      "timezone": "Europe/Paris"
    },
    "nasa": {
      "apiAccessible": true,
      "lastSync": "2025-10-05T13:00:00Z"
    },
    "ai": {
      "available": true,
      "inferenceUrl": "http://localhost:5000/api/infer"
    }
  }
}
```

#### `POST /api/sync/run`
**Description**: Manually trigger immediate synchronization

**Response**:
```json
{
  "success": true,
  "message": "Synchronization completed successfully",
  "stats": {
    "duration": 45230,
    "total": 15,
    "confirmed": 8,
    "falsePositives": 4,
    "candidates": 3,
    "candidatesSent": 12,
    "candidatesClassifiedByAI": 10
  }
}
```

#### `POST /api/sync/scheduler/start`
**Description**: Start automatic weekly synchronization (every Sunday at 2:00 AM)

#### `POST /api/sync/scheduler/stop`
**Description**: Stop automatic synchronization

#### `POST /api/sync/scheduler/restart`
**Description**: Restart synchronization scheduler

#### `POST /api/sync/scheduler/configure`
**Description**: Configure custom synchronization schedule

**Request Body**:
```json
{
  "cronPattern": "0 2 * * 0",
  "timezone": "Europe/Paris"
}
```

#### `GET /api/sync/logs`
**Description**: Retrieve synchronization logs

**Query Parameters**:
- `limit` (number): Number of logs to retrieve (default: 50)
- `startDate` (string): Start date filter (ISO format)
- `endDate` (string): End date filter (ISO format)

#### `GET /api/sync/stats`
**Description**: Get synchronization statistics

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalSyncs": 168,
    "successful": 165,
    "failed": 3,
    "lastWeek": {
      "totalKOIsProcessed": 1250,
      "newConfirmed": 25,
      "aiClassifications": 450
    }
  }
}
```

#### `GET /api/sync/health`
**Description**: Health check for synchronization service

## 🔧 Services

### NasaSyncService
- **NASA TAP API Integration**: Fetches data from NASA's Exoplanet Archive
- **AI Inference Integration**: Sends candidates to ML model for classification
- **Data Processing**: Handles 127 KOI data fields
- **Kepler Name Generation**: Assigns systematic names to confirmed exoplanets
- **Error Handling**: Robust timeout and error management

### SchedulerService
- **Cron Scheduling**: Automated weekly synchronization (every Sunday at 2:00 AM)
- **Manual Triggers**: On-demand synchronization
- **Status Monitoring**: Real-time scheduler status
- **Custom Patterns**: Configurable cron schedules

### ExoplanetService
- **Data Retrieval**: Efficient querying with pagination
- **Search Functionality**: Advanced filtering and sorting
- **Data Processing**: Automatic classification integration

### PlanetClassificationService
- **Automatic Classification**: Categorizes planets based on physical properties
- **Scoring System**: Habitability and classification scores
- **Multiple Categories**: Terrestrial, gas giants, extreme worlds, etc.

### GeminiChatbotService
- **AI-Powered Chat**: Gemini 1.5 Flash model for natural language responses
- **Space Expertise**: Specialized knowledge about exoplanets and astronomy
- **Real Data Integration**: Uses live NASA KOI data to provide accurate information
- **Context Awareness**: Maintains conversation history for coherent interactions
- **Smart Suggestions**: Provides relevant questions to guide user exploration

## 🗄️ Database Schema

### KOI Objects Collection (`koi_objects`)

```javascript
{
  _id: ObjectId,
  kepoi_name: "K00001.01",
  kepler_name: "Kepler-1 b", // For confirmed exoplanets
  koi_disposition: "CONFIRMED", // CONFIRMED, CANDIDATE, FALSE POSITIVE
  
  // Orbital Properties
  koi_period: 2.8, // Orbital period (days)
  koi_duration: 1.5, // Transit duration (hours)
  koi_depth: 500, // Transit depth (ppm)
  
  // Physical Properties
  koi_prad: 1.2, // Planet radius (Earth radii)
  koi_teq: 1800, // Equilibrium temperature (K)
  koi_ror: 0.02, // Planet-star radius ratio
  
  // Stellar Properties
  koi_steff: 5500, // Stellar effective temperature (K)
  koi_srad: 1.1, // Stellar radius (Solar radii)
  koi_smass: 1.05, // Stellar mass (Solar masses)
  
  // AI Classification (if processed)
  IS_AI: true,
  ai_prediction: "CONFIRMED",
  ai_confidence: 0.95,
  
  // Automatic Classification
  planet_classification: {
    type: "terrestrial",
    score: 0.87,
    habitability_score: 0.65
  },
  
  // Metadata
  sync_source: "nasa_tap",
  sync_date: ISODate,
  sync_version: "1.0"
}
```

### Sync Logs Collection (`sync_logs`)

```javascript
{
  _id: ObjectId,
  startTime: ISODate,
  endTime: ISODate,
  success: true,
  stats: {
    total: 15,
    confirmed: 8,
    candidates: 7,
    duration: 45230
  },
  error: null // Error message if failed
}
```

## 💡 Usage Examples

### Retrieving a Planetary System
```javascript
const response = await fetch('http://localhost:3001/api/exoplanets/system/Kepler-442');
const data = await response.json();
console.log(data.system.exoplanets);
```

### Searching for Habitable Planets
```javascript
const searchParams = new URLSearchParams({
  classification: 'terrestrial',
  minRadius: 0.5,
  maxRadius: 2,
  minTemp: 200,
  maxTemp: 350,
  limit: 10
});

const response = await fetch(`http://localhost:3001/api/exoplanets/search?${searchParams}`);
const data = await response.json();
```

### Triggering Manual Synchronization
```javascript
const response = await fetch('http://localhost:3001/api/sync/run', {
  method: 'POST'
});
const result = await response.json();
console.log('Sync completed:', result.stats);
```

### Starting Automatic Synchronization
```javascript
const response = await fetch('http://localhost:3001/api/sync/scheduler/start', {
  method: 'POST'
});
```

### Using the AI Chatbot
```javascript
// Send a message to the chatbot
const response = await fetch('http://localhost:3001/api/chat/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What makes Kepler-442 b potentially habitable?",
    conversationHistory: []
  })
});
const data = await response.json();
console.log('Bot response:', data.data.botResponse);

// Get suggested questions
const suggestions = await fetch('http://localhost:3001/api/chat/suggestions');
const suggestionsData = await suggestions.json();
console.log('Suggested questions:', suggestionsData.data.suggestions);
```

## 🔬 Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── routes/
│   ├── exoplanets.js       # Exoplanet API endpoints
│   └── sync.js             # Synchronization endpoints
├── services/
│   ├── nasaSyncService.js  # NASA API integration
│   ├── schedulerService.js # Cron scheduling
│   ├── exoplanetService.js # Data services
│   └── planetClassification.js # Classification logic
├── server.js               # Express server setup
├── package.json
└── README.md
```

### Key Dependencies
- **Express**: Web framework
- **MongoDB**: Database driver
- **Axios**: HTTP client for NASA API
- **node-cron**: Task scheduling
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

### Development Commands
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (if available)
npm test
```

### Error Handling
All endpoints include comprehensive error handling with appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found
- `500`: Internal Server Error

### Logging
The application includes detailed console logging for:
- NASA API requests and responses
- AI inference operations
- Database operations
- Synchronization progress
- Error tracking

## 🔄 Synchronization Process

1. **Fetch NASA Data**: Retrieve KOI data from NASA TAP API
2. **Compare Existing**: Check against local MongoDB data
3. **Process New Candidates**: Send candidates to AI inference API
4. **Classification**: Automatic planet type classification
5. **Kepler Naming**: Generate systematic names for confirmed planets
6. **Database Update**: Store results with metadata
7. **Statistics**: Log synchronization statistics

## 🤖 AI Integration

The system integrates with an external AI inference API for exoplanet candidate validation:
- **Timeout**: 10-second timeout per inference request
- **Fields**: Sends 17 specific KOI fields for classification
- **Results**: Processes CONFIRMED/FALSE POSITIVE predictions
- **Confidence**: Stores confidence scores with results

## 🚦 Health Monitoring

Multiple health check endpoints monitor system status:
- **Database connectivity**
- **NASA API accessibility** 
- **AI service availability**
- **Scheduler status**
- **Data integrity**

## 📊 Performance

- **Pagination**: All list endpoints support pagination
- **Indexing**: Optimized MongoDB indexes for fast queries
- **Caching**: Efficient data retrieval patterns
- **Error Recovery**: Robust error handling and recovery

## 🛡️ Security

- **Helmet**: Security headers
- **CORS**: Configured for specific origins
- **Input Validation**: Parameter validation on all endpoints
- **Error Sanitization**: Safe error messages in production

---

**🌟 Built for astronomical data exploration and exoplanet research**

For questions or support, please refer to the project documentation or create an issue in the repository.