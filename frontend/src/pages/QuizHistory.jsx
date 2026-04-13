import { useParams } from "react-router-dom"
import React, { useEffect, useState } from 'react'
import { api } from '../api'

function QuizHistory() {
    const { setId } = useParams();
    const [quizHistories, setQuizHistories] = useState([]);

    useEffect(() => {
        const fetchQuizHistory = async () => {
            try {
                const data = await api.get(`/sets/${setId}/quiz_history`);
                setQuizHistories(data);
            } catch (err) {
                console.error("Error fetching quiz history:", err);
            }
        };
        fetchQuizHistory();
    }, [setId])

    return (
        <>
            <div>todo</div>
            {quizHistories.length == 0 ? <p>No quiz history found for this set.</p> : (
                quizHistories.map((history) => (
                    <div key={history.id}>
                        <h3>{history.title}</h3>
                        <p>{history.description}</p>
                    </div>
                ))
            )}
        </>

    )
}

export default QuizHistory