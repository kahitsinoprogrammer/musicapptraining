from flask import g, jsonify

def require_role(required_role):
    if not getattr(g, "user", None) or g.user["role"] != required_role:
        return jsonify(message="Forbidden: Access denied"), 403
