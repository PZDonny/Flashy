from io import BytesIO
from PIL import Image

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'jfif'}
MAX_IMAGE_SIZE = (512, 512)

class InvalidImageError(Exception):

    def __init__(self, message, card_id):
        super().__init__(f"[{card_id}] {message}")
        self.card_id = card_id
        self.message = message

    def to_dict(self):
        return {
                'msg': self.message,
                'card_id': self.card_id
                }
    pass

def _shrink_image(file, card_id) -> Image:
    if not file or file.filename == '':
        raise InvalidImageError("No file provided", card_id)

    if '.' not in file.filename:
        raise InvalidImageError("File does not have extension", card_id)
    
    extension = file.filename.rsplit('.', 1)[1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise InvalidImageError(f"Unsupported file extension: {extension}", card_id)
    
    try:
        image = Image.open(file)
        image.verify()  #verify if it's actually an img
    except Exception:
        raise InvalidImageError("File is not a valid image", card_id)

    #Has to be reopened after verifying
    file.seek(0)
    image = Image.open(file)

    image = image.convert('RGB') #Gets rid of alpha
    image.thumbnail(MAX_IMAGE_SIZE)

    return image

def _get_image_bytes(file, card_id):
    file = _shrink_image(file, card_id)
    if not file:
        return None
    byteBuffer = BytesIO()
    file.save(byteBuffer, format='JPEG')
    return byteBuffer.getvalue()

def get_image_bytes_dict(request) -> tuple[dict, list]:
    images_dict = {}
    errors = []

    for key, file in request.files.items():
        if not key.startswith('image_'):
            continue

        card_id = key.split("_", 1)[1]

        try:
            images_dict[card_id] = _get_image_bytes(file, card_id)
        except InvalidImageError as e:
            errors.append(e.to_dict())

    return images_dict, errors