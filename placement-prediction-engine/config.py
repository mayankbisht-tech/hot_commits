"""Configuration module containing constants, file paths, and default hyperparameters."""

from pathlib import Path
from typing import Dict, List

# ==========================================
# File System & Artifact Paths
# ==========================================
BASE_DIR: Path = Path(__file__).resolve().parent
DATA_DIR: Path = BASE_DIR / "data"
ARTIFACTS_DIR: Path = BASE_DIR / "artifacts"

DATA_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

STUDENTS_DATA_PATH: Path = DATA_DIR / "students.json"
JDS_DATA_PATH: Path = DATA_DIR / "jds.json"
LABELS_DATA_PATH: Path = DATA_DIR / "labels.json"
PROCESSED_DATA_PATH: Path = ARTIFACTS_DIR / "processed_features.parquet"

MODEL_PATH: Path = ARTIFACTS_DIR / "placement_model.pkl"
CALIBRATOR_PATH: Path = ARTIFACTS_DIR / "calibrator.pkl"
EXPLAINER_PATH: Path = ARTIFACTS_DIR / "shap_explainer.pkl"
TRAINING_REPORT_PATH: Path = ARTIFACTS_DIR / "training_report.json"
SHAP_SUMMARY_PLOT_PATH: Path = ARTIFACTS_DIR / "shap_summary.png"
SHAP_BAR_PLOT_PATH: Path = ARTIFACTS_DIR / "shap_importance.png"

# ==========================================
# Stage 1: Embedding & Skill Matching Constants
# ==========================================
EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
SKILL_MATCH_THRESHOLD: float = 0.65

SKILL_SYNONYMS: Dict[str, str] = {
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node": "node.js",
    "golang": "go",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "sklearn": "scikit-learn",
    "scikitlearn": "scikit-learn",
    "tf": "tensorflow",
    "fast-api": "fastapi",
    "spring-boot": "spring boot",
    "springboot": "spring boot",
    "aws cloud": "aws",
    "gcp cloud": "gcp",
    "azure cloud": "azure",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "cpp": "c++",
}

# ==========================================
# Feature Imputation & Schema Defaults
# ==========================================
DEFAULT_CODEFORCES_RATING: float = 1000.0
DEFAULT_MIN_CGPA: float = 6.0
DEFAULT_MAX_BACKLOGS: int = 0

CATEGORICAL_COLUMNS: List[str] = [
    "degree_type",
    "branch",
    "role_category",
    "sector",
    "company_size",
]

TARGET_COLUMN: str = "placed"

# ==========================================
# Train / Val / Test Split & Optimization
# ==========================================
RANDOM_SEED: int = 42
TRAIN_SPLIT_SIZE: float = 0.70
VAL_SPLIT_SIZE: float = 0.15
TEST_SPLIT_SIZE: float = 0.15
CV_FOLDS: int = 5
HYPERPARAM_SEARCH_ITERATIONS: int = 25
