from flask import Blueprint, request

from controllers.song_controller import (
    get_song,
    list_all_songs,
    list_artist_songs,
    play_song,
    upload_song,
)

from middleware.auth_middleware import verify_request_token
from middleware.role_middleware import require_role

song_routes = Blueprint("songs", __name__)

song_routes.before_request(verify_request_token)

@song_routes.before_request
def verify_song_role():
    if request.method == "OPTIONS":
        return None

    if request.endpoint == "songs.list_all_songs":
        return require_role("listener")

    if request.endpoint in {"songs.upload_song", "songs.list_artist_songs"}:
        return require_role("artist")

song_routes.get("/", strict_slashes=False)(list_all_songs)
song_routes.post("/upload")(upload_song)
song_routes.get("/artist-songs")(list_artist_songs)
song_routes.get("/<int:song_id>")(get_song)
song_routes.patch("/<int:song_id>/play")(play_song)
