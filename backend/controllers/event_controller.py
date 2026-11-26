from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
import uuid

from flask import current_app, g, jsonify, request
from mysql.connector import Error
from werkzeug.utils import secure_filename
from models.event_model import create_event, list_events, import_events


def today_singapore():
    return datetime.now(timezone(timedelta(hours=8))).date()

def event_data(data):
    title = str(data.get("title", "")).strip()
    venue = str(data.get("venue", "")).strip()
    description = str(data.get("description", "")).strip()

    if not title or not venue:
        raise ValueError("Title and venue are required.")

    try:
        event_date = date.fromisoformat(str(data.get("event_date", ""))) 
        price = Decimal(str(data.get("ticket_price", "0") or "0"))
    except Exception:
        raise ValueError("Use a valid date and price.")

    if event_date < today_singapore() or not price.is_finite() or price < 0:
        raise ValueError("Use a future date and a non-negative price.")

    return title, venue, event_date, description, price


def save_poster(poster):
    if not poster or Path(poster.filename).suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise ValueError("Upload a JPG, PNG, or WebP poster.")
    
    filename = f"{uuid.uuid4().hex}-{secure_filename(poster.filename)}"
    path = Path(current_app.config["UPLOAD_FOLDER"]) / filename
    poster.save(path)
    return path, f"/uploads/{filename}"



def post_event():
    try:
        title, venue, event_date, description, price = event_data(request.form)
        poster_path, poster_url = save_poster(request.files.get("poster"))
    except ValueError as error:
        return jsonify(message=str(error)), 400

    try:
        event_id = create_event(g.user["id"], title, venue, event_date, description, price, poster_url)
    except Error:
        poster_path.unlink(missing_ok=True)
        return jsonify(message="Unable to create event"), 500
    return jsonify(message="Event created", eventId=event_id), 201

def get_events():
    try:
        if g.user["role"] == "artist":
            return jsonify(events=list_events(artist_id=g.user["id"]))
        return jsonify(events=list_events(today=today_singapore()))
    except Error:
        return jsonify(message="Unable to load events"), 500

def import_event_rows():
    payload = request.get_json(silent=True)
    rows = payload.get("events") if isinstance(payload, dict) else None
    if not isinstance(rows, list) or not 1 <= len(rows) <= 200:
        return jsonify(message="Import between 1 and 200 events at a time."), 400

    validated = [] 
    errors = []
    for index, row in enumerate(rows, start=2):
        try:
            if not isinstance(row, dict):
                raise ValueError("Invalid row.")
            validated.append(event_data(row))
        except ValueError as error:
            errors.append(f"Row {index}: {error}")

    if errors:
        return jsonify(message="No events imported. Correct these rows and upload again.", errors=errors), 400

    try:
        import_events(g.user["id"], validated)
    except Error:
        return jsonify(message="Unable to import events. No events were saved."), 500
    return jsonify(message=f"{len(validated)} events imported successfully.", imported=len(validated)), 201