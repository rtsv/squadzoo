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
            <img src={logo} alt="SquadZoo Logo" className={styles.logoImage} />
            <span className={styles.logoText}>
              <span className={styles.logoTextSquad}>Squad</span>
              <span className={styles.logoTextZoo}>Zoo</span>
            </span>
          </div>
          <nav className={styles.nav}>
            <button onClick={() => onNavigate("home")} className={styles.navLink}>Home</button>
            <button onClick={() => onNavigate("about")} className={styles.navLink}>About</button>
            <button onClick={() => onNavigate("contact")} className={styles.navLink}>Contact</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* <img src="/images/brainy-playground.png" alt="SquadZoo" className={styles.heroLogo} /> */}
          <h1 className={styles.heroTitle}>
            <span className={styles.heroEmoji}>🧠</span>
            Welcome to SquadZoo
          </h1>
          <p className={styles.heroSubtitle}>
            Challenge your mind with fun, interactive multiplayer games. Play together, think smarter!
          </p>
          <div className={styles.heroFeatures}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎮</span>
              <span>Multiplayer Games</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🧩</span>
              <span>Brain Training</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎉</span>
              <span>Fun & Free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🎯 Featured Games</h2>
          <p className={styles.sectionSubtitle}>Choose a game and start playing with friends</p>
        </div>
        <div className={styles.gamesGrid}>
          {games.map(game => (
            <GameCard
              key={game.id}
              icon={game.icon}
              title={game.title}
              description={game.description}
              onPlay={() => onPlayGame(game.id)}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutContent}>
          <h2 className={styles.aboutTitle}>Why SquadZoo?</h2>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCard}>
              <div className={styles.aboutIcon}>🎯</div>
              <h3>Easy to Play</h3>
              <p>No downloads, no sign-ups. Just click and play instantly with your friends.</p>
            </div>
            <div className={styles.aboutCard}>
              <div className={styles.aboutIcon}>🧠</div>
              <h3>Brain Boosting</h3>
              <p>Games designed to enhance vocabulary, creativity, and strategic thinking.</p>
            </div>
            <div className={styles.aboutCard}>
              <div className={styles.aboutIcon}>👥</div>
              <h3>Social Fun</h3>
              <p>Connect with friends and family through competitive multiplayer gameplay.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>SquadZoo</h3>
            <p className={styles.footerDescription}>
              Your destination for fun and educational multiplayer games that challenge your mind.
            </p>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><button onClick={() => onNavigate("home")} className={styles.footerLink}>Home</button></li>
              <li><button onClick={() => onNavigate("about")} className={styles.footerLink}>About Us</button></li>
              <li><button onClick={() => onNavigate("contact")} className={styles.footerLink}>Contact</button></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><button onClick={() => onNavigate("privacy")} className={styles.footerLink}>Privacy Policy</button></li>
              <li><button onClick={() => onNavigate("terms")} className={styles.footerLink}>Terms of Service</button></li>
              <li><button onClick={() => onNavigate("disclaimer")} className={styles.footerLink}>Disclaimer</button></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} SquadZoo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
