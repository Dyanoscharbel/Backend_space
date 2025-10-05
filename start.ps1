# Start Backend Server with Chatbot
Write-Host "🚀 Starting Space Exoplanet Backend with AI Chatbot..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Please edit .env file and add your GEMINI_API_KEY" -ForegroundColor Green
    Write-Host "Get your key from: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Test chatbot before starting server
Write-Host "🤖 Testing chatbot functionality..." -ForegroundColor Blue
node test-chatbot.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Chatbot test passed! Starting server..." -ForegroundColor Green
    Write-Host "🌐 Server will be available at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🤖 Chat API available at: http://localhost:3000/api/chat" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "📋 Available Chat Endpoints:" -ForegroundColor White
    Write-Host "   POST /api/chat/send           - Send a message" -ForegroundColor Gray
    Write-Host "   GET  /api/chat/suggestions    - Get suggested questions" -ForegroundColor Gray
    Write-Host "   POST /api/chat/conversation   - Manage conversations" -ForegroundColor Gray
    Write-Host "   GET  /api/chat/health         - Health check" -ForegroundColor Gray
    Write-Host ""
    npm start
} else {
    Write-Host "❌ Chatbot test failed. Please check configuration." -ForegroundColor Red
    Write-Host "Make sure GEMINI_API_KEY is set in your .env file" -ForegroundColor Yellow
}