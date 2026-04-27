import utils.quiz.quizsession as quizsession
import utils.quiz.similarity as similarity
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case
from sqlalchemy.exc import IntegrityError
from utils.model_helper import card_json
from models import FlashcardSet, Quiz, Flashcard, QuizAnswer
from extensions import db

quiz_bp = Blueprint('quiz', __name__)


def get_weakest_term(last_quizzes):
    correct = func.sum(
        case((QuizAnswer.is_correct == True, 1), else_=0) #Get # of correct answers
    )

    total = func.count(QuizAnswer.id) #Get total # of attempts

    accuracy = correct / total

    result = (
        db.session.query(
            QuizAnswer.term.label("term"), #renamed for query result
            correct.label("correct"), #num correct
            total.label("total"), #total attempts
            accuracy.label("accuracy") #correctness ratio
        )
        .join(Quiz, Quiz.id == QuizAnswer.quiz_id) #Join to access quiz id
        .filter(Quiz.id.in_(last_quizzes))
        .group_by(QuizAnswer.term) #calculated by term, rather than by row
        .order_by(accuracy.asc()) #Sort by weakest first
        .first()
    )

    return result

@quiz_bp.route('/sets/<int:id>/quiz_history', methods=['GET'])
@jwt_required()
def quiz_history(id):
    current_user = int(get_jwt_identity())
    flashcard_set = FlashcardSet.query.filter_by(id=id).first()
    if not flashcard_set:
        return jsonify({'msg': 'Set not found'}), 404
    
    total_quizzes = Quiz.query.filter_by(
        set_id=id,
    ).count()

    history = (
        Quiz.query
            .filter_by(set_id=id)
            .order_by(Quiz.taken_at.desc())
            .limit(10)
            .all()
    )

    last_quiz_ids = [quiz.id for quiz in history]
    weaktest_term = get_weakest_term(last_quiz_ids)

    return jsonify({'quizzes': [
        {
            'id': quiz.id,
            'score': quiz.score,
            'total_questions': quiz.total_questions,
            'taken_at': quiz.taken_at
        }
        for quiz in history
    ], 
    'total_quizzes': total_quizzes,
    'weakest_term': weaktest_term.term if weaktest_term else None,
    }), 200

@quiz_bp.route('/quiz/<int:id>/answers')
@jwt_required()
def quiz_answers(id):
    current_user = int(get_jwt_identity())
    quiz = Quiz.query.filter_by(id=id).first()
    if not quiz:
        return jsonify({'msg': 'Quiz not found'}), 404
    
    answers = QuizAnswer.query.filter_by(quiz_id=id).all()


    answer_dicts = []
    for answer in answers:
        answer_json = {'id': answer.id,
                       'term': answer.term,
                       'correct_answer': answer.correct_answer,
                       'user_answer': answer.user_answer,
                       'is_correct': answer.is_correct}
        answer_dicts.append(answer_json)

    return jsonify(answer_dicts), 200
    


@quiz_bp.route('/quiz_session/start', methods=['GET'])
@jwt_required()
def start_quiz():
    current_user = int(get_jwt_identity())

    set_id = request.args.get('set_id')
    flashcard_set = FlashcardSet.query.filter_by(id=set_id).first()
    if not flashcard_set:
        return jsonify({'msg': 'Set not found'}), 404

    max_questions = request.args.get('max', default=10, type=int)
    
    quiz_session_id = quizsession.create_session(current_user, set_id)
    cards = (Flashcard.query
                .filter_by(set_id=set_id)
                .order_by(db.func.random())
                .limit(max_questions)
                .all())
    
    if not cards:
        return jsonify({'msg': 'Failed to get cards from set'}),

    return jsonify({
        'title': flashcard_set.title,
        'description': flashcard_set.description,
        'quiz_session_id': quiz_session_id,
        'cards': [card_json(c) for c in cards]
    }), 201

@quiz_bp.route('/quiz_session/<string:quiz_session_id>/answer', methods=['POST'])
@jwt_required()
def check_answer(quiz_session_id):
    current_user = int(get_jwt_identity())
    if not quizsession.is_user_session(quiz_session_id, current_user):
        return jsonify({
            'msg': 'User has no quiz under the given session id'
        }, 403)


    data = request.get_json()
    card_id = data.get('card_id')

    card = Flashcard.query.filter_by(id=card_id).first()
    if not card:
        return jsonify({'msg': 'Card not found'}), 404

    definition = card.definition
    user_answer = data.get('answer')

    if card.is_exact:
        result, score, result_class, correct = similarity.is_string(definition, user_answer)
    else:
        result, score, result_class, correct = similarity.is_semantic(definition, user_answer)

    
    quizsession.add_answer(quiz_session_id, card_id, user_answer, correct)


    return jsonify({
        'result_label': result,
        'score': score,
        'correct_answer': definition,
        'result_class': result_class
    }), 200


@quiz_bp.route('/quiz_session/<string:quiz_session_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_session_id):
    try:
        quiz: Quiz = quizsession.create_quiz_db_object(quiz_session_id)
        db.session.add(quiz)
        db.session.commit()

        quiz_id = quiz.id
        answers = quizsession.create_answer_db_objects(quiz_session_id, quiz_id)
        for answer in answers:
            db.session.add(answer)
        db.session.commit()
        quizsession.remove_session(quiz_session_id)

        return jsonify({
            'msg': 'Quiz submitted'
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Failed to submit quiz'}), 400