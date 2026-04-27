from models import Flashcard, FlashcardSet
from flask import jsonify, current_app
from sqlalchemy.exc import IntegrityError
from extensions import db

def create_set(user_id, title, description, cards, image_bytes_dict):
    try:
        new_set = FlashcardSet(user_id=user_id, title=title, description=description)
        db.session.add(new_set)
        db.session.commit()

        db.session.flush()

        for index, card in enumerate(cards):
            image_bytes = image_bytes_dict.get(str(card.get('id')))
            new_card = Flashcard(set_id=new_set.id, 
                                term=card['term'], 
                                definition=card['definition'], 
                                is_exact=card.get('isExact', False),
                                image=image_bytes,
                                order=index
                                )
            db.session.add(new_card)
        db.session.commit()
        return jsonify({'msg': 'Flashcard set created successfully'}), 201
    
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to create new flashcard set'}), 400
    
def delete_set(set_id):
    pass

def update_set(flashcard_set:FlashcardSet, title, description, cards, image_bytes_dict:dict):
    flashcard_set.title = title
    flashcard_set.description = description

    existing_cards = Flashcard.query.filter_by(set_id=flashcard_set.id).all()
    existing_cards_dict = {str(card.id): card for card in existing_cards}

    for card_item in cards:
        card_id = str(card_item.get('id'))

        if card_id in existing_cards_dict: #Update Card
            card:Flashcard = existing_cards_dict.pop(card_id) 
            card.term = card_item.get('term', card.term)
            card.definition = card_item.get('definition', card.definition)
            card.is_exact = card_item.get('isExact', card.is_exact)
            card.order = card_item.get('order', 0)

            if card_item.get('imageDeleted'):
                card.image = None
            else:
                
                if card_id in image_bytes_dict:
                    current_app.logger.info(f'Updating image for card {card_id}')
                    card.image = image_bytes_dict.get(card_id)
        else: #New Card
            new_card = Flashcard(
                set_id=flashcard_set.id,
                term=card_item.get('term'),
                definition=card_item.get('definition'),
                is_exact=card_item.get('isExact', False),
                image=image_bytes_dict.get(card_id, None),
                order=card_item.get('order', 0)
            )
            db.session.add(new_card)

    #Cards that should no longer exist
    for card_to_delete in existing_cards_dict.values():
        db.session.delete(card_to_delete)
        
    db.session.commit()
    return jsonify({'msg': 'Set updated successfully'}), 200