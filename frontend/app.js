// Voice Call Quality Prediction System Application

// Application Data
const appData = {
    operators: ["Airtel", "RJio", "VI", "BSNL"],
    network_types: ["4G", "3G", "2G", "Unknown"],
    location_contexts: ["Indoor", "Outdoor", "Travelling"],
    quality_categories: ["Satisfactory", "Poor Voice Quality", "Call Dropped"],
    states: ["Karnataka", "Maharashtra", "Uttarakhand", "Kerala", "Rajasthan", "Bihar", "West Bengal", "Madhya Pradesh", "Uttar Pradesh", "Jharkhand", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Gujarat", "Punjab", "Haryana", "Delhi", "Himachal Pradesh", "Jammu and Kashmir", "Odisha"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    
    // Model performance data
    model_metrics: {
        accuracy: 92.8,
        rmse: 0.40,
        mae: 0.22,
        features: 27
    },

    // Operator performance baselines
    operator_performance: {
        "Airtel": 4.17,
        "BSNL": 3.88,
        "VI": 3.72,
        "RJio": 3.07
    },

    // Network performance baselines
    network_performance: {
        "2G": 4.14,
        "3G": 3.52,
        "4G": 3.47,
        "Unknown": 2.80
    },

    // Quality impact factors
    quality_impact: {
        "Satisfactory": 1.0,
        "Poor Voice Quality": 0.35,
        "Call Dropped": 0.29
    },

    // Location factors
    location_factors: {
        "Indoor": 1.0,
        "Outdoor": 0.95,
        "Travelling": 0.88
    },

    // Recent predictions storage
    recentPredictions: []
};

// Chart configurations
const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

// Global chart instances
let charts = {};

// Application State
let currentPrediction = null;
let predictionCount = 1247; // Mock starting count

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Voice Call Quality Predictor...');
    
    // Initialize components in order
    initializeNavigation();
    initializeForm();
    initializePredictionHistory();
    updateAnalytics();
    
    // Delay chart initialization to ensure DOM is ready
    setTimeout(() => {
        initializeCharts();
    }, 200);
    
    console.log('Application initialized successfully');
});

// Navigation System - Fixed version
function initializeNavigation() {
    console.log('Setting up navigation...');
    
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    console.log('Found nav tabs:', navTabs.length);
    console.log('Found tab contents:', tabContents.length);

    navTabs.forEach((tab, index) => {
        console.log(`Setting up tab ${index}: ${tab.dataset.tab}`);
        
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetTab = this.dataset.tab;
            console.log('Tab clicked:', targetTab);
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            
            if (targetContent) {
                targetContent.classList.add('active');
                console.log('Activated tab:', targetTab);
                
                // Resize charts when analytics tab is shown
                if (targetTab === 'analytics') {
                    setTimeout(() => {
                        Object.values(charts).forEach(chart => {
                            if (chart && chart.resize) {
                                console.log('Resizing chart');
                                chart.resize();
                            }
                        });
                    }, 100);
                }
            } else {
                console.error('Target content not found:', targetTab);
            }
        });

        // Keyboard support
        tab.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        tab.setAttribute('tabindex', '0');
    });
    
    console.log('Navigation setup complete');
}

// Form Initialization and Handling - Fixed version
function initializeForm() {
    console.log('Setting up form...');
    
    const form = document.getElementById('predictionForm');
    if (!form) {
        console.error('Prediction form not found');
        return;
    }

    // Handle location toggle buttons
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const locationInput = document.getElementById('location');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove active from all toggle buttons
            toggleBtns.forEach(b => b.classList.remove('active'));
            
            // Add active to clicked button
            this.classList.add('active');
            
            // Update hidden input value
            if (locationInput) {
                locationInput.value = this.dataset.value;
                console.log('Location set to:', this.dataset.value);
            }
            
            // Trigger form validation
            validateForm();
        });
    });

    // Form submission handling
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted');
        handlePrediction();
    });

    // Radio button handling for network type
    const networkRadios = document.querySelectorAll('input[name="network"]');
    networkRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Network type selected:', this.value);
            validateForm();
        });
    });

    // Radio button handling for quality
    const qualityRadios = document.querySelectorAll('input[name="quality"]');
    qualityRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Quality selected:', this.value);
            validateForm();
        });
    });

    // Dropdown change handlers
    const dropdowns = ['operator', 'state', 'month'];
    dropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                console.log(`${id} changed to:`, this.value);
                validateForm();
            });
        }
    });

    // Coordinate input handlers
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (latInput) {
        latInput.addEventListener('input', function() {
            validateCoordinates();
        });
    }
    
    if (lngInput) {
        lngInput.addEventListener('input', function() {
            validateCoordinates();
        });
    }

    // Set default month to current month (September)
    const monthSelect = document.getElementById('month');
    if (monthSelect) {
        monthSelect.value = 'September';
    }
    
    // Initial form validation
    setTimeout(() => {
        validateForm();
    }, 100);
    
    console.log('Form setup complete');
}

