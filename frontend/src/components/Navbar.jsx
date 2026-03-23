import { Link } from "react-router-dom";
import { useAuth as getAuth } from "../contexts/AuthContext";
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = getAuth();

  return (
    <nav className="navbar">
      <div className="navbar-flashy">
        <Link to={user ? "/dashboard" : "/"}>Flashy</Link>
      </div>

      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard" className="set-btn">My Sets</Link>
            <div className="user-section">
              <span className="username">{user.username}</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/register" className="nav-btn">Register</Link>
          </>
        )}
      </div>
    </nav>
  );


}
