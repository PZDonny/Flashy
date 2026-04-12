import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import star from "../assets/star.svg";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [sets, setSets] = useState([]);
  const sortedSets = useMemo(() => { //sorts again when sets changed, instead of on every rerender
    return [...sets].sort((a, b) => b.is_starred - a.is_starred);
  }, [sets]);

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
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const handleDelete = async (setId) => {
    await api.delete(`/sets/${setId}`);
    setSets(sets.filter((set) => set.id !== setId));
  };

  const handleStarred = async (setId, starred) => {
    setSets(
      sets.map((set) => {
        return set.id === setId ? { ...set, is_starred: !starred } : set;
      })
    );
    await api.patch(`/sets/${setId}`, { 'is_starred': !starred });
  };

  function createSet(set) {
    return (
      <div key={set.id} className={"set" + (set.is_starred ? " starred" : "")}>
        <div className="set-content">
          <div className="set-top">
            <h3>{set.title}</h3>
            <img
              src={star}
              className="star"
              onClick={() => handleStarred(set.id, set.is_starred)}
              alt="star"
            ></img>
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
    );
  }

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
          sortedSets.map((set) => createSet(set))
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
