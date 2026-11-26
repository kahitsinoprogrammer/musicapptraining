from pathlib import Path

import jwt
from flask import Blueprint, current_app, jsonify, request, send_from_directory
from models.song_model import artist_owns_audio

upload_routes = Blueprint("uploads", __name__)

@upload_routes.get("/uploads/<path:filename>")
def uploaded_file(filename):
    if Path(filename).suffix.lower() != ".mp3":
        return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)

    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        user = jwt.decode(
            token,
            current_app.config["JWT_SECRET"],
            algorithms=["HS256"],
        )
    except jwt.InvalidTokenError:
        return jsonify(message="Please log in to play this song"), 401

    if user["role"] == "listener":
        return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)

    if user["role"] == "artist":
        if artist_owns_audio(user["id"], f"/uploads/{filename}"):
            return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)

        return jsonify(message="You can only play your own songs"), 403

    return jsonify(message="Access denied"), 403