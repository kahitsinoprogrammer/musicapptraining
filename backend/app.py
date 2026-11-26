import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from models.db import init_database
from routes.auth_routes import auth_routes
from routes.song_routes import song_routes
from routes.upload_routes import upload_routes
from routes.event_routes import event_routes
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")




def create_app(): 
    app = Flask(__name__)

    app.config.update(
        JWT_SECRET=os.getenv("JWT_SECRET"),
        UPLOAD_FOLDER=str(BASE_DIR / "uploads"),
        MAX_CONTENT_LENGTH=100 * 1024 * 1024,
        DB_HOST=os.getenv("DB_HOST", "localhost"),
        DB_USER=os.getenv("DB_USER"),
        DB_PASSWORD=os.getenv("DB_PASSWORD"),
        DB_NAME=os.getenv("DB_NAME"),
    )

    Path(app.config["UPLOAD_FOLDER"]).mkdir(exist_ok=True)
    CORS(app)
    init_database(app.config)

    app.register_blueprint(auth_routes, url_prefix="/api/auth")
    app.register_blueprint(song_routes, url_prefix="/api/songs")
    app.register_blueprint(event_routes, url_prefix="/api/events")
    app.register_blueprint(upload_routes)   

    @app.errorhandler(413)
    def request_too_large(_error):
        return jsonify(message="Request is too large"), 413

    return app


app = create_app()

