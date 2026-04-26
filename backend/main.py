from __future__ import annotations

import warnings
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.exceptions import InconsistentVersionWarning


ROOT = Path(__file__).resolve().parents[1]
MAIN_DATA_PATH = ROOT / "aquatrack_labeled.csv"
CONTEXT_DATA_PATH = ROOT / "context_data.csv"
CONTEXT_MODEL_PATH = ROOT / "models" / "artifacts" / "aquatrack_context_best_model.pkl"
CONTEXT_METADATA_PATH = ROOT / "models" / "artifacts" / "aquatrack_context_metadata.pkl"


class ChatRequest(BaseModel):
    message: str
    latestScore: float | None = None
    latestLabel: str | None = None
    system: str | None = None


def _to_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _score_from_payload(payload: dict[str, Any], medians: dict[str, float]) -> float:
    # Compute a simple robust risk score based on normalized distance from medians.
    deviations: list[float] = []
    for key, raw in payload.items():
        value = _to_float(raw)
        if value is None:
            continue
        median = medians.get(key)
        if median is None:
            continue
        baseline = max(abs(median), 1.0)
        deviations.append(abs(value - median) / baseline)

    if not deviations:
        return 0.0

    avg_dev = sum(deviations) / len(deviations)
    # Compress into [0, 1] with diminishing returns for extreme values.
    score = avg_dev / (1.0 + avg_dev)
    return max(0.0, min(1.0, round(score, 4)))


def _load_context_model() -> tuple[Any | None, dict[str, Any]]:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", InconsistentVersionWarning)
            model = joblib.load(CONTEXT_MODEL_PATH)
            metadata = joblib.load(CONTEXT_METADATA_PATH) if CONTEXT_METADATA_PATH.exists() else {}
        return model, metadata
    except Exception:
        return None, {}


def _context_medians(metadata: dict[str, Any]) -> dict[str, float]:
    training_medians = metadata.get("context_training_medians", {})
    return training_medians.get("train_medians", {}) or {}


def _first_number(payload: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = _to_float(payload.get(key))
        if value is not None:
            return value
    return None


def _average_numbers(payload: dict[str, Any], *keys: str) -> float | None:
    values = [_to_float(payload.get(key)) for key in keys]
    numbers = [value for value in values if value is not None]
    if not numbers:
        return None
    return sum(numbers) / len(numbers)


def _context_model_frame(payload: dict[str, Any], medians: dict[str, float]) -> pd.DataFrame:
    time_of_day = int(_first_number(payload, "Time_of_Day", "time_of_day") or medians.get("Time_of_Day", 2) or 2)
    impedance = _first_number(payload, "Impedance")
    if impedance is None:
        impedance = _average_numbers(payload, "Right_Arm", "Left_Arm", "Trunk", "Right_Leg", "Left_Leg")

    row = {
        "Electrical_Capacitance": _first_number(payload, "Electrical_Capacitance"),
        "Impedance": impedance,
        "Skin_Temperature": _first_number(payload, "Skin_Temperature", "skin_temperature"),
        "Skin_Conductance": _first_number(payload, "Skin_Conductance", "skin_conductance"),
        "Skin_Reflectance": _first_number(payload, "Skin_Reflectance"),
        "Color_Metrics": _first_number(payload, "Color_Metrics"),
        "TEWL": _first_number(payload, "TEWL", "tewl"),
        "Ambient_Humidity": _first_number(payload, "Ambient_Humidity", "ambient_humidity"),
        "Ambient_Temperature": _first_number(payload, "Ambient_Temperature", "ambient_temperature"),
        "Time_of_Day_2": 1.0 if time_of_day == 2 else 0.0,
        "Time_of_Day_3": 1.0 if time_of_day == 3 else 0.0,
    }
    return pd.DataFrame([row])


def _score_from_context_model(payload: dict[str, Any]) -> float | None:
    if CONTEXT_MODEL is None:
        return None

    frame = _context_model_frame(payload, CONTEXT_MODEL_MEDIANS)
    if hasattr(CONTEXT_MODEL, "predict_proba"):
        probabilities = CONTEXT_MODEL.predict_proba(frame)
        score = float(probabilities[0][1])
    else:
        score = float(CONTEXT_MODEL.predict(frame)[0])
    return max(0.0, min(1.0, round(score, 4)))


def _risk_label(score: float) -> str:
    if score >= 0.67:
        return "high"
    if score >= 0.34:
        return "moderate"
    return "low"


def _load_medians() -> dict[str, float]:
    medians: dict[str, float] = {}

    if MAIN_DATA_PATH.exists():
        main_df = pd.read_csv(MAIN_DATA_PATH)
        for col in main_df.columns:
            series = pd.to_numeric(main_df[col], errors="coerce")
            if series.notna().any():
                medians[col] = float(series.median())

    if CONTEXT_DATA_PATH.exists():
        context_df = pd.read_csv(CONTEXT_DATA_PATH)
        for col in context_df.columns:
            series = pd.to_numeric(context_df[col], errors="coerce")
            if series.notna().any():
                medians[col] = float(series.median())

    return medians


MEDIANS = _load_medians()
CONTEXT_MODEL, CONTEXT_METADATA = _load_context_model()
CONTEXT_MODEL_MEDIANS = _context_medians(CONTEXT_METADATA)

DEFAULT_MEDIANS = {
    "sweat_chloride": 55.0,
    "sweat_osmolality": 210.0,
    "salivary_osmolality": 140.0,
    "salivary_chloride": 20.0,
    "salivary_amylase": 70.0,
    "salivary_protein": 1.5,
    "salivary_cortisol": 9.0,
    "salivary_cortisone": 15.0,
    "salivary_potassium": 20.0,
    "running_speed": 6.0,
    "running_interval": 2.0,
    "total_body_water": 38.0,
    "inbody_weight": 68.0,
    "skin_temperature": 32.0,
    "skin_conductance": 12.0,
    "tewl": 16.0,
    "ambient_temperature": 24.0,
    "ambient_humidity": 50.0,
    "right_arm": 3.0,
    "left_arm": 3.0,
    "trunk": 25.0,
    "right_leg": 9.0,
    "left_leg": 9.0,
}


app = FastAPI(title="AquaTrack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/about")
def about() -> dict[str, str]:
    return {
        "model_version": "AquaTrack Local Baseline v1",
        "last_trained_date": "2026-04-23",
    }


@app.get("/medians")
def medians() -> dict[str, float]:
    merged = {**DEFAULT_MEDIANS, **{k.lower().replace(" ", "_"): v for k, v in MEDIANS.items()}}
    return merged


@app.post("/predict")
def predict(payload: dict[str, Any]) -> dict[str, Any]:
    score = _score_from_payload(payload, MEDIANS)
    return {"score": score, "label": _risk_label(score)}


@app.post("/predict-context")
def predict_context(payload: dict[str, Any]) -> dict[str, Any]:
    score = _score_from_context_model(payload)
    if score is None:
        context_medians = {**MEDIANS, **CONTEXT_MODEL_MEDIANS}
        score = _score_from_payload(payload, context_medians)
    return {"score": score, "label": _risk_label(score)}


@app.post("/chat")
def chat(req: ChatRequest) -> dict[str, str]:
    score_info = ""
    if req.latestScore is not None:
        score_info = f" Latest score: {req.latestScore:.2f} ({req.latestLabel or 'unknown'} risk)."
    guidance = (
        "Hydration tip: drink water regularly, add electrolytes after intense sweating, "
        "and monitor urine color and body weight changes."
    )
    return {"reply": f"{guidance}{score_info}"}
