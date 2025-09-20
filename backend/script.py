# ENHANCED VOICE CALL QUALITY PREDICTION SYSTEM
# Building ML-based predictive models with advanced features

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

print("🤖 VOICE CALL QUALITY PREDICTION SYSTEM")
print("=" * 55)
print("Building ML models to predict call quality ratings")

# Load and prepare the cleaned dataset
csv_files = ['January_MyCall_2023.csv', 'February_MyCall_2023.csv', 'March_MyCall_2023.csv', 
             'April_MyCall_2023.csv', 'May_MyCall_2023.csv', 'June_MyCall_2023.csv',
             'July_MyCall_2023.csv', 'August_MyCall_2023.csv', 'September_MyCall_2023.csv', 
             'October_MyCall_2023.csv']

# Load and clean data
all_data = []
for file in csv_files:
    try:
        df_temp = pd.read_csv(file)
        month = file.split('_')[0]
        df_temp['month'] = month
        all_data.append(df_temp)
    except FileNotFoundError:
        continue

# Combine and clean
df_raw = pd.concat(all_data, ignore_index=True)
df = df_raw.drop_duplicates()
df = df[(df['latitude'] > 0) | (df['state_name'].notna())]
df = df.dropna(subset=['state_name'])

print(f"✅ Dataset loaded: {len(df):,} clean records")

# Enhanced feature engineering for ML
print("\n🔧 ADVANCED FEATURE ENGINEERING:")
print("-" * 40)

# 1. Geographic features
df['lat_rounded'] = df['latitude'].round(1)
df['lon_rounded'] = df['longitude'].round(1)
df['geo_cluster'] = df['lat_rounded'].astype(str) + '_' + df['lon_rounded'].astype(str)

# 2. Call quality binary features
df['is_call_dropped'] = (df['calldrop_category'] == 'Call Dropped').astype(int)
df['is_poor_quality'] = (df['calldrop_category'] == 'Poor Voice Quality').astype(int)
df['is_satisfactory'] = (df['calldrop_category'] == 'Satisfactory').astype(int)

# 3. Location context features
df['is_indoor'] = (df['inout_travelling'] == 'Indoor').astype(int)
df['is_outdoor'] = (df['inout_travelling'] == 'Outdoor').astype(int)
df['is_travelling'] = (df['inout_travelling'] == 'Travelling').astype(int)

# 4. Network technology features
df['is_4g'] = (df['network_type'] == '4G').astype(int)
df['is_3g'] = (df['network_type'] == '3G').astype(int)
df['is_2g'] = (df['network_type'] == '2G').astype(int)
df['is_unknown_network'] = (df['network_type'] == 'Unknown').astype(int)

# 5. Operator features
df['is_airtel'] = (df['operator'] == 'Airtel').astype(int)
df['is_rjio'] = (df['operator'] == 'RJio').astype(int)
df['is_vi'] = (df['operator'] == 'VI').astype(int)
df['is_bsnl'] = (df['operator'] == 'BSNL').astype(int)

# 6. Temporal features
month_mapping = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10
}
df['month_num'] = df['month'].map(month_mapping)
df['quarter'] = ((df['month_num'] - 1) // 3) + 1

# 7. State-based features (top performing states)
top_states = df['state_name'].value_counts().head(10).index
for state in top_states:
    df[f'is_{state.lower().replace(" ", "_")}'] = (df['state_name'] == state).astype(int)

print(f"✅ Feature engineering completed")
print(f"   - Geographic clustering: {df['geo_cluster'].nunique()} unique locations")
print(f"   - Binary quality indicators: 3 features")
print(f"   - Location context: 3 features") 
print(f"   - Network technology: 4 features")
print(f"   - Operator identification: 4 features")
print(f"   - Temporal features: 2 features")
print(f"   - State indicators: {len(top_states)} top states")

# Prepare ML features
feature_columns = [
    # Core features
    'latitude', 'longitude', 'month_num', 'quarter',
    # Call quality indicators
    'is_call_dropped', 'is_poor_quality',
    # Location context
    'is_indoor', 'is_outdoor', 'is_travelling',
    # Network technology
    'is_4g', 'is_3g', 'is_2g', 'is_unknown_network',
    # Operators
    'is_airtel', 'is_rjio', 'is_vi', 'is_bsnl'
]

# Add top state features
for state in top_states:
    state_col = f'is_{state.lower().replace(" ", "_")}'
    if state_col in df.columns:
        feature_columns.append(state_col)

print(f"\n📊 MACHINE LEARNING FEATURES:")
print(f"Total features: {len(feature_columns)}")
print(f"Target variable: rating (1-5 scale)")

X = df[feature_columns].fillna(0)
y = df['rating']

print(f"Feature matrix shape: {X.shape}")
print(f"Target variable shape: {y.shape}")
print(f"Target distribution: {dict(y.value_counts().sort_index())}")