// Form Validation - Fixed version
function validateForm() {
    const form = document.getElementById('predictionForm');
    const submitBtn = document.getElementById('predictBtn');
    
    if (!form || !submitBtn) {
        console.error('Form or submit button not found');
        return;
    }

    // Check required fields
    const operator = document.getElementById('operator')?.value;
    const network = document.querySelector('input[name="network"]:checked')?.value;
    const location = document.getElementById('location')?.value;
    const state = document.getElementById('state')?.value;
    const month = document.getElementById('month')?.value;

    const isValid = operator && network && location && state && month;
    
    console.log('Form validation:', {
        operator: !!operator,
        network: !!network,
        location: !!location,
        state: !!state,
        month: !!month,
        isValid
    });

    submitBtn.disabled = !isValid;
    
    if (isValid) {
        submitBtn.classList.remove('btn--disabled');
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.classList.add('btn--disabled');
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    }
}

function validateCoordinates() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (latInput && latInput.value) {
        const lat = parseFloat(latInput.value);
        if (lat < -90 || lat > 90) {
            latInput.setCustomValidity('Latitude must be between -90 and 90');
        } else {
            latInput.setCustomValidity('');
        }
    }
    
    if (lngInput && lngInput.value) {
        const lng = parseFloat(lngInput.value);
        if (lng < -180 || lng > 180) {
            lngInput.setCustomValidity('Longitude must be between -180 and 180');
        } else {
            lngInput.setCustomValidity('');
        }
    }
}

