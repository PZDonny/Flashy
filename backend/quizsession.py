from uuid import uuid4
from main import Quiz, QuizAnswer, Flashcard
from datetime import datetime
import redis_client
import json

TTL = 1800 # 39 min


def get_redis_key(session_id):
    return f'quiz:{session_id}'

def get_session(session_id):
    data = redis_client.client.get(get_redis_key(session_id))
    if not data:
        return None
    return json.loads(data)

def create_session(user_id, set_id) -> str:
    """
    Create a quiz session when a user begins a quiz
    """
    session_id = str(uuid4())

    session_data = {
        "user_id": user_id,
        "set_id": set_id,
        "start_time": datetime.utcnow().isoformat(),
        "answers": {}
    }

    redis_client.client.setex(
        get_redis_key(session_id),
        TTL,
        json.dumps(session_data)
    )

    return session_id

def is_user_session(session_id, user_id):
    """
    Check if the given session applies to the user
    """
    session = get_session(session_id)
    if not session:
        return False
    return session["user_id"] == user_id
    

def add_answer(session_id, card_id, user_answer, is_correct):
    key = get_redis_key(session_id)

    data = redis_client.client.get(key)
    if not data:
        return

    session = json.loads(data)

    session["answers"][str(card_id)] = {
        "user_answer": user_answer,
        "is_correct": is_correct
    }

    #Refresh TTL in redis
    redis_client.client.setex(key, TTL, json.dumps(session))

def create_quiz_db_object(session_id) -> Quiz:
    session = get_session(session_id)
    if not session:
        return None
    
    score = sum(
        1 for a in session['answers'].values()
        if a['is_correct']
    )

    return Quiz(
        set_id = session['set_id'],
        score = score,
        total_questions = len(session['answers']),
        taken_at = datetime.fromisoformat(session['start_time'])
    )
    

def create_answer_db_objects(session_id, quiz_id) -> list:
    session = get_session(session_id)
    if not session:
        return None
    
    lyst = list()

    for card_id, answer in session['answers'].items():
        lyst.append(
            QuizAnswer(
                quiz_id = quiz_id,
                card_id = int(card_id),
                user_answer = answer['user_answer'],
                is_correct = answer['is_correct']
            )
        )

    return lyst

def remove_session(session_id):
    redis_client.client.delete(get_redis_key(session_id))