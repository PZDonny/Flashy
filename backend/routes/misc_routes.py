from flask import Blueprint, request, jsonify, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import User, Quiz, FlashcardSet
from datetime import date, datetime, timedelta

misc_bp = Blueprint('misc', __name__)


def get_total_sets(user_id):
    """
    Get the total number of FlashcardSets a user has created
    """
    return FlashcardSet.query.filter_by(user_id=user_id).count()

def quizzes_today(user_id):
    """
    Get the number of quizzes a user has taken today
    """
    midnight = datetime.combine(date.today(), datetime.min.time())

    return Quiz.query.filter(
        Quiz.user_id == user_id,
        Quiz.taken_at >= midnight
    ).count()

from datetime import date, timedelta

def get_quiz_streak(user_id):
    """
    Get the number of days in a row that a user has taken atleast one quiz
    """
    quizzes = (
        Quiz.query
        .filter_by(user_id=user_id)
        .order_by(Quiz.taken_at.desc())
        .all()
    )

    if not quizzes:
        return 0

    quiz_dates = {
        q.taken_at.date() for q in quizzes
    }

    today = date.today()
    streak = 0

    while True:
        checked_date = today - timedelta(days=streak)
        if checked_date in quiz_dates:
            streak += 1
        else:
            break

    return streak

@misc_bp.route('/analytics')
@jwt_required()
def get_analytics():
    current_user = int(get_jwt_identity())

    user = User.query.filter_by(id=current_user).first()

    if not user:
        return jsonify({'msg': 'User not found'}), 404
    
    return jsonify({
        'quizzes_today': quizzes_today(user.id),
        'total_sets': get_total_sets(user.id),
        'quiz_streak': get_quiz_streak(user.id),
    }), 200
