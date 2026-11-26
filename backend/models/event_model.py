from models.db import get_connection

def create_event(artist_id, title, venue, event_date, description, ticket_price, poster_url):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO events (artist_id, title, venue, event_date, description, ticket_price, poster_url) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (artist_id, title, venue, event_date, description, ticket_price, poster_url),
        )
        connection.commit()
        return cursor.lastrowid
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


def list_events(artist_id=None, today=None):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        query = "SELECT events.*, users.name AS artist_name FROM events JOIN users ON users.id = events.artist_id"
        if artist_id is not None:
            query += " WHERE events.artist_id = %s ORDER BY event_date DESC, events.id DESC"
            params = (artist_id,)
        else:
            query += " WHERE events.event_date >= %s ORDER BY event_date ASC, events.id ASC"
            params = (today,)
        cursor.execute(query, params)
        events = cursor.fetchall()
        for event in events:
            event["event_date"] = event["event_date"].isoformat()
            event["ticket_price"] = str(event["ticket_price"])
        return events
    finally:
        cursor.close()
        connection.close()



def import_events(artist_id, events):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.executemany(
            "INSERT INTO events (artist_id, title, venue, event_date, description, ticket_price, poster_url) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            [(artist_id, *event, "") for event in events],
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()
