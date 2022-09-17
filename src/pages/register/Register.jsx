import React from "react";
import axios from "axios";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";

const Register = () => {
  const [error, setError] = useState();
  const [credentials, setCredentials] = useState({
    username: undefined,
    email: undefined,
    country: undefined,
    city: undefined,
    phone: undefined,
    password: undefined,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/register", credentials);
      navigate("/login");
    } catch (err) {
      setError(err.response.data);
    }
  };

  return (
    <div className="register">
      <div className="lContainer">
        <h1>REGISTER NOW</h1>

        <input
          type="text"
          placeholder="username"
          id="username"
          onChange={handleChange}
          className="lInput"
        />

        <input
          type="email"
          placeholder="email"
          id="email"
          onChange={handleChange}
          className="lInput"
        />
        <input
          type="text"
          placeholder="country"
          id="country"
          onChange={handleChange}
          className="lInput"
        />

        <input
          type="text"
          placeholder="city"
          id="city"
          onChange={handleChange}
          className="lInput"
        />
        <input
          type="number"
          placeholder="phone number"
          id="phone"
          onChange={handleChange}
          className="lInput"
        />
        <input
          type="password"
          placeholder="enter password"
          id="password"
          onChange={handleChange}
          className="lInput"
        />

        <button onClick={handleClick} className="lButton">
          SignUp / Register
        </button>
        {error && <span>{error.message}</span>}
      </div>
    </div>
  );
};

export default Register;
