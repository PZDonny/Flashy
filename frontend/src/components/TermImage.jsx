import '../styles/TermImage.css';

function TermImage({ card }) {
  return (
    <div className='term-image-container'>
      <img
        key={card.id}
        src={`http://localhost:5000/api/flashcards/${card.id}/image`}
        alt={card.term}
        className='term-image'
      />
    </div>
  );
}

export default TermImage;
