"""Command Line Interface entrypoint for training and running predictions."""

import argparse
import json
import logging
import sys
from pathlib import Path
import config
from dataset_builder import build_training_dataset, split_and_save_dataset
from predict import PlacementPredictor
from train_model import run_training_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (%(name)s) %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("placement_pipeline")


def load_json(file_path: Path):
    """Safely loads JSON content."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed loading JSON file '%s': %s", file_path, e)
        raise


def run_train(data_dir: Path) -> None:
    """Executes dataset assembly and model training."""
    logger.info("Executing training pipeline using data in %s", data_dir)
    students = load_json(data_dir / "students.json")
    jds = load_json(data_dir / "jds.json")
    labels = load_json(data_dir / "labels.json")

    df = build_training_dataset(students, jds, labels)
    train_df, val_df, test_df = split_and_save_dataset(df)
    run_training_pipeline(train_df, val_df, test_df)
    logger.info("Training pipeline finished successfully.")


def run_predict(student_file: Path, jd_file: Path, output_file: Path | None) -> None:
    """Executes batch or single placement inference."""
    logger.info("Running prediction inference...")
    student_data = load_json(student_file)
    jd_data = load_json(jd_file)

    predictor = PlacementPredictor()

    if isinstance(jd_data, list):
        result = predictor.predict_for_all_jds(student_data, jd_data)
    else:
        result = predictor.predict_placement_probability(student_data, jd_data)

    output_str = json.dumps(result, indent=2)

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(output_str)
        logger.info("Predictions saved to %s", output_file)
    else:
        print("\n" + output_str)


def main() -> None:
    """CLI Argument parser."""
    parser = argparse.ArgumentParser(description="Two-Stage Campus Placement Prediction Engine")
    subparsers = parser.add_subparsers(dest="mode", required=True)

    # Train CLI
    train_parser = subparsers.add_parser("train", help="Train and calibrate placement model")
    train_parser.add_argument("--data-dir", type=Path, default=config.DATA_DIR, help="Path to data directory")

    # Predict CLI
    predict_parser = subparsers.add_parser("predict", help="Generate placement predictions")
    predict_parser.add_argument("--student-file", type=Path, required=True, help="Path to student JSON")
    predict_parser.add_argument("--jd-file", type=Path, required=True, help="Path to JD JSON or list of JDs")
    predict_parser.add_argument("--output-file", type=Path, default=None, help="Optional output JSON path")

    args = parser.parse_args()

    if args.mode == "train":
        run_train(args.data_dir)
    elif args.mode == "predict":
        run_predict(args.student_file, args.jd_file, args.output_file)


if __name__ == "__main__":
    main()
