# Create FastAPI Backend Code
fastapi_code = '''
"""
Voice Call Quality Prediction API
FastAPI backend for real-time call quality predictions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pickle
import numpy as np
import uvicorn
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Voice Call Quality Prediction API",
    description="ML-powered API for predicting telecom call quality ratings",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
try:
    with open('voice_call_quality_model.pkl', 'rb') as f:
        model_data = pickle.load(f)
    model = model_data['model']
    feature_columns = model_data['feature_columns']
    performance_metrics = model_data['performance_metrics']
    feature_importance = model_data['feature_importance']
    logger.info("Model loaded successfully")
except FileNotFoundError:
    logger.error("Model file not found")
    model = None

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    operator: str = Field(..., description="Telecom operator", 
                         example="Airtel")
    network_type: str = Field(..., description="Network technology", 
                             example="4G")
    inout_travelling: str = Field(..., description="Location context", 
                                 example="Indoor")
    calldrop_category: str = Field(..., description="Call quality category", 
                                  example="Satisfactory")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate", 
                           example=12.97)
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate", 
                            example=77.59)
    state_name: str = Field(..., description="Indian state name", 
                           example="Karnataka")
    month: str = Field(..., description="Month name", 
                      example="March")

class PredictionResponse(BaseModel):
    predicted_rating: float = Field(..., description="Predicted call quality rating (1-5)")
    confidence_interval: str = Field(..., description="Prediction confidence")
    input_summary: dict = Field(..., description="Summary of input parameters")
    model_info: dict = Field(..., description="Model performance information")
    timestamp: str = Field(..., description="Prediction timestamp")

class ModelInfoResponse(BaseModel):
    model_name: str
    accuracy: float
    rmse: float
    mae: float
    feature_count: int
    top_features: List[dict]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    model_loaded: bool

# Month mapping
month_mapping = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
}

def create_feature_vector(request: PredictionRequest) -> np.ndarray:
    """Create feature vector from prediction request"""
    features = {col: 0 for col in feature_columns}
    
    # Basic features
    features['latitude'] = request.latitude
    features['longitude'] = request.longitude
    features['month_num'] = month_mapping.get(request.month, 1)
    features['quarter'] = ((features['month_num'] - 1) // 3) + 1
    
    # Call quality features
    if request.calldrop_category == 'Call Dropped':
        features['is_call_dropped'] = 1
    elif request.calldrop_category == 'Poor Voice Quality':
        features['is_poor_quality'] = 1
    
    # Location features
    if request.inout_travelling == 'Indoor':
        features['is_indoor'] = 1
    elif request.inout_travelling == 'Outdoor':
        features['is_outdoor'] = 1
    elif request.inout_travelling == 'Travelling':
        features['is_travelling'] = 1
    
    # Network features
    if request.network_type == '4G':
        features['is_4g'] = 1
    elif request.network_type == '3G':
        features['is_3g'] = 1
    elif request.network_type == '2G':
        features['is_2g'] = 1
    else:
        features['is_unknown_network'] = 1
    
    # Operator features
    if request.operator == 'Airtel':
        features['is_airtel'] = 1
    elif request.operator == 'RJio':
        features['is_rjio'] = 1
    elif request.operator == 'VI':
        features['is_vi'] = 1
    elif request.operator == 'BSNL':
        features['is_bsnl'] = 1
    
    # State features
    state_col = f'is_{request.state_name.lower().replace(" ", "_")}'
    if state_col in features:
        features[state_col] = 1
    
    return np.array([list(features.values())])

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Voice Call Quality Prediction API",
        "version": "2.0.0",
        "endpoints": {
            "predict": "/predict - Make call quality predictions",
            "health": "/health - Check API health",
            "model-info": "/model-info - Get model information",
            "docs": "/docs - API documentation"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        timestamp=datetime.now().isoformat(),
        model_loaded=model is not None
    )

@app.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Get model information and performance metrics"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return ModelInfoResponse(
        model_name=model_data['model_name'],
        accuracy=round(performance_metrics['r2_score'], 4),
        rmse=round(performance_metrics['rmse'], 4),
        mae=round(performance_metrics['mae'], 4),
        feature_count=len(feature_columns),
        top_features=feature_importance[:5]
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict_call_quality(request: PredictionRequest):
    """Predict call quality rating based on input parameters"""
    
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Create feature vector
        feature_vector = create_feature_vector(request)
        
        # Make prediction
        prediction = model.predict(feature_vector)[0]
        
        # Ensure prediction is within valid range
        prediction = max(1.0, min(5.0, prediction))
        
        # Create response
        response = PredictionResponse(
            predicted_rating=round(prediction, 2),
            confidence_interval="±0.22 rating points",
            input_summary={
                "operator": request.operator,
                "network": request.network_type,
                "location": request.inout_travelling,
                "quality": request.calldrop_category,
                "state": request.state_name,
                "coordinates": f"({request.latitude}, {request.longitude})"
            },
            model_info={
                "model": model_data['model_name'],
                "accuracy": f"{performance_metrics['r2_score']:.1%}",
                "prediction_confidence": "High"
            },
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Prediction made: {prediction:.2f} for {request.operator} in {request.state_name}")
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/operators")
async def get_operators():
    """Get list of supported operators"""
    return {"operators": ["Airtel", "RJio", "VI", "BSNL"]}

@app.get("/network-types")
async def get_network_types():
    """Get list of supported network types"""
    return {"network_types": ["4G", "3G", "2G", "Unknown"]}

@app.get("/states")
async def get_states():
    """Get list of supported states"""
    # This would be populated from your actual data
    return {"states": [
        "Karnataka", "Maharashtra", "Uttarakhand", "Kerala", "Rajasthan",
        "Bihar", "West Bengal", "Madhya Pradesh", "Uttar Pradesh", "Jharkhand"
    ]}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
'''

# Save FastAPI code
with open('fastapi_backend.py', 'w') as f:
    f.write(fastapi_code)

print("✅ FastAPI backend code created: 'fastapi_backend.py'")

# Create requirements.txt for backend
requirements = '''fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
scikit-learn==1.3.2
pandas==2.1.4
numpy==1.24.3
python-multipart==0.0.6
'''

with open('requirements.txt', 'w') as f:
    f.write(requirements)

print("✅ Requirements file created: 'requirements.txt'")

# Create Docker configuration
dockerfile = '''FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "fastapi_backend:app", "--host", "0.0.0.0", "--port", "8000"]
'''

with open('Dockerfile', 'w') as f:
    f.write(dockerfile)

print("✅ Dockerfile created for containerization")

print("\n🚀 BACKEND DEPLOYMENT INSTRUCTIONS:")
print("=" * 40)
print("1. Install dependencies: pip install -r requirements.txt")
print("2. Run server: python fastapi_backend.py")
print("3. Access API docs: http://localhost:8000/docs")
print("4. Test predictions: http://localhost:8000/predict")
print("5. Docker build: docker build -t voice-call-api .")
print("6. Docker run: docker run -p 8000:8000 voice-call-api")