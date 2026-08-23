# Two-Stage Campus Placement Prediction & Recommendation Engine 🎓🚀

An AI/ML-powered two-stage placement prediction pipeline that estimates student placement probability against specific Job Descriptions (JDs), identifies missing skill gaps, and explains predictions using SHAP (Explainable AI).

---

## 📌 Architecture Overview

```text
[Student Profile] + [Job Description (JD)]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│  Stage 0: Strict Eligibility Gate                      │
│  - CGPA cutoff, active backlogs, branch & degree match │
│  (Short-circuits to 0% with reason if failed)          │
└──────────────────┬─────────────────────────────────────┘
                   │ Pass
                   ▼
┌────────────────────────────────────────────────────────┐
│  Stage 1: NLP Semantic Matching (Sentence Embeddings)  │
│  - SentenceTransformer ('all-MiniLM-L6-v2')            │
│  - Exact & Fuzzy Must-have & Good-to-have skill match  │
│  - Dense Semantic Cosine Similarity Score              │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│  Stage 2: Tuned XGBoost Classifier + Calibration       │
│  - 78+ Features & Domain Interaction Multipliers       │
│  - Sigmoid Probability Calibration                     │
│  - SHAP TreeExplainer for Top Contributing Factors     │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
[Ranked Companies + Placement Probability + Skill Gaps + Top SHAP Factors]
```

---

## 📊 Model Performance

- **ROC-AUC**: `0.9885`
- **Accuracy**: `94.00%`
- **F1-Score**: `0.9048`
- **Precision**: `87.69%`
- **Recall**: `93.44%`
- **Brier Score (Calibration)**: `0.0432`

---

## 📁 Repository Structure

```text
├── config.py                      # Centralized constants, paths, and skill synonyms
├── feature_engineering.py         # Student (~52 features) and JD schema extraction
├── jd_matching.py                 # Stage 1 semantic embeddings & eligibility gate
├── dataset_builder.py             # Feature merger & 70/15/15 stratified split
├── train_model.py                 # Stage 2 XGBoost tuning, calibration & SHAP
├── predict.py                     # Single & batch inference engine
├── main.py                        # CLI entry point (--mode train / --mode predict)
├── generate_data.py               # Synthetic 1,000 students & 4,000 labeled pairs generator
├── requirements.txt               # Pinned Python dependencies
├── .gitignore                     # Git ignore rules
├── data/                          # Datasets (students.json, jds.json, labels.json)
├── tests/                         # Pytest unit test suite
└── artifacts/                     # Serialized models, calibrator, reports, SHAP plots
```

---

## 🚀 Quickstart Guide

### 1. Setup Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Unit Tests
```bash
python3 -m pytest tests/test_pipeline.py -v
```

### 3. Generate Data (Optional)
```bash
python3 generate_data.py
```

### 4. Train Model
```bash
python3 main.py train --data-dir ./data
```

### 5. Run Live Inference
```bash
python3 main.py predict --student-file data/sample_student.json --jd-file data/jds.json
```
