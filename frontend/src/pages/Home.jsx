import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>Master Subjects with <span>Flashy</span></h1>
          <p className="hero-desc">
            Simply create and study flashcards.
          </p>
          <div className="hero-btns">
            <Link to="/register" className="btn-register">Sign Up and Get Started</Link>
            <Link to="/login" className="btn-login">Login</Link>
          </div>
        </div>
        <div className="hero-image">
          <span role="img" aria-label="cards">🗂️</span>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="emoji">🏎</div>
          <h3>Fast</h3>
          <p>Quickly create study sets with our flashcard set creator.</p>
        </div>
        <div className="feature">
          <div className="emoji">🤔</div>
          <h3>Study</h3>
          <p>Study and review your sets retaining knowledge.</p>
        </div>
        <div className="feature">
          <div className="emoji">📝</div>
          <h3>Take Quizzes</h3>
          <p>Quiz yourself on your created sets, testing your knowledge.</p>
        </div>
      </section>
    </div>
  );
}