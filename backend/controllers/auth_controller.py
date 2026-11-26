from datetime import datetime, timedelta, timezone
from html import escape
import json
import os
import secrets
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest, urlopen
import bcrypt
import jwt
from flask import current_app, jsonify, request
from mysql.connector import Error

from models.user_model import (
    create_user,
    delete_registration_otp,
    find_registration_otp,
    find_user_by_email,
    replace_registration_otp,
)



def _otp_expiry():
    try:
        expires_minutes = int(os.getenv("EMAIL_VERIFICATION_OTP_EXPIRES_MINUTES", "5"))
    except ValueError:
        expires_minutes = 5
    return expires_minutes, datetime.utcnow() + timedelta(minutes=expires_minutes)


def _send_registration_otp(email, name, otp, expires_minutes):
    api_key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("RESEND_FROM_EMAIL")
    if not api_key or not sender:
        raise RuntimeError("Email service is not configured")

    body = json.dumps(
        {
            "from": sender,
            "to": [email],
            "subject": "Verify your MusicApp account",
            "html": (
                f"<p>Hello {escape(name)},</p>"
                f"<p>Your verification code is <strong>{otp}</strong>.</p>"
                f"<p>This code expires in {expires_minutes} minutes.</p>"
            ),
        }
    ).encode("utf-8")
    request_to_resend = UrlRequest(
        "https://api.resend.com/emails",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "MusicApp-OTP/1.0",
        },
        method="POST",
    )
    with urlopen(request_to_resend, timeout=10):
        pass



def _create_token(user_id, role, name=None):
    payload = {
        "id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
    }
    if name is not None:
        payload["name"] = name
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")



def register_user():
    payload = request.get_json(silent=True) or {}

    name = payload.get("name")
    email = payload.get("email")
    password = payload.get("password")
    role = payload.get("role")

   

    if not all((name, email, password, role)):
      return jsonify(message="All fields are required"), 400

    if role not in {"artist", "listener"}:
        return jsonify(message="Role must be artist or listener"), 400

    name = name.strip()
    email = email.strip().lower()
    if not name or not email:
        return jsonify(message="All fields are required"), 400

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    otp = f"{secrets.randbelow(1_000_000):06d}"
    hashed_otp = bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()
    expires_minutes, expires_at = _otp_expiry()

    try:
        if find_user_by_email(email):
            return jsonify(message="An account with this email already exists"), 409
        replace_registration_otp(name, email, hashed_password, role, hashed_otp, expires_at)
        _send_registration_otp(email, name, otp, expires_minutes)
   
   
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        current_app.logger.warning("Resend rejected OTP delivery for %s: %s", email, details)
        try:
            delete_registration_otp(email)
        except Error:
            pass
        return jsonify(message="Unable to send verification code. Please try again."), 502
    except (URLError, TimeoutError, RuntimeError) as error:
        current_app.logger.warning("Unable to deliver OTP for %s: %s", email, error)
        try:
            delete_registration_otp(email)
        except Error:
            pass
        return jsonify(message="Unable to send verification code. Please try again."), 502
 
 
    except Error:
        current_app.logger.exception("Could not start registration for %s", email)
        return jsonify(message="Registration could not be started"), 500
    return jsonify(message="Verification code sent to your email"), 200

def verify_registration_otp():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    otp = (payload.get("otp") or "").strip()

    if not email or not otp:
        return jsonify(message="Email and verification code are required"), 400

    try:
        pending_registration = find_registration_otp(email)
        if not pending_registration:
            return jsonify(message="No pending registration was found"), 400
        if pending_registration["expires_at"] < datetime.utcnow():
            delete_registration_otp(email)
            return jsonify(message="Verification code has expired. Please register again."), 400
        if not bcrypt.checkpw(otp.encode(), pending_registration["otp_hash"].encode()):
            return jsonify(message="Invalid verification code"), 400
        if find_user_by_email(email):
            delete_registration_otp(email)
            return jsonify(message="An account with this email already exists"), 409

        user_id = create_user(
            pending_registration["name"],
            email,
            pending_registration["password_hash"],
            pending_registration["role"],
        )
        delete_registration_otp(email)
    except Error:
        return jsonify(message="Verification failed"), 500

    return jsonify(token=_create_token(user_id, pending_registration["role"], pending_registration["name"])), 201

def login_user():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    try:
        user = find_user_by_email(email)
        if not user:
            pending_registration = find_registration_otp(email)
            if pending_registration:
                if not bcrypt.checkpw(
                    (payload.get("password") or "").encode(),
                    pending_registration["password_hash"].encode(),
                ):
                    return jsonify(message="Invalid credentials"), 401

                otp = f"{secrets.randbelow(1_000_000):06d}"
                hashed_otp = bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()
                expires_minutes, expires_at = _otp_expiry()
                replace_registration_otp(
                    pending_registration["name"],
                    email,
                    pending_registration["password_hash"],
                    pending_registration["role"],
                    hashed_otp,
                    expires_at,
                )
                _send_registration_otp(email, pending_registration["name"], otp, expires_minutes)
                return jsonify(
                    message="A new verification code was sent to your email",
                    pendingVerification=True,
                    email=email,
                ), 403
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        current_app.logger.warning("Resend rejected replacement OTP for %s: %s", email, details)
        return jsonify(message="Unable to send verification code. Please try again."), 502
    except (URLError, TimeoutError, RuntimeError) as error:
        current_app.logger.warning("Unable to deliver replacement OTP for %s: %s", email, error)
        return jsonify(message="Unable to send verification code. Please try again."), 502
    except Error:
        return jsonify(message="Login failed"), 500

    if not user:
        return jsonify(message="User not found"), 400
    if not bcrypt.checkpw((payload.get("password") or "").encode(), user["password"].encode()):
        return jsonify(message="Invalid credentials"), 401
    return jsonify(token=_create_token(user["id"], user["role"], user["name"]))
