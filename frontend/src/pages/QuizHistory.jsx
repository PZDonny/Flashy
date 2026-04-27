import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import { api } from '../api';
import '../styles/QuizHistory.css';
import LoadingSpinner from '../components/LoadingSpinner';

function QuizHistory() {
  const { setId } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizHistories, setQuizHistories] = useState([]);
  const [totalQuizzes, setTotalQuizzes] = useState(null);
  const [weaktestTerm, setWeakestTerm] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  const correctCount = quizAnswers.filter((a) => a.is_correct).length;
  const totalCount = quizAnswers.length;
  const percent = totalCount
    ? Math.round((correctCount / totalCount) * 100)
    : 0;

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        setLoading(true);

        const data = await api.get(`/sets/${setId}/quiz_history`);

        setQuizHistories(data.quizzes);
        setTotalQuizzes(data.total_quizzes);
        setWeakestTerm(data.weakest_term);
      } catch (err) {
        console.error('Error fetching quiz history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, [setId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const openQuiz = async (quizId) => {
    setSelectedQuiz(quizId);
    setLoadingAnswers(true);

    try {
      const data = await api.get(`/quiz/${quizId}/answers`);
      setQuizAnswers(data);
    } catch (err) {
      console.error('Error fetching quiz answers:', err);
    }

    setLoadingAnswers(false);
  };

  const closeModal = () => {
    setSelectedQuiz(null);
    setQuizAnswers([]);
  };

  const averagePercent =
    quizHistories.length > 0
      ? Math.round(
          quizHistories.reduce((sum, quiz) => {
            return sum + (quiz.score / quiz.total_questions) * 100;
          }, 0) / quizHistories.length
        )
      : null;

  return (
    <div className='quiz-history-page'>
      <BackButton text='Return to Set' to={`/sets/${setId}`} />
      <div className='quiz-history-header'>
        <h2>Recent Quizzes</h2>

        <div className='quiz-history-stats'>
          <div className='quiz-history-sub'>
            Total Quizzes Taken:{' '}
            <strong>{totalQuizzes !== null ? totalQuizzes : '...'}</strong>
          </div>

          <div className='quiz-history-sub'>
            Average of Last 10 Quizzes:{' '}
            <strong>
              {averagePercent !== null ? averagePercent + '%' : '...'}
            </strong>
          </div>

          {weaktestTerm && (
            <div className='quiz-history-sub weakest'>
              Weakest Term: <strong>{weaktestTerm}</strong>
            </div>
          )}
        </div>
      </div>

      {totalQuizzes !== null && totalQuizzes === 0 ? (
        <p>No quiz history found for this set.</p>
      ) : (
        <div className='quiz-history-container'>
          {quizHistories.map((quiz, index) => (
            <div
              key={quiz.id}
              className='quiz-card'
              onClick={() => openQuiz(quiz.id)}
            >
              <span className='quiz-index'>
                Quiz #{quizHistories.length - index}
              </span>
              <div className='quiz-score-info'>
                <div className='quiz-score'>
                  Score: {quiz.score}/{quiz.total_questions}
                </div>

                <div className='quiz-percent'>
                  {Math.round((quiz.score / quiz.total_questions) * 100)}%
                </div>
              </div>

              <div className='quiz-date'>
                {new Date(quiz.taken_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuiz && (
        <div className='modal-overlay' onClick={closeModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>Quiz Results</h3>

              <button className='close-btn' onClick={closeModal}>
                &times;
              </button>
            </div>
            {!loadingAnswers && (
              <div className='results-summary'>
                <div className='results-stats'>
                  <div className='results-score'>
                    {correctCount} / {totalCount}
                  </div>

                  <div className='results-percent'>{percent}%</div>
                </div>

                <div className='results-bar'>
                  <div
                    className='results-bar-fill'
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className='results-label'>
                  {percent >= 80
                    ? 'Great Job!'
                    : percent >= 50
                    ? 'Keep improving!'
                    : 'Needs more studying!'}
                </div>
              </div>
            )}

            {loadingAnswers ? (
              <LoadingSpinner />
            ) : (
              <div className='answers-list'>
                {quizAnswers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`answer-item ${
                      answer.is_correct ? 'correct' : 'wrong'
                    }`}
                  >
                    <div className='answer-header'>
                      <span className='result-icon'>
                        {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <div className='result-block'>
                      <div className='result-term'>
                        <span className='result-label'>Term</span>
                        <span className='result-value'>{answer.term}</span>
                      </div>

                      {answer.is_correct ? (
                        <div className='result-definition'>
                          <span className='result-label'>Answer</span>
                          <span className='result-value'>
                            {answer.user_answer}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className='result-definition'>
                            <span className='result-label'>Correct Answer</span>
                            <span className='result-value'>
                              {answer.correct_answer}
                            </span>
                          </div>

                          <div className='result-user'>
                            <span className='result-label'>Your Answer</span>
                            <span className='result-value'>
                              {answer.user_answer}
                            </span>
                          </div>
                        </>
                      )}
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
