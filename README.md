# 🌌 Space Exoplanets Backend API

A comprehensive Node.js/Express backend API for managing exoplanet data from NASA's Kepler mission with MongoDB integration, AI-powered classification, and automated synchronization.

## 🚀 Features

- **NASA TAP API Integration**: Automatic synchronization with NASA's Exoplanet Archive
- **AI Classification**: Machine Learning inference for exoplanet candidate validation
- **MongoDB Storage**: Complete KOI (Kepler Objects of Interest) data management
- **Automated Scheduling**: Cron-based hourly synchronization
- **Planet Classification**: Automatic categorization into terrestrial, gas giant, extreme worlds, etc.
- **Kepler Naming**: Automatic generation of Kepler names for confirmed exoplanets
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

4. **Start the server**
```bash
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
**Description**: Search exoplanets with advanced filtering

**Query Parameters**:
- `q` (string): Search term (Kepler name or system)
- `classification` (string): Planet type filter
- `disposition` (string): KOI disposition (CONFIRMED, CANDIDATE, FALSE POSITIVE)
- `minRadius` (number): Minimum planet radius (Earth radii)
- `maxRadius` (number): Maximum planet radius (Earth radii)
- `minPeriod` (number): Minimum orbital period (days)
- `maxPeriod` (number): Maximum orbital period (days)
- `minTemp` (number): Minimum equilibrium temperature (K)
- `maxTemp` (number): Maximum equilibrium temperature (K)
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)
- `sortBy` (string): Sort field (default: koi_period)
- `sortOrder` (string): Sort order (asc/desc, default: asc)

**Example**:
```
GET /api/exoplanets/search?classification=terrestrial&minRadius=0.5&maxRadius=2&page=1&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalResults": 45,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### `GET /api/exoplanets/all`
**Description**: Get all exoplanets with pagination

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 50, max: 500)
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order (asc/desc)

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
      "lastRun": "2025-10-05T13:00:00Z",
      "nextRun": "2025-10-05T15:00:00Z",
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
**Description**: Start automatic hourly synchronization

#### `POST /api/sync/scheduler/stop`
**Description**: Stop automatic synchronization

#### `POST /api/sync/scheduler/restart`
**Description**: Restart synchronization scheduler

#### `POST /api/sync/scheduler/configure`
**Description**: Configure custom synchronization schedule

**Request Body**:
```json
{
  "cronPattern": "0 */6 * * *",
  "timezone": "UTC"
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
- **Cron Scheduling**: Automated hourly synchronization
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