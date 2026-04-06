import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/SetEditor.css";
import SliderButton from "../components/SliderButton";

export default function SetEditor() {
  const navigate = useNavigate();

  const { setId } =
    useParams(); /*if there's a set id passed in query params, then the set is being edited, not created */
  const [isEditMode, setIsEditMode] = useState(!!setId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("A new set");
  const [cards, setCards] = useState([{ term: "", definition: "" }]);

  useEffect(() => {
    if (isEditMode) {
      const fetchSetDetails = async () => {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`http://localhost:5000/api/sets/${setId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setTitle(data.title);
            setDescription(data.description);
            setCards(data.cards);
          }
        } catch (err) {
          console.error("Error fetching set:", err);
        }
      };
      fetchSetDetails();
    }
  }, [isEditMode, setId]);

  const addCardRow = () => {
    setCards([...cards, { term: "", definition: "", isExact: false }]);
  };

  const removeCardRow = (index) => {
    if (cards.length > 1) {
      const newCards = cards.filter((_, i) => i !== index);
      setCards(newCards);
    }
  };

  const handleCardChange = (index, field, value) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        isEditMode
          ? `http://localhost:5000/api/sets/${setId}`
          : "http://localhost:5000/api/sets",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, description, cards }),
        }
      );

      if (res.ok) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to save set", err);
    }
  };

  return (
    <div className="create-set-container">
      <div className="create-set-header">
        <h2>
          {isEditMode ? "Edit flashcard set" : "Create a new flashcard set"}
        </h2>
        <div className="create-set-actions">
          <Link to="/dashboard" className="btn cancel-btn">
            Cancel
          </Link>
          <button type="submit" form="set-form" className="btn save-btn">
            {isEditMode ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>

      <form id="set-form" onSubmit={handleSubmit} className="create-set-form">
        <div className="prop-inputs">
          <input
            className="title-input"
            placeholder='Enter a title for this set"'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="desc-input"
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="cards-list-creation">
          {cards.map((card, index) => (
            <div key={index} className="card-input-row">
              <div className="card-row-header">
                <span className="card-number">{index + 1}</span>
                <button
                  type="button"
                  className="delete-row-btn"
                  onClick={() => removeCardRow(index)}
                  title="Delete card"
                >
                  &times;
                </button>
              </div>
              <div className="card-row-inputs">
                <div className="input-field">
                  <input
                    placeholder="Term"
                    value={card.term}
                    onChange={(e) =>
                      handleCardChange(index, "term", e.target.value)
                    }
                    required
                  />
                  <label>TERM</label>
                </div>
                <div className="input-field">
                  <input
                    placeholder="Definition"
                    value={card.definition}
                    onChange={(e) =>
                      handleCardChange(index, "definition", e.target.value)
                    }
                    required
                  />
                  <label>DEFINITION</label>
                </div>
                <div className="input-field exact-toggle-input">
                  <label>EXACT</label>
                  <SliderButton
                    initial={card.is_exact || false}
                    toggleListener={(value) =>
                      handleCardChange(index, "isExact", value)
                    }
                  ></SliderButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="add-btn" onClick={addCardRow}>
            + Add Card
          </button>
        </div>
      </form>
    </div>
  );
}
