from mysql.connector import pooling

_pool = None

def init_database(config):
    global _pool
    _pool = pooling.MySQLConnectionPool(
        pool_name="music_api_pool",
        pool_size=5,
        host=config["DB_HOST"],
       user=config["DB_USER"],
        password=config["DB_PASSWORD"],
        database=config["DB_NAME"],
    )



def get_connection():
    if _pool is None:
        raise RuntimeError("Database pool has not been initialized")
    return _pool.get_connection()