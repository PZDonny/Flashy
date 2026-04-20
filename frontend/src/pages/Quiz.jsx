import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/Quiz.css";
import { api } from "../api";
import TermImage from "../components/TermImage";
import SpeechButton from "../components/SpeechButton";
import BackButton from "../components/BackButton";

export default function Quiz() {
  const { setId } = useParams();
  const started = useRef(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [cardsetData, setCardsetData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(false);
  const [resultClass, setResultClass] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const navigate = useNavigate();

  const [quizSessionId, setQuizSessionId] = useState(null);

  useEffect(() => {
    if (!setId || started.current) return;

    started.current = true;

    const startSession = async () => {
      try {
        const data = await api.post(`/quiz/start`, {
          set_id: setId,
        });

        setQuizSessionId(data.quiz_session_id);
      } catch (err) {
        console.error("Failed to start quiz session:", err);
      }
    };

    startSession();
  }, [setId]);

  useEffect(() => {
    const fetchSetDetails = async () => {
      try {
        const data = await api.get(`/sets/${setId}`);
        setCardsetData(data);
      } catch (err) {
        console.error("Error getting set:", err);
      }
    };
    fetchSetDetails();
  }, [setId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (result) {
      if (questionIndex === cardsetData.cards.length - 1) {
        setQuizCompleted(true);
        await api.post(`/quiz/${quizSessionId}/submit`);

        setTimeout(() => {
          navigate(`/sets/${setId}`);
        }, 1500);

        return;
      }
      setResult(null);
      setCorrectAnswer("");
      setQuestionIndex((prev) => prev + 1);
      return;
    }

    const userAnswer = e.target.answer.value;
    const currentCard = cardsetData.cards[questionIndex];

    if (isSubmitting) return;
    setUserAnswer(userAnswer);
    try {
      setIsSubmitting(true);
      const data = await api.post(`/quiz/${quizSessionId}/answer`, {
        card_id: currentCard.id,
        answer: userAnswer,
      });

      setResult(data.result_label);
      setCorrectAnswer(data.correct_answer);
      setResultClass(data.result_class);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <BackButton text="Back to Set" to={`/sets/${setId}`} />
        <h1>{cardsetData ? cardsetData.title : "Loading..."}</h1>
        <div className="question-data">
          <div>
            <h2>
              Question {questionIndex + 1} of {cardsetData?.cards.length || 0}
            </h2>
          </div>

          <div
            className={`exact-container ${
              cardsetData && cardsetData.cards[questionIndex].is_exact
                ? "exact"
                : ""
            }`}
          >
            <span>
              {cardsetData && cardsetData.cards[questionIndex].is_exact
                ? "Exact Match"
                : "Paraphrasable"}
            </span>
          </div>
        </div>
      </header>

      {quizCompleted && (
        <div className="quiz-completed-msg">Quiz Completed, Submitting ✔</div>
      )}

      {!quizCompleted && (
        <div className="question-card">
          <p className="define">Define</p>
          <hr></hr>
          <div className="question-info">
            {cardsetData && cardsetData.cards[questionIndex]?.image_url && (
              <TermImage card={cardsetData.cards[questionIndex]} />
            )}
            <div className="question-term-container">
              <p className="question-term">
                {cardsetData ? cardsetData.cards[questionIndex].term : "..."}
              </p>
              <SpeechButton
                text={cardsetData ? cardsetData.cards[questionIndex].term : ""}
              />
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`result-container ${resultClass}`}>
          <strong>{result}</strong>
          <hr></hr>
          <span className="answer-feedback-label">YOUR ANSWER:</span>
          <p>{userAnswer}</p>

          <span className="answer-feedback-label">CORRECT ANSWER:</span>
          <p>{correctAnswer}</p>
        </div>
      )}

      <form className="quiz-form" onSubmit={handleSubmit}>
        {!result && !quizCompleted && (
          <>
            <label htmlFor="answer">YOUR ANSWER</label>
            <input
              type="text"
              id="answer"
              name="answer"
              placeholder="Enter your answer here"
              autoComplete="off"
              required
            />
          </>
        )}

        {!quizCompleted && (
          <button
            type="submit"
            className={`check-btn ${!result ? "check" : "next"}`}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Checking..."
              : !result
              ? "Check Answer"
              : questionIndex === cardsetData.cards.length - 1
              ? "Finish"
              : "Next Question"}
          </button>
        )}
      </form>
    </div>
  );
}
