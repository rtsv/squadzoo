import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import games from "../data/games";
import GameCard from "../components/GameCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../styles/Home.module.css";
import logo from "/public/images/squad-zoo-logo.png";

function Home() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handlePlayGame = (gameId) => {
    const gameRoutes = {
      "draw-guess": "/games/draw-and-guess",
      "word-chain": "/games/word-chain",
      "tic-tac-toe": "/games/tic-tac-toe",
      "battleship": "/games/battleship",
      "ludo": "/games/ludo"
    };
    navigate(gameRoutes[gameId]);
  };

  return (
    <>
      <Helmet>
        <title>SquadZoo - Free Multiplayer Puzzle Games Online | Play with Friends</title>
        <meta name="description" content="Play free multiplayer puzzle and strategy games online at SquadZoo. Enjoy Word Chain, Tic-Tac-Toe, Battleship, and Draw & Guess with friends. No downloads or sign-ups required!" />
        <meta name="keywords" content="multiplayer games, puzzle games, logic games, online games, word chain, tic-tac-toe, battleship, draw and guess, free games, party games" />
        <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
        <link rel="canonical" href="https://squadzoo.games/" />
        <meta property="og:title" content="SquadZoo - Free Multiplayer Puzzle & Strategy Games Online" />
        <meta property="og:description" content="Challenge your mind with fun multiplayer games. Play with friends online - no downloads required!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadzoo.games/" />
        <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SquadZoo - Free Multiplayer Puzzle Games" />
        <meta name="twitter:description" content="Play free multiplayer puzzle games online with friends" />
      </Helmet>
      <div className={styles.container}>
        <Header />

        {/* Hero Section */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle} id="hero-title">
              Welcome to SquadZoo - Free Multiplayer Puzzle & Strategy Games
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
                <span>Mind Training & Strategy</span>
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
            <p className={styles.sectionSubtitle}>Choose a puzzle or strategy game and start playing with friends online</p>
          </div>
          <div className={styles.gamesGrid} data-count={games.length} role="list">
            {games.map(game => (
              <div key={game.id} role="listitem">
                <GameCard
                  icon={game.icon}
                  title={game.title}
                  description={game.description}
                  onPlay={() => handlePlayGame(game.id)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Featured Game Highlights Section */}
        <section className={styles.highlightsSection} aria-labelledby="highlights-title">
          <h2 className={styles.sectionTitle} id="highlights-title">🌟 Popular Games</h2>
          <div className={styles.highlightGrid}>
            <article className={styles.highlightCard}>
              <h3>⛓️ Word Chain Game</h3>
              <p>
                Build your vocabulary with our most popular word game! Each word must start with the last letter of the previous word. 
                Perfect for students and word game enthusiasts. <button onClick={() => navigate("/games/word-chain")} className={styles.textLink}>Learn more about Word Chain →</button>
              </p>
            </article>
            <article className={styles.highlightCard}>
              <h3>🎨 Draw & Guess</h3>
              <p>
                Like Pictionary but online! Take turns drawing while others guess. Great for parties and creative fun. 
                <button onClick={() => navigate("/games/draw-and-guess")} className={styles.textLink}>How to play Draw & Guess →</button>
              </p>
            </article>
            <article className={styles.highlightCard}>
              <h3>⭕ Tic-Tac-Toe</h3>
              <p>
                Classic strategy game for two players. Simple to learn, challenging to master. Play locally or online with friends. 
                <button onClick={() => navigate("/games/tic-tac-toe")} className={styles.textLink}>Play Tic-Tac-Toe now →</button>
              </p>
            </article>
            <article className={styles.highlightCard}>
              <h3>🚢 Battleship</h3>
              <p>
                Naval warfare strategy at its best! Sink your opponent's fleet in this tactical multiplayer game. 
                <button onClick={() => navigate("/games/battleship")} className={styles.textLink}>Explore Battleship →</button>
              </p>
            </article>
          </div>
        </section>

        {/* About Section */}
        <section className={styles.aboutSection} aria-labelledby="why-title">
          <div className={styles.aboutContent}>
            <h2 className={styles.aboutTitle} id="why-title">Why Choose SquadZoo for Online Multiplayer Games?</h2>
            <div className={styles.aboutGrid}>
              <article className={styles.aboutCard}>
                <div className={styles.aboutIcon} aria-hidden="true">🎯</div>
                <h3>Easy to Play Online</h3>
                <p>No downloads, no sign-ups. Just click and play instantly with your friends. Our free multiplayer games work on any device with a browser. <button onClick={() => navigate("/faq")} className={styles.textLink}>Check our FAQ</button> for more details.</p>
              </article>
              <article className={styles.aboutCard}>
                <div className={styles.aboutIcon} aria-hidden="true">🧠</div>
                <h3>Mind-Boosting Games</h3>
                <p>Games designed to enhance vocabulary, creativity, and strategic thinking. Perfect for educational fun and mental exercise. Our <button onClick={() => navigate("/games/word-chain")} className={styles.textLink}>Word Chain game</button> is especially popular with educators.</p>
              </article>
              <article className={styles.aboutCard}>
                <div className={styles.aboutIcon} aria-hidden="true">👥</div>
                <h3>Social & Multiplayer Fun</h3>
                <p>Connect with friends and family through competitive multiplayer gameplay. Great for parties, virtual hangouts, or family game nights. <button onClick={() => navigate("/faq")} className={styles.textLink}>Learn how to invite friends</button> to your game room.</p>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ CTA Section */}
        <section className={styles.ctaSection} aria-labelledby="cta-title">
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle} id="cta-title">Have Questions?</h2>
            <p className={styles.ctaText}>
              Check out our comprehensive FAQ to learn how to play, invite friends, and get the most out of SquadZoo's free multiplayer puzzle and strategy games.
            </p>
            <button onClick={() => navigate("/faq")} className={styles.ctaButton}>
              View FAQ & Game Guides
            </button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Home;
