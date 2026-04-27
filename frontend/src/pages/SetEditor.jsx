import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/SetEditor.css";
import { api } from "../api";

import EditCard from "../components/EditCard";

export default function SetEditor() {
  const navigate = useNavigate();

  /*if there's a set id passed in query params, then the set is being edited, not created */
  const { setId } = useParams();
  const isEditMode = !!setId;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("A new set");
  const [cards, setCards] = useState([
    {
      id: crypto.randomUUID(),
      term: "",
      definition: "",
      isExact: false,
      image: null,
      error: null,
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
        error: null,
      },
    ]);
  };

  const handleDelete = (cardId) => {
    if (cards.length <= 1) return;
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const handleCardChange = (cardId, field, value) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, error: null, [field]: value} : card
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

  function applyCardErrors(cards, errors) {
    return cards.map((card) => {
      const c = errors.find((e) => e.cardId == card.id);

      return c ? { ...card, error: c.message } : card;
    });
  }

  function handleCardErrors(err) {
    const errorData = err?.data;

    if (!errorData?.errors) {
      return [
        {
          message: err.message || "Something went wrong",
          cardId: null,
        },
      ];
    }

    return errorData.errors.map((e) => ({
      message: e.msg,
      cardId: e.card_id,
    }));
  }

  function createFormData() {
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
      if (card.image?.image) {
        formData.append(`image_${card.id}`, card.image.image);
      }
    });
    return formData;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = createFormData();

    try {
      const func = isEditMode ? api.putFormData : api.postFormData;
      await func(`/sets${isEditMode ? `/${setId}` : ''}`, formData);
      navigate(isEditMode ? `/sets/${setId}` : "/dashboard");
    } catch (err) {
      const parsedErrors = handleCardErrors(err);

      setCards((prev) => {
        const updated = applyCardErrors(prev, parsedErrors);

        //scroll to 1st
        const firstError = parsedErrors[0];
        if (firstError?.cardId) {
          setTimeout(() => {
            const el = document.getElementById(`card-${firstError.cardId}`);
            if (el) {
              el.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 0);
        }

        return updated;
      });
    }
  };

  return (
    <div className="create-set-container">
      <div className="create-set-header">
        <h2>
          {isEditMode ? "Edit flashcard set" : "Create a new flashcard set"}
        </h2>
        <div className="create-set-actions">
          <Link
            to={isEditMode ? `/sets/${setId}` : "/dashboard"}
            className="btn cancel-btn"
          >
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

        <div className="set-cards">
          {cards.map((card, index) => (
            <EditCard
              card={card}
              index={index}
              handleDelete={handleDelete}
              handleRemoveImage={handleRemoveImage}
              handleCardChange={handleCardChange}
            />
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
