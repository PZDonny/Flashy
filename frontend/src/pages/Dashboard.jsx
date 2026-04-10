import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [sets, setSets] = useState([]);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const data = await api.get("/sets");
        setSets(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (user) fetchSets();
  }, [user,]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const handleDelete = async (setId) => {
    await api.delete(`/sets/${setId}`);
    setSets(sets.filter((set) => set.id !== setId));
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Sets</h1>
        <Link to="/edit-set" className="create-btn">
          <span>+</span> Create New Set
        </Link>
      </header>

      <div className="sets">
        {sets.length > 0 ? (
          sets.map((set) => (
            <div key={set.id} className={"set" + (!set.is_starred ? " starred" : "")}>
              <div className="set-content">
                <div className="set-top">
                  <h3>{set.title}</h3>
                  <span className="star">{set.is_starred ? "⭐" : "☆"}</span>
                </div>

                <p>{set.description || "No description"}</p>
              </div>
              <div className="set-actions">
                <Link to={`/sets/${set.id}`} className="view">
                  View Cards
                </Link>
                <button
                  className="delete-icon-btn"
                  onClick={() => handleDelete(set.id)}
                  title="Delete Set"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <div className="empty-emoji">📚</div>
            <h2>You have no sets</h2>
            <p>Create your first flashcard set to get started!</p>
            <Link to="/edit-set" className="create-btn-large">
              + Create Your First Set
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
