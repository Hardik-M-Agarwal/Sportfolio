"""
Registration Forecaster XGBoost Classifier Training
Run after generate_data.py
Saves model.pkl, encoder.pkl, metrics.json
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, f1_score
)
import joblib
import os
import json

BASE_DIR = os.path.dirname(__file__)

def load_data():
    path = os.path.join(BASE_DIR, 'dataset.csv')
    df = pd.read_csv(path)
    print(f"✅ Loaded dataset: {df.shape[0]} records")
    print(f"\nLabel distribution:\n{df['label'].value_counts()}")
    return df

def encode_features(df):
    encoders = {}

    cat_features = ['sport', 'format', 'label']
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
        'current_registrations',
        'days_since_open',
        'total_days_available',
        'days_remaining',
        'max_teams',
        'entry_fee',
        'prize_pool',
        'has_sponsor',
        'format_encoded',
        'fill_percentage',
    ]

def train(df):
    print("\n── Encoding features ──────────────────────────────")
    df, encoders = encode_features(df)

    feature_cols = get_feature_columns()
    X = df[feature_cols]
    y = df['label_encoded']

    print(f"\n── Splitting data ──────────────────────────────────")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  Train: {X_train.shape[0]} samples")
    print(f"  Test:  {X_test.shape[0]} samples")

    print(f"\n── Training XGBoost Classifier ─────────────────────")
    model = xgb.XGBClassifier(
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
        eval_metric='mlogloss',
        use_label_encoder=False,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    print(f"\n── Evaluation ──────────────────────────────────────")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    f1       = f1_score(y_test, y_pred, average='weighted')

    label_encoder = encoders['label']
    class_names   = label_encoder.classes_

    print(f"  Accuracy:    {accuracy:.4f}")
    print(f"  F1 Score:    {f1:.4f}")
    print(f"\n  Classification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=class_names
    ))
    print(f"  Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # feature importance
    print(f"\n── Feature Importance ──────────────────────────────")
    importance   = model.feature_importances_
    feat_imp = sorted(
        zip(feature_cols, importance),
        key=lambda x: x[1],
        reverse=True
    )
    for feat, imp in feat_imp:
        bar = '█' * int(imp * 50)
        print(f"  {feat:<28} {bar} {imp:.3f}")

    # cross validation
    print(f"\n── Cross Validation (5-fold stratified) ────────────")
    cv_model = xgb.XGBClassifier(
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
        use_label_encoder=False,
    )
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(cv_model, X, y, cv=skf, scoring='accuracy')
    print(f"  CV Accuracy scores: {[round(s, 4) for s in cv_scores]}")
    print(f"  Mean CV Accuracy:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # save metrics
    metrics = {
        'accuracy':      round(accuracy, 4),
        'f1_score':      round(f1, 4),
        'cv_accuracy_mean': round(cv_scores.mean(), 4),
        'cv_accuracy_std':  round(cv_scores.std(), 4),
        'best_iteration':   int(model.best_iteration),
        'classes':          list(class_names),
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
    print("🚀 Starting Registration Forecaster Model Training\n")
    df = load_data()
    model, encoders, metrics = train(df)
    save_artifacts(model, encoders)
    print(f"\n🎉 Training complete!")
    print(f"   Accuracy: {metrics['accuracy']}")
    print(f"   F1 Score: {metrics['f1_score']}")