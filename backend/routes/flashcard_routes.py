import services.flashcard_service as service
import json
import hashlib
from flask import Blueprint, request, jsonify, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import Flashcard, FlashcardSet
from utils import image_helper
from utils.model_helper import card_json
from extensions import db

flashcard_bp = Blueprint('flashcard', __name__)

@flashcard_bp.route('/sets', methods=['GET', 'POST'])
@jwt_required()
def flashcard_sets():
    current_user = int(get_jwt_identity())
    if request.method == 'POST':
        title = request.form.get("title")
        description = request.form.get("description")
        cards_json = request.form.get("cards")
        cards = json.loads(cards_json)
        image_bytes_dict, errors = image_helper.get_image_bytes_dict(request)

        if errors:
            return jsonify({
                "msg": "Image validation failed",
                "errors": errors 
            }), 400

        return service.create_set(current_user, title, description, cards, image_bytes_dict)
    else:
        sets = FlashcardSet.query.filter_by(user_id=current_user).all()
        return jsonify([{
            'id': s.id,
            'title': s.title,
            'description': s.description,
            'is_starred': s.is_starred
        } for s in sets]), 200
    


@flashcard_bp.route('/sets/<int:id>/info', methods=['GET'])
@jwt_required(optional=True)
def flashcard_set_info(id):
    flashcard_set = FlashcardSet.query.filter_by(id=id).first()

    if not flashcard_set:
        return jsonify({"msg": "Set not found"}), 404
    
    return jsonify({
            'title': flashcard_set.title,
            'cards_total': Flashcard.query.filter_by(set_id=id).count()
    }), 200

@flashcard_bp.route('/sets/<int:id>', methods=['GET', 'PUT', 'DELETE', 'PATCH'])
@jwt_required(optional=True)
def flashcard_set(id):
    flashcard_set = FlashcardSet.query.filter_by(id=id).first()

    if not flashcard_set:
        return jsonify({"msg": "Set not found"}), 404
    
    if request.method == 'GET':
        cards = Flashcard.query.filter_by(set_id=id).all()
        return jsonify({
            'title': flashcard_set.title,
            'description': flashcard_set.description,
            'cards': [card_json(c) for c in cards]
        }), 200

    verify_jwt_in_request()
    current_user = int(get_jwt_identity())
    if flashcard_set.user_id != current_user:
        return jsonify({'msg': 'Invalid user'}), 401
    

    if request.method == 'DELETE':    
        try:
            db.session.delete(flashcard_set)
            db.session.commit()
            db.session.flush()
            
            cards = Flashcard.query.filter_by(set_id=id).all()
            if cards:
                for card in cards:
                    db.session.delete(card)
                db.session.commit()
            return jsonify({'msg': 'Set successfully deleted'}), 204
        except :
            return jsonify({'msg': 'Failed to delete set'}), 400
        
    elif request.method == 'PUT': #Set Edited
        title = request.form.get("title", flashcard_set.title)
        description = request.form.get("description", flashcard_set.description)
        cards_data = request.form.get("cards", [])
        cards = json.loads(cards_data) if cards_data else []
        image_bytes_dict, errors = image_helper.get_image_bytes_dict(request)

        current_app.logger.info(request.files)

        if errors:
            return jsonify({
                "msg": "Image validation failed",
                "errors": errors 
            }), 400

        return service.update_set(flashcard_set, title, description, cards, image_bytes_dict)        

    elif request.method == 'PATCH': #Starring set
        try:
            data = request.get_json()
            is_starred = data.get('is_starred')
            flashcard_set.is_starred = is_starred
            db.session.commit()
            return jsonify({'msg': f'Set starred set to {is_starred}'}), 200
        except:
            return jsonify({'msg': 'Failed to update set starred'}), 400
        
    

@flashcard_bp.route('/flashcards/<int:id>/image', methods=['GET'])
def get_image(id):
    card = Flashcard.query.filter_by(id=id).first()
    if not card or not card.image:
        return jsonify({'msg': 'Image not found'}), 404
    
    etag = hashlib.md5(card.image).hexdigest() #image's hash
    
    #client already has image & image didn't change
    if request.headers.get("If-None-Match") == etag: 
        return '', 304

    response = Response(card.image)
    response.mimetype = 'image/jpeg'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['ETag'] = etag

    return response