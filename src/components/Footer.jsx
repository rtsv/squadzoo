import { useNavigate } from "react-router-dom";
import styles from "../styles/Home.module.css";

function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>SquadZoo</h3>
          <p className={styles.footerDescription}>
            Free multiplayer brain games for everyone. Challenge your mind, play with friends!
          </p>
        </div>
        <div className={styles.footerSection}>
          <h4 className={styles.footerSubtitle}>Quick Links</h4>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <button onClick={() => navigate("/")} className={styles.footerLink}>Home</button>
            <button onClick={() => navigate("/about")} className={styles.footerLink}>About Us</button>
            <button onClick={() => navigate("/contact")} className={styles.footerLink}>Contact</button>
          </nav>
        </div>
        <div className={styles.footerSection}>
          <h4 className={styles.footerSubtitle}>Legal</h4>
          <nav className={styles.footerLinks} aria-label="Legal navigation">
            <button onClick={() => navigate("/privacy")} className={styles.footerLink}>Privacy Policy</button>
            <button onClick={() => navigate("/terms")} className={styles.footerLink}>Terms of Service</button>
            <button onClick={() => navigate("/disclaimer")} className={styles.footerLink}>Disclaimer</button>
          </nav>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p className={styles.copyright}>© {currentYear} SquadZoo. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
