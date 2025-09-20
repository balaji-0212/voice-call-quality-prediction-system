#!/bin/bash

# Voice Call Quality Prediction System - Deployment Script

echo "🚀 Deploying Voice Call Quality Prediction System"
echo "================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is required but not installed"
    exit 1
fi

echo "✅ Python and pip found"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if model file exists
if [ ! -f "voice_call_quality_model.pkl" ]; then
    echo "❌ Model file not found. Please run the ML training script first."
    exit 1
fi

echo "✅ ML model found"

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
echo "   - API will be available at: http://localhost:8000"
echo "   - API docs will be available at: http://localhost:8000/docs"
echo "   - Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python fastapi_backend.py
