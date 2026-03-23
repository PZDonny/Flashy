import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/ViewSet.css";

export default function ViewSet() {
  const { setId } = useParams();
  const [cardsetData, setCardsetData] = useState(null);

  useEffect(() => {
    const fetchSetDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5000/api/sets/${setId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCardsetData(data);
        }
      } catch (err) {
        console.error("Error fetching set:", err);
      }
    };
    fetchSetDetails();
  }, [setId]);

  if (!cardsetData) return <div className="loading-state">Loading cards...</div>;

  return (
    <div className="set-container">
      <header className="set-header">
        <Link to="/dashboard" className="back">
          ← Return to Dashboard
        </Link>
        <div className="header-info">
          <h1>{cardsetData.title}</h1>
          <p>{cardsetData.description || "No description."}</p>
          <span className="card-count">{cardsetData.cards.length} FLASHCARDS</span>
        </div>
        <Link to={`/sets/${setId}/quiz`} className="quiz-btn">
            Take a Quiz 📝
          </Link>
      </header>

      <div className="cards">
        {cardsetData.cards.map((card) => (
          <div key={card.id} className="card">
            <div className="card-term">
              <label>TERM</label>
              <p>{card.term}</p>
            </div>

            <div className="card-divider"></div>

            <div className="card-definition">
              <label>DEFINITION</label>
              <p>{card.definition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
