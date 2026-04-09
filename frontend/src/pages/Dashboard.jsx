import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [sets, setSets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
    const fetchSets = async () => {
      const data = await api.get("/sets");
      setSets(data);
    };

    if (user) fetchSets();
  }, [user, loading, navigate]);

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
            <div key={set.id} className="set">
              <div className="set-content">
                <div className="set-top">
                  <h3>{set.title}</h3>
                  <span>{set.is_starred ? "⭐" : "☆"}</span>
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
