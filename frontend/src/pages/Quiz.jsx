import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/Quiz.css";
import { api } from "../api";
import TermImage from "../components/TermImage";
import SpeechButton from "../components/SpeechButton";
import BackButton from "../components/BackButton";

export default function Quiz() {
  const { setId } = useParams();
  const [quizStarted, setQuizStarted] = useState(false);
  const [max, setMax] = useState(10);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizCards, setQuizCards] = useState([]);
  const [cardsetData, setCardsetData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(false);
  const [resultClass, setResultClass] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const progress = ((questionIndex) / quizCards.length) * 100;
  const navigate = useNavigate();

  const [quizSessionId, setQuizSessionId] = useState(null);

  useEffect(() => {
    const fetchSetDetails = async () => {
      try {
        const data = await api.get(`/sets/${setId}/info`);
        setCardsetData(data);
      } catch (err) {
        console.error("Error getting set:", err);
      }
    };
    fetchSetDetails();
  }, [setId]);

  useEffect(() => {
    if (cardsetData) {
      setMax(cardsetData.cards_total);
    }
  }, [cardsetData]);

  const startQuiz = async () => {
    try {
      const data = await api.get(
        `/quiz_session/start?set_id=${setId}&max=${max}`
      );

      setQuizSessionId(data.quiz_session_id);
      setQuizCards(data.cards);
      setQuizStarted(true);
    } catch (err) {
      console.error("Failed to start quiz session:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (result) {
      if (questionIndex === quizCards.length - 1) {
        setQuizCompleted(true);
        await api.post(`/quiz_session/${quizSessionId}/submit`);

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
    const currentCard = quizCards[questionIndex];

    if (isSubmitting) return;
    setUserAnswer(userAnswer);
    try {
      setIsSubmitting(true);
      const data = await api.post(`/quiz_session/${quizSessionId}/answer`, {
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

        {!quizStarted ? (
          <h1>Quiz Options</h1>
        ) : (
          <>
            <h1>{cardsetData ? cardsetData.title : "Loading..."}</h1>

            <div className="question-data">
              <div>
                <h2>
                  Question {questionIndex + 1} of {quizCards?.length || 0}
                </h2>
              </div>

              <div
                className={`exact-container ${
                  cardsetData && quizCards[questionIndex].is_exact
                    ? "exact"
                    : ""
                }`}
              >
                <span>
                  {cardsetData && quizCards[questionIndex].is_exact
                    ? "Exact Match"
                    : "Paraphrasable"}
                </span>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${quizCompleted ? 100 : progress}%` }} />
            </div>
          </>
        )}
      </header>

      {!quizStarted ? (
        <div className="quiz-setup">
          <label htmlFor="max">Maximum Questions: </label>

          <input
            id="max"
            type="number"
            min={1}
            max={quizCards?.length || 10}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
          />

          <button onClick={startQuiz} className="start-btn">
            Start Quiz
          </button>
        </div>
      ) : (
        <>
          {quizCompleted && (
            <div className="quiz-completed-msg">
              Quiz Completed, Submitting ✔
            </div>
          )}

          {!quizCompleted && (
            <div className="question-card">
              <p className="define">Define</p>
              <hr />

              <div className="question-info">
                {cardsetData && quizCards[questionIndex]?.image_url && (
                  <TermImage card={quizCards[questionIndex]} />
                )}

                <div className="question-term-container">
                  <p className="question-term">
                    {cardsetData ? quizCards[questionIndex].term : "..."}
                  </p>
                  <SpeechButton
                    text={cardsetData ? quizCards[questionIndex].term : ""}
                  />
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className={`result-container ${resultClass}`}>
              <strong>{result}</strong>
              <hr />

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
                  : questionIndex === quizCards.length - 1
                  ? "Finish"
                  : "Next Question"}
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
