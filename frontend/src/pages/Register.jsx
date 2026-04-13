import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import "../styles/Auth.css";
import SliderButton from "../components/SliderButton";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [response, setResponse] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setResponse("Passwords do not match");
      return;
    }

    try {
      await api.post("/register", formData);
      navigate("/login");
    } catch (err) {
      setResponse(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create an Account</h1>
        <p className="auth-desc">Join Flashy and study better.</p>

        {response && <div className="auth-error">{response}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="password-container">
            <div className="password-info">
              <p className="password-match">
                {(formData.password || formData.confirmPassword) &&
                formData.password !== formData.confirmPassword
                  ? "Passwords do not match"
                  : ""}
              </p>
              <div className="password-visibility">
                <p>Show Password</p>
                <SliderButton
                  small={true}
                  toggleListener={(state) => {
                    setShowPassword(state);
                  }}
                ></SliderButton>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm-password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            Register
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}
