import styles from "../styles/StaticPage.module.css";
import logo from "/public/images/squad-zoo-logo.png";

function AboutUs({ onBack }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <img src={logo} alt="SquadZoo Logo" className={styles.logoImage} />
          <span className={styles.logoText}>
            <span className={styles.logoTextSquad}>Squad</span>
            <span className={styles.logoTextZoo}>Zoo</span>
          </span>
        </div>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Home
        </button>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>About SquadZoo</h1>
        
        <section className={styles.section}>
          <h2>Welcome to SquadZoo!</h2>
          <p>
            SquadZoo is your ultimate destination for fun, engaging, and educational multiplayer games. 
            We believe that learning and entertainment go hand in hand, and our mission is to provide games 
            that challenge your mind while keeping you entertained.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Our Mission</h2>
          <p>
            Our mission is to create a platform where people of all ages can come together to enjoy 
            brain-stimulating games that enhance cognitive abilities, improve vocabulary, boost creativity, 
            and develop strategic thinking skills. We aim to make learning fun and accessible to everyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What We Offer</h2>
          <ul className={styles.list}>
            <li><strong>Multiplayer Games:</strong> Play with friends and family in real-time competitive gameplay</li>
            <li><strong>Brain Training:</strong> Games designed to enhance vocabulary, memory, and critical thinking</li>
            <li><strong>Free to Play:</strong> All our games are completely free with no hidden costs</li>
            <li><strong>No Downloads:</strong> Play instantly in your browser without any installations</li>
            <li><strong>Regular Updates:</strong> We continuously add new games and features</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Our Games</h2>
          <p>
            Currently, SquadZoo features exciting games like Word Chain, Draw & Guess, and Bridge Builder. 
            Each game is carefully crafted to provide both entertainment and educational value. Whether you're 
            looking to improve your vocabulary, test your artistic skills, or challenge your problem-solving 
            abilities, we have something for everyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Why Choose SquadZoo?</h2>
          <ul className={styles.list}>
            <li><strong>Educational Value:</strong> Our games are designed with learning in mind</li>
            <li><strong>Social Interaction:</strong> Connect with friends and family through shared gameplay</li>
            <li><strong>Safe Environment:</strong> We maintain a safe and friendly gaming environment</li>
            <li><strong>Cross-Platform:</strong> Play on any device - desktop, tablet, or mobile</li>
            <li><strong>User-Friendly:</strong> Simple, intuitive interfaces that anyone can use</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Our Commitment</h2>
          <p>
            We are committed to providing high-quality gaming experiences that are both fun and beneficial. 
            We value user feedback and continuously work to improve our platform based on your suggestions. 
            Your privacy and satisfaction are our top priorities.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Get in Touch</h2>
          <p>
            Have questions, suggestions, or feedback? We'd love to hear from you! Visit our Contact page 
            to get in touch with our team.
          </p>
        </section>
      </div>
    </div>
  );
}

export default AboutUs;
