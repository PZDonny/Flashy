import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api.js';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <div className='navbar-container'>
      <nav className='navbar'>
        <div className='flashy'>
          <Link to={user ? '/dashboard' : '/'}>Flashy</Link>
        </div>

        <div className='links'>
          {user ? (
            <>
              <Link to='/dashboard' className='set-btn'>
                My Sets
              </Link>
              <div className='user-section'>
                <span className='username'>{user.username}</span>
                <Link to='/'>
                  <button className='logout-btn' onClick={api.logout}>
                    Logout
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to='/login' className='nav-btn'>
                Login
              </Link>
              <Link to='/register' className='nav-btn'>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
