from flask import Blueprint, request
from controllers.event_controller import get_events, post_event, import_event_rows
from middleware.auth_middleware import verify_request_token
from middleware.role_middleware import require_role

event_routes = Blueprint("events", __name__)
event_routes.before_request(verify_request_token)


@event_routes.before_request
def verify_event_role():
    if request.method == "OPTIONS":
        return None
    if request.endpoint == "events.get_events":
        return require_role("listener")

    if request.endpoint in {
        "events.artist_events",
        "events.post_event",
        "events.import_event_rows",
    }:
        return require_role("artist")

event_routes.get("")(get_events)
event_routes.get("/artist-events", endpoint="artist_events")(get_events)
event_routes.post("")(post_event)
event_routes.post("/import")(import_event_rows)
