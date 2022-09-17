import "./navbar.css";
import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
const Navbar = () => {
  const [show, setShow] = useState(false);
  const { user } = useContext(AuthContext);
  const clearsetitem = () => {
    localStorage.removeItem("user");
  };

  return (
    <div className="navbar">
      <div className="navContainer">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="logo">Booking</span>
        </Link>
        {user ? (
          <div className="navItems">
            <div className="navProfile">
              <img
                src={`${
                  user.img
                    ? user.img
                    : "https://i.pinimg.com/originals/56/2d/55/562d55c3067450571305a19d15eaa173.png"
                }`}
                alt="Admin"
                className="navImg"
                onClick={() => {
                  setShow(!show);
                }}
              />
            </div>
            {show && (
              <div className="navShow">
                <ul>
                  <li className="user">
                    <img src="https://www.pngmart.com/files/10/User-Account-PNG-Transparent-Image.png" />
                    <p>{user.username}</p>
                  </li>
                  <li
                    className="user"
                    onClick={() => {
                      clearsetitem();
                    }}
                  >
                    <Link
                      to="/login"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <img src="https://icons.veryicon.com/png/o/miscellaneous/unicons/exit-14.png" />
                      <p>LogOut</p>
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="navLogin">
            <button className="navButton">Register</button>
            <Link
              to="/login"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <button className="navButton">Login</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