// Prediction Logic - Fixed version
function handlePrediction() {
    console.log('Starting prediction...');
    
    const formData = collectFormData();
    
    if (!formData) {
        showError('Please fill in all required fields');
        return;
    }

    console.log('Form data collected:', formData);
    
    showLoadingState();
    
    // Simulate API call delay
    setTimeout(() => {
        const prediction = generatePrediction(formData);
        console.log('Prediction generated:', prediction);
        displayPrediction(prediction);
        addToHistory(formData, prediction);
        updateAnalytics();
        hideLoadingState();
    }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
}

function collectFormData() {
    const data = {
        operator: document.getElementById('operator')?.value,
        network: document.querySelector('input[name="network"]:checked')?.value,
        location: document.getElementById('location')?.value,
        quality: document.querySelector('input[name="quality"]:checked')?.value || null,
        state: document.getElementById('state')?.value,
        latitude: parseFloat(document.getElementById('latitude')?.value) || null,
        longitude: parseFloat(document.getElementById('longitude')?.value) || null,
        month: document.getElementById('month')?.value,
        timestamp: new Date().toISOString()
    };

    console.log('Collected form data:', data);

    // Validate required fields
    if (!data.operator || !data.network || !data.location || !data.state || !data.month) {
        console.error('Missing required fields:', data);
        return null;
    }

    return data;
}

function generatePrediction(data) {
    // Base prediction logic using the provided performance data
    let basePrediction = 3.5; // Default baseline
    
    // Operator impact
    if (appData.operator_performance[data.operator]) {
        basePrediction = appData.operator_performance[data.operator];
    }
    
    // Network type adjustment
    const networkFactor = appData.network_performance[data.network] / 3.52; // Normalize against average
    basePrediction *= networkFactor;
    
    // Location impact
    if (appData.location_factors[data.location]) {
        basePrediction *= appData.location_factors[data.location];
    }
    
    // Quality category impact (if specified)
    if (data.quality && appData.quality_impact[data.quality]) {
        basePrediction *= appData.quality_impact[data.quality];
        
        // If user expects call drops or poor quality, add some uncertainty
        if (data.quality !== 'Satisfactory') {
            basePrediction += (Math.random() - 0.5) * 0.3;
        }
    }
    
    // Add some randomness for realism
    basePrediction += (Math.random() - 0.5) * 0.4;
    
    // Ensure rating is within bounds
    basePrediction = Math.max(1.0, Math.min(5.0, basePrediction));
    
    // Calculate confidence based on how complete the data is
    let confidence = 0.75; // Base confidence
    
    if (data.quality) confidence += 0.1;
    if (data.latitude && data.longitude) confidence += 0.1;
    confidence = Math.min(0.95, confidence + (Math.random() * 0.1));
    
    // Calculate drop probability
    const dropProbability = Math.max(0.01, Math.min(0.15, (5.5 - basePrediction) * 0.03));
    
    return {
        rating: Math.round(basePrediction * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        dropProbability: Math.round(dropProbability * 100) / 100,
        qualityScore: getQualityScore(basePrediction),
        timestamp: new Date().toISOString()
    };
}

function getQualityScore(rating) {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Good';
    if (rating >= 3.0) return 'Fair';
    if (rating >= 2.0) return 'Poor';
    return 'Very Poor';
}

function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = (rating % 1) >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    
    if (hasHalfStar && fullStars < 5) {
        stars += '✨';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }
    
    return stars;
}

// UI State Management - Fixed version
function showLoadingState() {
    const btnText = document.querySelector('.btn-text');
    const btnSpinner = document.querySelector('.btn-spinner');
    const submitBtn = document.getElementById('predictBtn');
    const statusEl = document.getElementById('resultsStatus');
    
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;
    
    if (statusEl) {
        statusEl.className = 'results-status loading';
        statusEl.innerHTML = '<span class="status-text">Analyzing parameters...</span>';
    }
    
    console.log('Loading state shown');
}

function hideLoadingState() {
    const btnText = document.querySelector('.btn-text');
    const btnSpinner = document.querySelector('.btn-spinner');
    const submitBtn = document.getElementById('predictBtn');
    
    if (btnText) btnText.style.display = 'inline';
    if (btnSpinner) btnSpinner.classList.add('hidden');
    if (submitBtn) submitBtn.disabled = false;
    
    console.log('Loading state hidden');
}

function displayPrediction(prediction) {
    const resultsContent = document.getElementById('resultsContent');
    const statusEl = document.getElementById('resultsStatus');
    
    if (!resultsContent) {
        console.error('Results content element not found');
        return;
    }
    
    if (statusEl) {
        statusEl.className = 'results-status success';
        statusEl.innerHTML = '<span class="status-text">Prediction complete</span>';
    }
    
    const stars = getStarRating(prediction.rating);
    
    resultsContent.innerHTML = `
        <div class="prediction-display">
            <div class="rating-display">
                <div class="rating-value">${prediction.rating}</div>
                <div class="rating-stars">${stars}</div>
                <div class="rating-label">Predicted Call Quality</div>
            </div>
            
            <div class="confidence-info">
                <div class="confidence-item">
                    <div class="confidence-value">${Math.round(prediction.confidence * 100)}%</div>
                    <div class="confidence-label">Confidence</div>
                </div>
                <div class="confidence-item">
                    <div class="confidence-value">${Math.round(prediction.dropProbability * 100)}%</div>
                    <div class="confidence-label">Drop Probability</div>
                </div>
            </div>
            
            <div style="margin-top: var(--space-16); padding: var(--space-12); background: var(--color-bg-1); border-radius: var(--radius-base); text-align: center;">
                <strong>Quality Score:</strong> ${prediction.qualityScore}
            </div>
        </div>
    `;
    
    currentPrediction = prediction;
    console.log('Prediction displayed');
}

function showError(message) {
    const statusEl = document.getElementById('resultsStatus');
    const resultsContent = document.getElementById('resultsContent');
    
    if (statusEl) {
        statusEl.className = 'results-status error';
        statusEl.innerHTML = `<span class="status-text">${message}</span>`;
    }
    
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `;
    }
    
    console.log('Error shown:', message);
}

// History Management
function addToHistory(formData, prediction) {
    const historyItem = {
        id: Date.now(),
        formData: formData,
        prediction: prediction,
        timestamp: new Date().toISOString()
    };
    
    appData.recentPredictions.unshift(historyItem);
    
    // Keep only last 5 predictions
    if (appData.recentPredictions.length > 5) {
        appData.recentPredictions = appData.recentPredictions.slice(0, 5);
    }
    
    updatePredictionHistory();
    
    // Increment prediction counter
    predictionCount++;
}

function initializePredictionHistory() {
    // Add some mock history data
    const mockHistory = [
        {
            id: 1,
            formData: { operator: "Airtel", network: "4G", location: "Indoor", state: "Karnataka" },
            prediction: { rating: 4.2, confidence: 0.89 },
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 2,
            formData: { operator: "RJio", network: "3G", location: "Outdoor", state: "Maharashtra" },
            prediction: { rating: 3.1, confidence: 0.76 },
            timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 3,
            formData: { operator: "VI", network: "2G", location: "Travelling", state: "Delhi" },
            prediction: { rating: 3.8, confidence: 0.82 },
            timestamp: new Date(Date.now() - 10800000).toISOString()
        }
    ];
    
    appData.recentPredictions = mockHistory;
    updatePredictionHistory();
}

function updatePredictionHistory() {
    const listEl = document.getElementById('predictionsList');
    
    if (!listEl) {
        console.error('Predictions list element not found');
        return;
    }
    
    if (appData.recentPredictions.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-16);">No recent predictions</p>';
        return;
    }
    
    listEl.innerHTML = appData.recentPredictions.map(item => `
        <div class="prediction-item">
            <div class="prediction-info">
                <div class="prediction-summary">
                    ${item.formData.operator} • ${item.formData.network} • ${item.formData.location}
                </div>
                <div class="prediction-details">
                    ${item.formData.state} • ${new Date(item.timestamp).toLocaleTimeString()}
                </div>
            </div>
            <div class="prediction-rating">${item.prediction.rating}</div>
        </div>
    `).join('');
}

// Analytics and Charts
function updateAnalytics() {
    // Update metrics
    const totalEl = document.getElementById('totalPredictions');
    const avgEl = document.getElementById('avgRating');
    const dropEl = document.getElementById('dropRate');
    const topEl = document.getElementById('topOperator');
    
    if (totalEl) totalEl.textContent = predictionCount.toLocaleString();
    if (avgEl) avgEl.textContent = '3.8';
    if (dropEl) dropEl.textContent = '4.2%';
    if (topEl) topEl.textContent = 'Airtel';
}

function initializeCharts() {
    console.log('Initializing charts...');
    
    try {
        createOperatorChart();
        createNetworkChart();
        console.log('Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function createOperatorChart() {
    const canvas = document.getElementById('operatorChart');
    if (!canvas) {
        console.log('Operator chart canvas not found');
        return;
    }
    
    console.log('Creating operator chart...');
    
    const ctx = canvas.getContext('2d');
    
    if (charts.operatorChart) {
        charts.operatorChart.destroy();
    }
    
    const operators = Object.keys(appData.operator_performance);
    const ratings = Object.values(appData.operator_performance);
    
    charts.operatorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: operators,
            datasets: [{
                label: 'Average Rating',
                data: ratings,
                backgroundColor: chartColors.slice(0, operators.length),
                borderColor: chartColors.slice(0, operators.length),
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y.toFixed(2)} ⭐`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    console.log('Operator chart created');
}

function createNetworkChart() {
    const canvas = document.getElementById('networkChart');
    if (!canvas) {
        console.log('Network chart canvas not found');
        return;
    }
    
    console.log('Creating network chart...');
    
    const ctx = canvas.getContext('2d');
    
    if (charts.networkChart) {
        charts.networkChart.destroy();
    }
    
    const networks = Object.keys(appData.network_performance);
    const ratings = Object.values(appData.network_performance);
    
    charts.networkChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: networks,
            datasets: [{
                data: ratings,
                backgroundColor: chartColors.slice(0, networks.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.toFixed(2)} ⭐`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    console.log('Network chart created');
}

// Keyboard Navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) {
            const tabs = Array.from(document.querySelectorAll('.nav-tab'));
            const currentIndex = tabs.indexOf(activeTab);
            let newIndex;
            
            if (e.key === 'ArrowLeft') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            } else {
                newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            }
            
            tabs[newIndex].click();
            tabs[newIndex].focus();
        }
    }
});

// Window resize handler for charts
window.addEventListener('resize', debounce(() => {
    Object.values(charts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });
}, 250));

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functionality for business users
function exportPredictions() {
    const exportData = {
        exported_at: new Date().toISOString(),
        predictions: appData.recentPredictions,
        summary: {
            total_predictions: predictionCount,
            avg_rating: 3.8,
            model_accuracy: appData.model_metrics.accuracy
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictions_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Performance monitoring
function trackPageLoad() {
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
    }
}

// Initialize performance tracking
window.addEventListener('load', trackPageLoad);

console.log('Voice Call Quality Predictor application loaded successfully');