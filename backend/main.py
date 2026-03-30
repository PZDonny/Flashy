import os
import re
import bcrypt
import similarity
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('JWT_SECRET_KEY')
DB_URI = os.getenv('SQLALCHEMY_DATABASE_URI')
DEBUG = os.getenv('DEBUG', 'False').lower()

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FlashcardSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey('flashcard_set.id'), nullable=False)
    term = db.Column(db.String(255), nullable=False)
    definition = db.Column(db.String(255), nullable=False)

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    set_id = db.Column(db.Integer, db.ForeignKey('flashcard_set.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    taken_at = db.Column(db.DateTime, default=datetime.utcnow)

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
    app.config['JWT_SECRET_KEY'] = SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    CORS(app)
    jwt = JWTManager(app)

    db.init_app(app)

    with app.app_context():        
        db.create_all()

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

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return jsonify({'msg': 'Username can only contain letters, numbers, and underscores'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'msg': 'Username already exists'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'msg': 'Email already exists'}), 400

        try:
            password_hash = hash_password(password)
            new_user = User(username=username, email=email, password_hash=password_hash)
            db.session.add(new_user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Failed to register user'}), 400

        return jsonify({'msg': 'User registered successfully'}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if user and check_password(password, user.password_hash):
            return jsonify({
                'msg': 'Login successful',
                'user': {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                },
                'token': create_access_token(identity=str(user.id))
                }), 200
        else:
            return jsonify({'msg': 'Invalid credentials'}), 401
    
    @app.route('/api/me', methods=['GET'])
    @jwt_required()
    def me():
        current_user = int(get_jwt_identity())
        user = User.query.filter_by(id=current_user).first()

        if not user:
            return jsonify({'msg': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email
        }), 200

    @app.route('/api/sets', methods=['GET', 'POST'])
    @jwt_required()
    def flashcard_sets():
        current_user = int(get_jwt_identity())
        if request.method == 'POST':
            data = request.get_json()
            title = data.get('title')
            description = data.get('description')
            cards = data.get('cards')

            try:
                new_set = FlashcardSet(user_id=current_user, title=title, description=description)
                db.session.add(new_set)
                db.session.commit()

                db.session.flush()

                for card in cards:
                    new_card = Flashcard(set_id=new_set.id, term=card['term'], definition=card['definition'])
                    db.session.add(new_card)
                db.session.commit()
                return jsonify({'msg': 'Flashcard set created successfully'}), 201
            
            except IntegrityError as e:
                db.session.rollback()
                return jsonify({'msg': 'Failed to create new flashcard set'}), 400
    
        else:
            sets = FlashcardSet.query.filter_by(user_id=current_user).all()
            return jsonify([{
                'id': s.id,
                'title': s.title,
                'description': s.description
            } for s in sets]), 200
    
    @app.route('/api/sets/<int:id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required(optional=True)
    def flashcard_set(id):
        set = FlashcardSet.query.filter_by(id=id).first()

        if not set:
            return jsonify({"msg": "Set not found"}), 404
        
        
        if request.method == 'GET':
            cards = Flashcard.query.filter_by(set_id=id).all()
            return jsonify({
                'title': set.title,
                'description': set.description,
                'cards': [{
                    'id': c.id,
                    'term': c.term,
                    'definition': c.definition
                } for c in cards]
            }), 200

        verify_jwt_in_request()
        current_user = int(get_jwt_identity())
        if set.user_id != current_user:
            return jsonify({'msg': 'Invalid user'}), 401
        

        if request.method == 'DELETE':    
            try:
                db.session.delete(set)
                db.session.commit()
                db.session.flush()
                
                cards = Flashcard.query.filter_by(set_id=id).all()
                if cards:
                    for card in cards:
                        db.session.delete(card)
                    db.session.commit()
                return jsonify({'msg': 'Set successfully deleted'}), 204
            except :
                pass
            
        elif request.method == 'PUT':
            data = request.get_json()
            set.title = data.get('title', set.title)
            set.description = data.get('description', set.description)

            cards_data = data.get('cards', [])
            existing_cards = Flashcard.query.filter_by(set_id=id).all()
            existing_cards_dict = {card.id: card for card in existing_cards}

            for card_item in cards_data:
                card_id = card_item.get('id')
                
                #Update card
                if card_id in existing_cards_dict:
                    card = existing_cards_dict.pop(card_id) 
                    card.term = card_item.get('term', card.term)
                    card.definition = card_item.get('definition', card.definition)
                
                #Add New Card
                else:
                    new_card = Flashcard(
                        set_id=id,
                        term=card_item.get('term'),
                        definition=card_item.get('definition')
                    )
                    db.session.add(new_card)

            #Cards that should no longer exist
            for card_to_delete in existing_cards_dict.values():
                db.session.delete(card_to_delete)

            db.session.commit()
            return jsonify({'msg': 'Set updated successfully'}), 200

    @app.route('/api/sets/<int:id>/quiz', methods=['POST'])
    @jwt_required(optional=True)
    def quiz(id):
        pass

    @app.route('/api/check_answer', methods=['POST'])
    @jwt_required()
    def check_answer():
        data = request.get_json()
        card_id = data.get('card_id')

        card = Flashcard.query.filter_by(id=card_id).first()
        if not card:
            return jsonify({'msg': 'Card not found'}), 404

        definition = card.definition
        user_answer = data.get('answer')
        is_exact = data.get('is_exact', False)

        if is_exact:
            result = definition.strip().lower() == user_answer.strip().lower()
            score = 1.0 if result else 0.0
        else:
            result, score = similarity.is_similar(definition, user_answer)        
        return jsonify({
            'result': result, 
            'score': round(score*100, 2),
            'correct_answer': definition
        }), 200




    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=DEBUG)