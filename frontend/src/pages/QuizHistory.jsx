import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { api } from "../api";
import "../styles/QuizHistory.css";

function QuizHistory() {
  const { setId } = useParams();
  const [quizHistories, setQuizHistories] = useState([]);
  const [totalQuizzes, setTotalQuizzes] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const data = await api.get(`/sets/${setId}/quiz_history`);
        setQuizHistories(data.quizzes);
        setTotalQuizzes(data.total_quizzes);
      } catch (err) {
        console.error("Error fetching quiz history:", err);
      }
    };

    fetchQuizHistory();
  }, [setId]);

  const openQuiz = async (quizId) => {
    setSelectedQuiz(quizId);
    setLoadingAnswers(true);

    try {
      const data = await api.get(`/quiz/${quizId}/answers`);
      setQuizAnswers(data);
    } catch (err) {
      console.error("Error fetching quiz answers:", err);
    }

    setLoadingAnswers(false);
  };

  const closeModal = () => {
    setSelectedQuiz(null);
    setQuizAnswers([]);
  };

  return (
    <div className="quiz-history-page">
      <BackButton text="Return to Set" to={`/sets/${setId}`} />
      <div className="quiz-history-header">
        <h2>Quiz History</h2>
        <div className="quiz-history-subtext">
          Total Quizzes Taken:{" "}
          <strong>{totalQuizzes !== null ? totalQuizzes : "..."}</strong>
        </div>
      </div>

      {totalQuizzes !== null && totalQuizzes === 0 ? (
        <p>No quiz history found for this set.</p>
      ) : (
        <div className="quiz-history-container">
          {quizHistories.map((quiz) => (
            <div
              key={quiz.id}
              className="quiz-card"
              onClick={() => openQuiz(quiz.id)}
            >
              <div className="quiz-score-info">
                <div className="quiz-score">
                  Score: {quiz.score}/{quiz.total_questions}
                </div>

                <div className="quiz-percent">
                  {Math.round((quiz.score / quiz.total_questions) * 100)}%
                </div>
              </div>

              <div className="quiz-date">
                {new Date(quiz.taken_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuiz && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quiz Results</h3>

              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            {loadingAnswers ? (
              <p>Loading...</p>
            ) : (
              <div className="answers-list">
                {quizAnswers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`answer-item ${
                      answer.is_correct ? "correct" : "wrong"
                    }`}
                  >
                    <div className="answer-header">
                      <span className="result-icon">
                        {answer.is_correct ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                    </div>

                    <div className="result-block">
                      <div className="result-term">
                        <span className="label">Term</span>
                        <span className="value">{answer.term}</span>
                      </div>

                      <div className="result-definition">
                        <span className="label">Definition</span>
                        <span className="value">{answer.definition}</span>
                      </div>

                      <div className="result-user">
                        <span className="label">Your Answer</span>
                        <span className="value">{answer.user_answer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizHistory;
