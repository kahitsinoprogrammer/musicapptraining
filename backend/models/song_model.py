from models.db import get_connection

def create_song(title, artist_id, audio_url, thumbnail):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO songs (title, artist_id, audio_url, thumbnail) VALUES (%s, %s, %s, %s)",
            (title, artist_id, audio_url, thumbnail),
        )
        connection.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        connection.close()


def get_all_songs():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT songs.id, songs.title, songs.audio_url, songs.play_count, "
            "users.name AS artist_name, songs.thumbnail FROM songs "
            "JOIN users ON songs.artist_id = users.id ORDER BY songs.id DESC"
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_songs_by_artist_id(artist_id):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM songs WHERE artist_id = %s ORDER BY id DESC", (artist_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_song_by_id(song_id):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM songs WHERE id = %s", (song_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()


def artist_owns_audio(artist_id, audio_url):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "SELECT id FROM songs WHERE artist_id = %s AND audio_url = %s LIMIT 1",
            (artist_id, audio_url),)
        return cursor.fetchone() is not None
    finally:
        cursor.close()
        connection.close()

def increment_play_count(song_id):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE songs SET play_count = play_count + 1 WHERE id = %s", (song_id,))
        connection.commit()
    finally:
        cursor.close()
        connection.close()