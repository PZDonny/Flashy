import redis

client = None

def start(port):
    global client 
    client = redis.Redis(
        host="localhost",
        port=port,
        decode_responses=True
    )
    
    client.ping()