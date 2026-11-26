from flask import Blueprint
from controllers.auth_controller import register_user, verify_registration_otp, login_user

auth_routes = Blueprint("auth", __name__)

auth_routes.post("/register")(register_user)
auth_routes.post("/verify-registration")(verify_registration_otp)
auth_routes.post("/login")(login_user)
