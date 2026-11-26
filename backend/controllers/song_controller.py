import uuid
from pathlib import Path
from flask import current_app, g, jsonify, request
from mysql.connector import Error
from werkzeug.utils import secure_filename


from models.song_model import (
    create_song,
    get_all_songs,
    get_song_by_id,
    get_songs_by_artist_id,
    increment_play_count,

)


def _save_upload(file):
    filename = f"{uuid.uuid4().hex}-{secure_filename(file.filename)}"
    file.save(Path(current_app.config["UPLOAD_FOLDER"]) / filename)
    return f"/uploads/{filename}"

def upload_song():
    audio = request.files.get("audio")
    thumbnail = request.files.get("thumbnail")
    if not audio or Path(audio.filename).suffix.lower() != ".mp3":
        return jsonify(message="Only MP3 files are allowed"), 400

    try:
        audio_url = _save_upload(audio)
        thumbnail_url = _save_upload(thumbnail) if thumbnail and thumbnail.filename else None
        # Teaching: derive artist_id from the verified JWT, not from user-controlled form data.
        song_id = create_song(request.form.get("title"), g.user["id"], audio_url, thumbnail_url)
    except (Error, OSError):
        return jsonify(message="Upload failed"), 500
    return jsonify(message="Song uploaded", songId=song_id), 201


def list_all_songs():
    try:
        return jsonify(songs=get_all_songs())
    except Error:
        return jsonify(message="Failed to fetch songs"), 500

def list_artist_songs():
    try:
        return jsonify(songs=get_songs_by_artist_id(g.user["id"]))
    except Error:
        return jsonify(message="Failed to fetch artist songs"), 500


def get_song(song_id):
    try:
        song = get_song_by_id(song_id)
    except Error:
        return jsonify(message="Failed to fetch song"), 500
    if not song:
        return jsonify(message="Song not found"), 404
    if not can_access_song(g.user, song):
        return jsonify(message="Artists can only access their own songs."), 403
    return jsonify(song=song)


def can_access_song(user, song):
    return user.get("role") == "listener" or (
        user.get("role") == "artist" and user.get("id") == song["artist_id"]
    )



def play_song(song_id):
    try:
        song = get_song_by_id(song_id)
        if not song:
            return jsonify(message="Song not found"), 404
        if not can_access_song(g.user, song):
            return jsonify(message="Artists can only access their own songs."), 403
        if g.user["role"] != "listener":
            return jsonify(message="Artist preview; play not counted", counted=False)
        increment_play_count(song_id)
    except Error:
        return jsonify(message="Failed to record play"), 500
    return jsonify(message="Play recorded", counted=True)