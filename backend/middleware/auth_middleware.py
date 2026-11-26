import jwt
from flask import current_app, g, jsonify, request

def verify_request_token():
    # CORS preflight requests are sent by the browser without credentials.
    # Let Flask-CORS answer OPTIONS; the subsequent request is still authenticated.
    if request.method == "OPTIONS":
        return None

    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return jsonify(message="No token provided"), 401

    try:
        token = authorization.split(" ", 1)[1]
        decoded = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
        g.user = {"id": decoded["id"], "role": decoded["role"]}

    except (jwt.InvalidTokenError, KeyError):
        return jsonify(message="Invalid or expired token"), 403
