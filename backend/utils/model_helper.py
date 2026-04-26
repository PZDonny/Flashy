def card_json(card) -> dict:
    return {
        'id': card.id,
        'term': card.term,
        'definition': card.definition,
        'is_exact': card.is_exact,
        'image_url': f'/api/flashcards/{card.id}/image' if card.image else None
    }