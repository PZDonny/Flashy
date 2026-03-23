import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [sets, setSets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSets = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5000/api/sets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSets(data);
        }
      } catch (err) {
        console.error("Error fetching sets:", err);
      }
    };

    if (user) fetchSets();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleDelete = async (setId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/sets/${setId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSets(sets.filter((set) => set.id !== setId));
      }
    } catch (err) {
      console.error("Failed to delete set:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Sets</h1>
        <Link to="/create-set" className="create-btn">
          <span>+</span> Create New Set
        </Link>
      </header>

      <div className="sets">
        {sets.length > 0 ? (
          sets.map((set) => (
            <div key={set.id} className="set">
              <div className="set-content">
                <h3>{set.title}</h3>
                <p>{set.description || "No description provided."}</p>
              </div>
              <div className="set-actions">
                <Link to={`/sets/${set.id}`} className="view-link">
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
            <Link to="/create-set" className="create-btn-large">
              + Create Your First Set
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
