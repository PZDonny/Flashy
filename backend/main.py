import os
import re
import bcrypt
import similarity
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
from PIL import Image
from uuid import uuid4
import json

load_dotenv()

SECRET_KEY = os.getenv('JWT_SECRET_KEY')
DB_URI = os.getenv('SQLALCHEMY_DATABASE_URI')
DEBUG = os.getenv('DEBUG', 'False').lower()

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
IMAGE_FOLDER = 'images/'

os.makedirs(IMAGE_FOLDER, exist_ok=True)


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
    is_starred = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey('flashcard_set.id'), nullable=False)
    term = db.Column(db.String(255), nullable=False)
    definition = db.Column(db.String(255), nullable=False)
    is_exact = db.Column(db.Boolean, nullable=False, default=False)
    image_filename = db.Column(db.String(255), nullable=True)

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
    

    def save_image(file) -> str:
        def allowed_file(filename: str) -> bool:
            return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS
    
        MAX_IMAGE_SIZE = (200, 200)
        
        if file.filename == '':
            return None
        
        if not allowed_file(file.filename):
            return None
    
        image = Image.open(file)

        image = image.convert('RGB') #Gets rid of possible .png alpha
        image.thumbnail(MAX_IMAGE_SIZE)

        filename = f"{uuid4().hex}.jpg"
        image_path = os.path.join(IMAGE_FOLDER, filename)
        image.save(image_path)
        return filename

    def get_image_filenames(request) -> dict:
        image_filenames = {}
        for key in request.files.keys():
            if key.startswith("image_"):
                card_id = str(key.split("_", 1)[1])
                image = request.files[key]
                image_filename = save_image(image)
                image_filenames[card_id] = image_filename
        return image_filenames

    @app.route('/api/sets', methods=['GET', 'POST'])
    @jwt_required()
    def flashcard_sets():
        current_user = int(get_jwt_identity())
        if request.method == 'POST':
            title = request.form.get("title")
            description = request.form.get("description")
            cards_json = request.form.get("cards")
            cards = json.loads(cards_json)
            image_filenames = get_image_filenames(request)

            try:
                new_set = FlashcardSet(user_id=current_user, title=title, description=description)
                db.session.add(new_set)
                db.session.commit()

                db.session.flush()

                for card in cards:
                    image_filename = image_filenames.get(str(card.get("id")))
                    new_card = Flashcard(set_id=new_set.id, 
                                         term=card['term'], 
                                         definition=card['definition'], 
                                         is_exact=card.get('isExact', False),
                                         image_filename=image_filename or None)
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
                'description': s.description,
                'is_starred': s.is_starred
            } for s in sets]), 200
    
    @app.route('/api/sets/<int:id>', methods=['GET', 'PUT', 'DELETE', 'PATCH'])
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
                    'definition': c.definition,
                    'is_exact': c.is_exact,
                    'image_filename': c.image_filename
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
                
                return jsonify({'msg: Failed to delete set'}), 400

        elif request.method == 'PATCH':
            try:
                data = request.get_json()
                is_starred = data.get('is_starred')
                set.is_starred = is_starred
                db.session.commit()
                return jsonify({'msg': f'Set starred set to {is_starred}'}), 200
            except:
                return jsonify({'msg: Failed to update set starred'}), 400
            
        elif request.method == 'PUT':
            set.title = request.form.get("title", set.title)
            set.description = request.form.get("description", set.description)

            cards_data = request.form.get("cards", [])
            cards = json.loads(cards_data) if cards_data else []
            image_filenames = get_image_filenames(request)

            existing_cards = Flashcard.query.filter_by(set_id=id).all()
            existing_cards_dict = {card.id: card for card in existing_cards}

            for card_item in cards:
                app.logger.info(f"Processing card item: {card_item}")
                card_id = card_item.get('id')

                if card_id in existing_cards_dict: #Update Card
                    card = existing_cards_dict.pop(card_id) 
                    card.term = card_item.get('term', card.term)
                    card.definition = card_item.get('definition', card.definition)
                    card.is_exact = card_item.get('isExact', card.is_exact)
                    stringID = str(card_id)
                    if stringID in image_filenames:
                        app.logger.info(f"Updating image for card {card_id}: {image_filenames[stringID]}")
                        card.image_filename = image_filenames.get(stringID, card.image_filename)
                else: #New Card
                    new_card = Flashcard(
                        set_id=id,
                        term=card_item.get('term'),
                        definition=card_item.get('definition'),
                        is_exact=card_item.get('isExact', False),
                        image_filename=image_filenames.get(card_id, None)
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

        if card.is_exact:
            is_match = definition.strip().lower() == user_answer.strip().lower()
            if is_match:
                result = 'Correct'
                result_class = 'correct'
                score = 1.0
            else:
                result = 'Incorrect'
                result_class = 'incorrect' 
                score = -2.0
        else:
            result, score, result_class = similarity.is_similar(definition, user_answer)        
        return jsonify({
            'result_label': result,
            'score': score,
            'correct_answer': definition,
            'result_class': result_class
        }), 200

    @app.route('/images/<filename>', methods=['GET'])
    def get_image(filename):
        return send_from_directory(IMAGE_FOLDER, filename)
            


    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=DEBUG)