import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/Quiz.css";

export default function Quiz() {
  const { setId } = useParams();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [cardsetData, setCardsetData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isExact, setIsExact] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSetDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5000/api/sets/${setId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCardsetData(data);
        }
      } catch (err) {
        console.error("Error fetching set:", err);
      }
    };
    fetchSetDetails();
  }, [setId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (result) {
      if (questionIndex === cardsetData.cards.length - 1) {
        setQuizCompleted(true);
        //submit to backend
        setTimeout(() => {
          navigate(`/sets/${setId}`);
        }, 2000);

        return;
      }
      setResult(undefined);
      setCorrectAnswer("");
      setQuestionIndex((prev) => prev + 1);
      return;
    }

    const token = localStorage.getItem("token");
    const userAnswer = e.target.answer.value;
    const currentCard = cardsetData.cards[questionIndex];

    if (isSubmitting) return;
    setUserAnswer(userAnswer);
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:5000/api/check_answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          card_id: currentCard.id,
          answer: userAnswer,
          is_exact: isExact,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        let result;
        if (data.result === "CORRECT") {
          result = "Correct!";
        } else if (data.result === "CLOSE") {
          result = "Close! Almost there.";
        }
        else {
          result = "Incorrect.";
        }

        setResult(`${result} ${data.score}% Accuracy`);
        setCorrectAnswer(data.correct_answer);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <Link to={`/sets/${setId}`} className="back">
          ← Back to Set
        </Link>
        <h1>{cardsetData ? cardsetData.title : "Loading..."}</h1>
        <h2>
          Question {questionIndex + 1} of {cardsetData?.cards.length || 0}
        </h2>

        <div className="exact-toggle">
          <label>
            <input
              type="checkbox"
              checked={isExact}
              onChange={(e) => setIsExact(e.target.checked)}
            />
            Exact Answers
          </label>
        </div>
      </header>

      {quizCompleted && (
        <div className="quiz-completed-msg">Quiz Completed ✔</div>
      )}

      {!quizCompleted && (
        <div className="question-card">
          <p>Define</p>
          <hr></hr>
          <p className="question-text">
            {cardsetData ? cardsetData.cards[questionIndex].term : "..."}
          </p>
        </div>
      )}

      {result && (
        <div
          className={`result-container ${result.includes("Correct") ? "correct" : result.includes("Incorrect") ? "incorrect" : "close"
            }`}
        >
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
