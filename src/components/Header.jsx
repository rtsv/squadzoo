import { useNavigate } from "react-router-dom";
import styles from "../styles/Home.module.css";
import logo from "/public/images/squad-zoo-logo.png";

function Header() {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo} onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="SquadZoo - Free Multiplayer Brain Games" className={styles.logoImage} />
          <span className={styles.logoText}>
            <span className={styles.logoTextSquad}>Squad</span>
            <span className={styles.logoTextZoo}>Zoo</span>
          </span>
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          <button onClick={() => navigate("/")} className={styles.navLink} aria-label="Go to Home">Home</button>
          <button onClick={() => navigate("/about")} className={styles.navLink} aria-label="Learn About Us">About</button>
          <button onClick={() => navigate("/contact")} className={styles.navLink} aria-label="Contact Us">Contact</button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
