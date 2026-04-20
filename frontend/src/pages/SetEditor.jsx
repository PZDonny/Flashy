import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/SetEditor.css";
import { api } from "../api";
import SliderButton from "../components/SliderButton";

export default function SetEditor() {
  function getImageURL(cardId) {
    return `http://localhost:5000/api/flashcards/${cardId}/image`;
  }
  const navigate = useNavigate();

  /*if there's a set id passed in query params, then the set is being edited, not created */
  const { setId } = useParams();
  const [isEditMode, setIsEditMode] = useState(!!setId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("A new set");
  const [cards, setCards] = useState([
    {
      id: crypto.randomUUID(),
      term: "",
      definition: "",
      isExact: false,
      image: null,
    },
  ]);

  useEffect(() => {
    if (isEditMode) {
      const fetchSetDetails = async () => {
        try {
          const data = await api.get(`/sets/${setId}`);

          if (data) {
            setTitle(data.title);
            setDescription(data.description);
            setCards(
              data.cards.map((c) => ({
                id: c.id,
                term: c.term,
                definition: c.definition,
                isExact: c.is_exact,
                image: c.image_url
                  ? {
                      image: null,
                      exists: true,
                    }
                  : null,
              }))
            );
          }
        } catch (err) {
          console.error("Error getting set:", err);
        }
      };
      fetchSetDetails();
    }
  }, [isEditMode, setId]);

  const addCardRow = () => {
    setCards([
      ...cards,
      {
        id: crypto.randomUUID(),
        term: "",
        definition: "",
        isExact: false,
        image: null,
      },
    ]);
  };

  const removeCardRow = (cardId) => {
    if (cards.length <= 1) return;
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const handleCardChange = (cardId, field, value) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card
      )
    );
  };

  const handleRemoveImage = (cardId) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              image: null,
              imageDeleted: true,
            }
          : card
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    const newCards = cards.map((card) => ({
      id: card.id,
      term: card.term,
      definition: card.definition,
      isExact: card.isExact,
      imageDeleted: card.imageDeleted || false,
    }));

    formData.append("cards", JSON.stringify(newCards));

    cards.forEach((card) => {
      if (card.image) {
        if (card.image?.image) {
          formData.append(`image_${card.id}`, card.image.image);
        }
      }
    });

    try {
      const func = isEditMode ? api.putFormData : api.postFormData;
      await func(`/sets${isEditMode ? `/${setId}` : ""}`, formData);

      navigate("/dashboard");
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
            <div key={card.id} className="card-input-row">
              <div className="card-row-header">
                <span className="card-number">{index + 1}</span>
                <button
                  type="button"
                  className="delete-row-btn"
                  onClick={() => removeCardRow(card.id)}
                  title="Delete card"
                >
                  &times;
                </button>
              </div>
              <div className="card-row-inputs">
                <div className="input-field image-input">
                  <label>IMAGE</label>

                  {card.image?.image && (
                    <div className="image-container">
                      <img
                        src={URL.createObjectURL(card.image.image)}
                        alt={card.term}
                        className="image-preview"
                      />

                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(card.id)}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {card.image?.exists &&
                    !card.image?.image &&
                    !card.imageDeleted && (
                      <div className="image-container">
                        <img
                          src={getImageURL(card.id)}
                          alt={card.term}
                          className="image-preview"
                        />

                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => handleRemoveImage(card.id)}
                        >
                          ×
                        </button>
                      </div>
                    )}

                  <input
                    id={`file-${card.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return; //Cancelled file selection

                      handleCardChange(card.id, "image", {
                        image: file,
                        exists: false,
                      });
                    }}
                    hidden
                  />

                  <label htmlFor={`file-${card.id}`} className="file-btn">
                    Choose Image
                  </label>
                </div>
                <div className="input-field">
                  <input
                    placeholder="Term"
                    value={card.term}
                    onChange={(e) =>
                      handleCardChange(card.id, "term", e.target.value)
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
                      handleCardChange(card.id, "definition", e.target.value)
                    }
                    required
                  />
                  <label>DEFINITION</label>
                </div>
                <div className="input-field exact-toggle-input">
                  <label>EXACT</label>
                  <SliderButton
                    initial={card.isExact || false}
                    toggleListener={(value) =>
                      handleCardChange(card.id, "isExact", value)
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
