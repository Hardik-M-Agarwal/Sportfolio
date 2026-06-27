"""
Sponsor ROI XGBoost Regressor Training
Predicts estimated_reach and cost_per_person
Run after generate_data.py
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib
import os
import json

BASE_DIR = os.path.dirname(__file__)

def load_data():
    path = os.path.join(BASE_DIR, 'dataset.csv')
    df = pd.read_csv(path)
    print(f"✅ Loaded dataset: {df.shape[0]} records")
    return df

def encode_features(df):
    encoders = {}
    cat_features = ['sport', 'format', 'sponsorship_tier']
    for col in cat_features:
        le = LabelEncoder()
        df[col + '_encoded'] = le.fit_transform(df[col])
        encoders[col] = le
        print(f"  Encoded {col}: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    return df, encoders

def get_feature_columns():
    return [
        'sport_encoded',
        'city_tier',
        'num_teams',
        'num_matches',
        'venue_capacity',
        'team_size',
        'tournament_days',
        'has_existing_sponsor',
        'format_encoded',
        'sponsorship_tier_encoded',
    ]

def train_model(X_train, X_test, y_train, y_test, target_name):
    print(f"\n── Training XGBoost for {target_name} ─────────────────")

    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=7,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=5,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
        early_stopping_rounds=30,
        eval_metric='rmse',
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    y_pred = model.predict(X_test)
    r2   = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae  = mean_absolute_error(y_test, y_pred)

    print(f"  R² Score : {r2:.4f}")
    print(f"  RMSE     : {rmse:.2f}")
    print(f"  MAE      : {mae:.2f}")

    return model, {'r2_score': round(r2, 4), 'rmse': round(rmse, 2), 'mae': round(mae, 2)}

def train(df):
    print("\n── Encoding features ──────────────────────────────")
    df, encoders = encode_features(df)

    feature_cols = get_feature_columns()
    X = df[feature_cols]

    print(f"\n── Splitting data ──────────────────────────────────")
    X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
    y_reach_train   = df.loc[X_train.index, 'estimated_reach']
    y_reach_test    = df.loc[X_test.index,  'estimated_reach']
    y_cpp_train     = df.loc[X_train.index, 'cost_per_person']
    y_cpp_test      = df.loc[X_test.index,  'cost_per_person']

    print(f"  Train: {X_train.shape[0]} samples")
    print(f"  Test:  {X_test.shape[0]} samples")

    # train reach model
    reach_model, reach_metrics = train_model(
        X_train, X_test, y_reach_train, y_reach_test, 'estimated_reach'
    )

    # train cost per person model
    cpp_model, cpp_metrics = train_model(
        X_train, X_test, y_cpp_train, y_cpp_test, 'cost_per_person'
    )

    # feature importance from reach model
    print(f"\n── Feature Importance (Reach Model) ───────────────")
    importance = reach_model.feature_importances_
    feat_imp = sorted(
        zip(feature_cols, importance),
        key=lambda x: x[1],
        reverse=True
    )
    for feat, imp in feat_imp:
        bar = '█' * int(imp * 50)
        print(f"  {feat:<28} {bar} {imp:.3f}")

    metrics = {
        'reach_model':      reach_metrics,
        'cpp_model':        cpp_metrics,
        'feature_importance': {feat: round(float(imp), 4) for feat, imp in feat_imp},
    }

    metrics_path = os.path.join(BASE_DIR, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"\n✅ Metrics saved to {metrics_path}")

    return reach_model, cpp_model, encoders, metrics

def save_artifacts(reach_model, cpp_model, encoders):
    joblib.dump(reach_model, os.path.join(BASE_DIR, 'reach_model.pkl'))
    joblib.dump(cpp_model,   os.path.join(BASE_DIR, 'cpp_model.pkl'))
    joblib.dump(encoders,    os.path.join(BASE_DIR, 'encoder.pkl'))
    print(f"✅ reach_model.pkl saved")
    print(f"✅ cpp_model.pkl saved")
    print(f"✅ encoder.pkl saved")

if __name__ == '__main__':
    print("🚀 Starting Sponsor ROI Model Training\n")
    df = load_data()
    reach_model, cpp_model, encoders, metrics = train(df)
    save_artifacts(reach_model, cpp_model, encoders)
    print(f"\n🎉 Training complete!")
    print(f"   Reach R²: {metrics['reach_model']['r2_score']}")
    print(f"   CPP R²:   {metrics['cpp_model']['r2_score']}")