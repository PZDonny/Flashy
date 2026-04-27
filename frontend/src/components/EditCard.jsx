import SliderButton from '../components/SliderButton';

const ALLOWED_IMAGE_EXTENSIONS = [
  'image/png',
  'image/jpeg',
  'image/webp',
  '.jfif',
  '.jpg',
];

function EditCard({
  card,
  index,
  handleDelete,
  handleRemoveImage,
  handleCardChange,
}) {
  function getImageURL(cardId) {
    return `http://localhost:5000/api/flashcards/${cardId}/image`;
  }
  return (
    <div
      key={card.id}
      id={`card-${card.id}`}
      className={`card-input-row ${card.error ? 'error' : ''}`}
    >
      <div className='card-row-header'>
        <span className='card-number'>{index + 1}</span>
        {card.error && (
          <div className='card-error'>
            <span>{card.error}</span>
            <button
              type='button'
              className='close-error-btn'
              onClick={() => handleCardChange(card.id, 'error', null)}
            >
              &times;
            </button>
          </div>
        )}
        <button
          type='button'
          className='delete-row-btn'
          onClick={() => handleDelete(card.id)}
          title='Delete card'
        >
          &times;
        </button>
      </div>
      <div className='card-row-inputs'>
        <div className='input-field image-input'>
          <label>IMAGE</label>

          {card.image?.image && (
            <div className='image-container'>
              <img
                src={URL.createObjectURL(card.image.image)}
                alt={card.term}
                className='image-preview'
              />

              <button
                type='button'
                className='remove-image-btn'
                onClick={() => handleRemoveImage(card.id)}
              >
                ×
              </button>
            </div>
          )}

          {card.image?.exists && !card.image?.image && !card.imageDeleted && (
            <div className='image-container'>
              <img
                src={getImageURL(card.id)}
                alt={card.term}
                className='image-preview'
              />

              <button
                type='button'
                className='remove-image-btn'
                onClick={() => handleRemoveImage(card.id)}
              >
                ×
              </button>
            </div>
          )}

          <input
            id={`file-${card.id}`}
            type='file'
            accept='image/png, image/jpeg, image/webp, .jpg, .jfif'
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return; //Cancelled file selection

              if (!ALLOWED_IMAGE_EXTENSIONS.includes(file.type)) {
                handleCardChange(card.id, 'error', 'Invalid image type');
                return;
              }

              handleCardChange(card.id, 'image', {
                image: file,
                exists: false,
              });
            }}
            hidden
          />

          <label htmlFor={`file-${card.id}`} className='file-btn'>
            Choose Image
          </label>
        </div>
        <div className='input-field'>
          <input
            placeholder='Term'
            value={card.term}
            onChange={(e) => handleCardChange(card.id, 'term', e.target.value)}
            required
          />
          <label>TERM</label>
        </div>
        <div className='input-field'>
          <input
            placeholder='Definition'
            value={card.definition}
            onChange={(e) =>
              handleCardChange(card.id, 'definition', e.target.value)
            }
            required
          />
          <label>DEFINITION</label>
        </div>
        <div className='input-field exact-toggle-input'>
          <label>EXACT</label>
          <SliderButton
            initial={card.isExact || false}
            toggleListener={(value) =>
              handleCardChange(card.id, 'isExact', value)
            }
          ></SliderButton>
        </div>
      </div>
    </div>
  );
}

export default EditCard;
