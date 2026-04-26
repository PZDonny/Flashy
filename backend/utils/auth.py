import bcrypt

def hash_password(password:str) -> str:
    hashed_pw = bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt(rounds=12)
    )
    return hashed_pw.decode('utf-8')
    
def check_password(password:str, hash:str) -> bool:
    return bcrypt.checkpw(
        password.encode('utf-8'), 
        hash.encode('utf-8')
    )