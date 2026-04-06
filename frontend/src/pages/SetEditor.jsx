import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/SetEditor.css";
import SliderButton from "../components/SliderButton";

export default function SetEditor() {

  function getImageURL(fileName){
    return `http://localhost:5000/images/${fileName}`
  }
  const navigate = useNavigate();

  const { setId } =
    useParams(); /*if there's a set id passed in query params, then the set is being edited, not created */
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
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`http://localhost:5000/api/sets/${setId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setTitle(data.title);
            setDescription(data.description);
            setCards(
              data.cards.map((c) => ({
                id: c.id,
                term: c.term,
                definition: c.definition,
                isExact: c.is_exact,
                image: c.image_filename
                  ? {
                      id: c.image_filename,
                      file: null,
                    }
                  : null,
              }))
            );
          }
        } catch (err) {
          console.error("Error fetching set:", err);
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

  const handleSubmit = async (e) => {
    console.log(cards.map((c) => c.id));
    console.log(cards.map((c) => c.image?.file));
    console.log(cards.map((c) => c.image?.id));
    e.preventDefault();
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    const newCards = cards.map((card) => {
      const cleaned = {
        id: card.id,
        term: card.term,
        definition: card.definition,
        isExact: card.is_exact,
      };

      if (card.image?.file) {
        //uploaded new image
        cleaned.imageId = null
      } else if (card.image?.id) {
        //existing image, not changed
        cleaned.imageId = card.image.id;
      }

      return cleaned;
    });

    formData.append("cards", JSON.stringify(newCards));

    cards.forEach((card) => {
      if (card.image?.file) {
        formData.append(`image_${card.id}`, card.image.file);
      }
    });

    try {
      const res = await fetch(
        isEditMode
          ? `http://localhost:5000/api/sets/${setId}`
          : "http://localhost:5000/api/sets",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (res.ok) navigate("/dashboard");
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
                  {card.image?.file && (
                    <img
                      src={URL.createObjectURL(card.image.file)}
                      alt={card.term}
                      className="image-preview"
                    />
                  )}
                  {card.image?.id && !card.image.file && (
                    <img
                      src={getImageURL(card.image.id)}
                      alt={card.term}
                      className="image-preview"
                    />
                  )}

                  <input
                    id={`file-${card.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return; //Cancelled file selection

                      handleCardChange(card.id, "image", {
                        file,
                        id: null,
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
                    initial={card.is_exact || false}
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
