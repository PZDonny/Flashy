from io import BytesIO
from PIL import Image

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def _shrink_image(file) -> Image:
    def allowed_file(filename: str) -> bool:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

    MAX_IMAGE_SIZE = (512, 512)
    
    if file.filename == '':
        return None
    
    if not allowed_file(file.filename):
        return None

    image = Image.open(file)

    image = image.convert('RGB') #Gets rid of possible alpha
    image.thumbnail(MAX_IMAGE_SIZE)

    return image

def _get_image_bytes(image:Image):
    image = _shrink_image(image)
    if not image:
        return None
    bytesBufer = BytesIO()
    image.save(bytesBufer, format='JPEG')
    return bytesBufer.getvalue()

def get_image_bytes_dict(request) -> dict:
    images_dict = {}
    for key in request.files.keys():
        if key.startswith('image_'):
            card_id = str(key.split('_', 1)[1])
            image = request.files[key]
            image_bytes = _get_image_bytes(image)
            images_dict[card_id] = image_bytes
    return images_dict