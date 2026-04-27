import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/ViewSet.css';
import SliderButton from '../components/SliderButton';
import TermImage from '../components/TermImage';
import SpeechButton from '../components/SpeechButton';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ViewSet() {
  const { setId } = useParams();
  const [cardsetData, setCardsetData] = useState(null);

  useEffect(() => {
    const fetchSetDetails = async () => {
      try {
        const data = await api.get(`/sets/${setId}`);
        setCardsetData(data);
      } catch (err) {
        console.error('Error getting set:', err);
      }
    };
    fetchSetDetails();
  }, [setId]);


  return (
    <div className='set-container'>
      {!cardsetData ? (
        <>
          <header className='set-header'>
            <BackButton to='/dashboard' text='Return to Dashboard' />
          </header>
          <LoadingSpinner />
        </>
      ) : (
        <>
          <header className='set-header'>
            <BackButton to='/dashboard' text='Return to Dashboard' />
            <div className='set-info'>
              <h1>{cardsetData.title}</h1>

              <p>{cardsetData.description || 'No description.'}</p>
              <span className='card-count'>
                {cardsetData.cards.length} FLASHCARDS
              </span>
            </div>

            <div className='set-actions'>
              <Link to={`/edit-set/${setId}`} className='set-btn edit-btn'>
                Edit Set ✏️
              </Link>
              <Link to={`/sets/${setId}/quiz`} className='set-btn quiz-btn'>
                Take a Quiz 📝
              </Link>
              <Link
                to={`/sets/${setId}/quiz-history`}
                className='set-btn history-btn'
              >
                Quiz History 📊
              </Link>
            </div>
          </header>

          <hr></hr>

          <div className='cards'>
            {cardsetData.cards.map((card) => (
              <div key={card.id} className='card'>
                {card.image_url && <TermImage card={card} />}

                <div className='card-property-container'>
                  <div className='card-term'>
                    <label>TERM</label>
                    <p>{card.term}</p>
                  </div>
                  <SpeechButton text={card.term} />
                </div>

                <div className='card-divider'></div>

                <div className='card-property-container'>
                  <div className='card-definition'>
                    <label>DEFINITION</label>
                    <p>{card.definition}</p>
                  </div>
                  <SpeechButton text={card.definition} />
                </div>

                <div className='card-divider'></div>

                <div className='card-exact'>
                  <label>EXACT</label>
                  <SliderButton
                    initial={card.is_exact || false}
                    disabled={true}
                  ></SliderButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
