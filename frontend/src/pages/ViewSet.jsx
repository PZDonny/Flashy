import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import "../styles/ViewSet.css";
import SliderButton from "../components/SliderButton";
import TermImage from "../components/TermImage";

export default function ViewSet() {
  const { setId } = useParams();
  const [cardsetData, setCardsetData] = useState(null);

  useEffect(() => {
    const fetchSetDetails = async () => {
      try {
        const data = await api.get(`/sets/${setId}`);
        setCardsetData(data);
      } catch (err) {
        console.error("Error getting set:", err);
      }
    };
    fetchSetDetails();
  }, [setId]);

  if (!cardsetData)
    return <div className="loading-state">Loading cards...</div>;

  return (
    <div className="set-container">
      <header className="set-header">
        <Link to="/dashboard" className="back">
          ← Return to Dashboard
        </Link>
        <div className="set-info">
          <h1>{cardsetData.title}</h1>
          
          <p>{cardsetData.description || "No description."}</p>
          <span className="card-count">
            {cardsetData.cards.length} FLASHCARDS
          </span>
        </div>

        <div className="set-actions">
          <Link to={`/edit-set/${setId}`} className="btn edit-btn">
            Edit Set ✏️
          </Link>
          <Link to={`/sets/${setId}/quiz`} className="btn quiz-btn">
            Take a Quiz 📝
          </Link>
        </div>
      </header>

      <hr></hr>

      <div className="cards">
        {cardsetData.cards.map((card) => (
          <div key={card.id} className="card">
            {card.image_filename && <TermImage card={card} />}
            <div className="card-term">
              <label>TERM</label>
              <p>{card.term}</p>
            </div>

            <div className="card-divider"></div>

            <div className="card-definition">
              <label>DEFINITION</label>
              <p>{card.definition}</p>
            </div>

            <div className="card-divider"></div>

            <div className="card-exact">
              <label>EXACT</label>
              <SliderButton
                initial={card.is_exact || false}
                disabled={true}
              ></SliderButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
