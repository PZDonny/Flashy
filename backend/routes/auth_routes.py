import re
import utils.auth as auth
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    confirm_pw = data.get('confirmPassword')

    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return jsonify({'msg': 'Username can only contain letters, numbers, and underscores'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'Email already exists'}), 400
    
    if password != confirm_pw:
        return jsonify({'msg': 'Passwords do not match'}), 400

    try:
        password_hash = auth.hash_password(password)
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Failed to register user'}), 400

    return jsonify({'msg': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and auth.check_password(password, user.password_hash):
        return jsonify({
            'msg': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'token': create_access_token(identity=str(user.id))
            }), 200
    else:
        return jsonify({'msg': 'Invalid credentials'}), 401
    
@auth_bp.route('/me', methods=['GET'])
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