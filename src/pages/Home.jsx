import games from "../data/games";
import GameCard from "../components/GameCard";
import styles from "../styles/Home.module.css";
import logo from "/public/images/squad-zoo-logo.png";

function Home({ onPlayGame, onNavigate }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <img src={logo} alt="SquadZoo - Free Multiplayer Brain Games" className={styles.logoImage} />
            <span className={styles.logoText}>
              <span className={styles.logoTextSquad}>Squad</span>
              <span className={styles.logoTextZoo}>Zoo</span>
            </span>
          </div>
          <nav className={styles.nav} aria-label="Main navigation">
            <button onClick={() => onNavigate("home")} className={styles.navLink} aria-label="Go to Home">Home</button>
            <button onClick={() => onNavigate("about")} className={styles.navLink} aria-label="Learn About Us">About</button>
            <button onClick={() => onNavigate("contact")} className={styles.navLink} aria-label="Contact Us">Contact</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle} id="hero-title">
            <span className={styles.heroEmoji} aria-hidden="true">🧠</span>
            Welcome to SquadZoo - Free Multiplayer Brain Games
          </h1>
          <p className={styles.heroSubtitle}>
            Challenge your mind with fun, interactive multiplayer games. Play Word Chain, Tic-Tac-Toe, Battleship, and Draw & Guess with friends online. No downloads, no sign-ups required!
          </p>
          <div className={styles.heroFeatures}>
            <div className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">🎮</span>
              <span>Free Multiplayer Games</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">🧩</span>
              <span>Brain Training & Strategy</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">🎉</span>
              <span>Play Instantly - No Login</span>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className={styles.gamesSection} aria-labelledby="games-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="games-title">🎯 Featured Multiplayer Games</h2>
          <p className={styles.sectionSubtitle}>Choose a brain game and start playing with friends online</p>
        </div>
        <div className={styles.gamesGrid} role="list">
          {games.map(game => (
            <div key={game.id} role="listitem">
              <GameCard
                icon={game.icon}
                title={game.title}
                description={game.description}
                onPlay={() => onPlayGame(game.id)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className={styles.aboutSection} aria-labelledby="why-title">
        <div className={styles.aboutContent}>
          <h2 className={styles.aboutTitle} id="why-title">Why Choose SquadZoo for Online Brain Games?</h2>
          <div className={styles.aboutGrid}>
            <article className={styles.aboutCard}>
              <div className={styles.aboutIcon} aria-hidden="true">🎯</div>
              <h3>Easy to Play Online</h3>
              <p>No downloads, no sign-ups. Just click and play instantly with your friends. Our free multiplayer games work on any device with a browser.</p>
            </article>
            <article className={styles.aboutCard}>
              <div className={styles.aboutIcon} aria-hidden="true">🧠</div>
              <h3>Brain Boosting Games</h3>
              <p>Games designed to enhance vocabulary, creativity, and strategic thinking. Perfect for educational fun and mental exercise.</p>
            </article>
            <article className={styles.aboutCard}>
              <div className={styles.aboutIcon} aria-hidden="true">👥</div>
              <h3>Social & Multiplayer Fun</h3>
              <p>Connect with friends and family through competitive multiplayer gameplay. Great for parties, virtual hangouts, or family game nights.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>SquadZoo</h3>
            <p className={styles.footerDescription}>
              Your destination for free multiplayer brain games and educational gaming experiences. Play online with friends - no downloads required!
            </p>
          </div>
          <nav className={styles.footerSection} aria-label="Footer navigation">
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><button onClick={() => onNavigate("home")} className={styles.footerLink}>Home</button></li>
              <li><button onClick={() => onNavigate("about")} className={styles.footerLink}>About Us</button></li>
              <li><button onClick={() => onNavigate("contact")} className={styles.footerLink}>Contact</button></li>
            </ul>
          </nav>
          <nav className={styles.footerSection} aria-label="Legal information">
            <h4 className={styles.footerHeading}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><button onClick={() => onNavigate("privacy")} className={styles.footerLink}>Privacy Policy</button></li>
              <li><button onClick={() => onNavigate("terms")} className={styles.footerLink}>Terms of Service</button></li>
              <li><button onClick={() => onNavigate("disclaimer")} className={styles.footerLink}>Disclaimer</button></li>
            </ul>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} SquadZoo. All rights reserved. Free Multiplayer Brain Games Online.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
