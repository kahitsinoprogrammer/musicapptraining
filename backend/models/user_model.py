from models.db import get_connection

def create_user(name, email, hashed_password, role):
    # Teaching: %s placeholders keep user-provided data separate from SQL syntax.
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role),
        )
        connection.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        connection.close()


def find_user_by_email(email):
     connection = get_connection()
     cursor = connection.cursor(dictionary=True)
     try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
     finally:
        cursor.close()
        connection.close()


def replace_registration_otp(name, email, hashed_password, role, hashed_otp, expires_at):        
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM registration_otps WHERE email = %s", (email,))
        cursor.execute(
            "INSERT INTO registration_otps "
            "(name, email, password_hash, role, otp_hash, expires_at) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (name, email, hashed_password, role, hashed_otp, expires_at),
        )
        connection.commit()
    finally:
        cursor.close()
        connection.close()


def find_registration_otp(email):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM registration_otps WHERE email = %s ORDER BY id DESC LIMIT 1",
            (email,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()

def delete_registration_otp(email):
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM registration_otps WHERE email = %s", (email,))
        connection.commit()
    finally:
        cursor.close()
        connection.close()