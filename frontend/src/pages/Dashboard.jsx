import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import SetSearchBar from '../components/SetSearchBar';
import star from '../assets/star.svg';
import '../styles/Dashboard.css';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [sets, setSets] = useState([]);
  const [search, setSearch] = useState('');
  const [searchDescription, setSearchDescription] = useState(false);

  const sortedSets = useMemo(() => {
    if (!sets) return [];
    //sorts again when sets changed, instead of on every rerender
    return [...sets].sort((a, b) => b.is_starred - a.is_starred);
  }, [sets]);

  const filteredSets = useMemo(() => {
    const query = search.toLowerCase();

    return sortedSets.filter((set) => {
      const inTitle = set.title.toLowerCase().includes(query);

      const inDescription =
        searchDescription &&
        (set.description || '').toLowerCase().includes(query);

      return inTitle || inDescription;
    });
  }, [sortedSets, search, searchDescription]);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const [setsData, analyticsData] = await Promise.all([
          api.get('/sets'),
          api.get('/analytics'),
        ]);
        setSets(setsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error(err);
      }
    };

    if (user) fetchSets();
  }, [user]);

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
    await api.patch(`/sets/${setId}`, { is_starred: !starred });
  };

  function createSet(set) {
    return (
      <div key={set.id} className={'set' + (set.is_starred ? ' starred' : '')}>
        <div className='set-content'>
          <div className='set-top'>
            <h3>{set.title}</h3>
            <img
              src={star}
              className='star'
              onClick={() => handleStarred(set.id, set.is_starred)}
              alt='star'
            ></img>
          </div>

          <p>{set.description || 'No description'}</p>
        </div>
        <div className='set-actions'>
          <Link to={`/sets/${set.id}`} className='view'>
            View Cards
          </Link>
          <button
            className='delete-icon-btn'
            onClick={() => handleDelete(set.id)}
            title='Delete Set'
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-container'>
      <header className='dashboard-header'>
        <div className='dashboard-header-top'>
          <h1>My Sets</h1>

          <Link to='/edit-set' className='create-btn'>
            <span>+</span> Create New Set
          </Link>
        </div>

        <div className='dashboard-header-search'>
          <SetSearchBar
            value={search}
            onChange={setSearch}
            searchDescription={searchDescription}
            onToggleDescription={setSearchDescription}
          />
        </div>
      </header>

      {!sets || !analytics ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className='dashboard-content'>
            <div className='sets'>
              {sets.length > 0 ? (
                filteredSets.length > 0 ? (
                  filteredSets.map((set) => createSet(set))
                ) : (
                  <div className='empty'>
                    <div className='empty-emoji'>❓</div>
                    <h2>No sets found</h2>
                    <p>
                      Try a different search or toggle set description search.
                    </p>
                  </div>
                )
              ) : (
                <div className='empty'>
                  <div className='empty-emoji'>📚</div>
                  <h2>You have no sets</h2>
                  <p>Create your first flashcard set to get started!</p>
                  <Link to='/edit-set' className='create-btn-large'>
                    + Create Your First Set
                  </Link>
                </div>
              )}
            </div>

            <div className='analytics'>
              <h2>Analytics</h2>

              <div className='analytics-item'>
                <span className='analytics-label'>Total Sets</span>
                <span className='analytics-value'>
                  {analytics?.total_sets ?? '-'}
                </span>
              </div>

              <div className='analytics-item'>
                <span className='analytics-label'>Quizzes Today</span>
                <span className='analytics-value'>
                  {analytics?.quizzes_today ?? '-'}
                </span>
              </div>

              <div className='analytics-item'>
                <span className='analytics-label'>Daily Quiz Streak</span>
                <span className='analytics-value'>
                  {analytics?.quiz_streak ?? '-'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
