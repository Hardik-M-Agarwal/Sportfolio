"""
Entry Fee XGBoost Model Training
Run after generate_data.py
Saves model.pkl and encoder.pkl
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
    """Encode categorical features and save encoders"""
    encoders = {}

    cat_features = ['sport', 'format']
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
        'venue_cost',
        'max_teams',
        'team_size',
        'format_encoded',
        'has_sponsor',
        'prize_percentage',
        'tournament_days',
    ]

def train(df):
    print("\n── Encoding features ──────────────────────────────")
    df, encoders = encode_features(df)

    feature_cols = get_feature_columns()
    X = df[feature_cols]
    y = df['optimal_entry_fee']

    print(f"\n── Splitting data ──────────────────────────────────")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"  Train: {X_train.shape[0]} samples")
    print(f"  Test:  {X_test.shape[0]} samples")

    print(f"\n── Training XGBoost ────────────────────────────────")
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

    print(f"\n── Evaluation ──────────────────────────────────────")
    y_pred = model.predict(X_test)

    r2   = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae  = mean_absolute_error(y_test, y_pred)

    print(f"  R² Score : {r2:.4f}")
    print(f"  RMSE     : ₹{rmse:.0f}")
    print(f"  MAE      : ₹{mae:.0f}")

    # feature importance
    print(f"\n── Feature Importance ──────────────────────────────")
    importance = model.feature_importances_
    feat_imp = sorted(
        zip(feature_cols, importance),
        key=lambda x: x[1],
        reverse=True
    )
    for feat, imp in feat_imp:
        bar = '█' * int(imp * 50)
        print(f"  {feat:<22} {bar} {imp:.3f}")

    # cross validation
    print(f"\n── Cross Validation (5-fold) ───────────────────────")
    cv_model = xgb.XGBRegressor(
        n_estimators=model.best_iteration,
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
    )
    cv_scores = cross_val_score(cv_model, X, y, cv=5, scoring='r2')
    print(f"  CV R² scores: {[round(s, 4) for s in cv_scores]}")
    print(f"  Mean CV R²:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # save model metrics
    metrics = {
        'r2_score': round(r2, 4),
        'rmse': round(rmse, 2),
        'mae': round(mae, 2),
        'cv_r2_mean': round(cv_scores.mean(), 4),
        'cv_r2_std': round(cv_scores.std(), 4),
        'best_iteration': int(model.best_iteration),
        'feature_importance': {feat: round(float(imp), 4) for feat, imp in feat_imp},
    }

    metrics_path = os.path.join(BASE_DIR, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"\n✅ Metrics saved to {metrics_path}")

    return model, encoders, metrics

def save_artifacts(model, encoders):
    model_path   = os.path.join(BASE_DIR, 'model.pkl')
    encoder_path = os.path.join(BASE_DIR, 'encoder.pkl')

    joblib.dump(model, model_path)
    joblib.dump(encoders, encoder_path)

    print(f"✅ Model saved to {model_path}")
    print(f"✅ Encoders saved to {encoder_path}")

if __name__ == '__main__':
    print("🚀 Starting Entry Fee Model Training\n")
    df = load_data()
    model, encoders, metrics = train(df)
    save_artifacts(model, encoders)
    print(f"\n🎉 Training complete!")
    print(f"   R² Score: {metrics['r2_score']}")
    print(f"   RMSE:     ₹{metrics['rmse']}")
    print(f"   MAE:      ₹{metrics['mae']}")