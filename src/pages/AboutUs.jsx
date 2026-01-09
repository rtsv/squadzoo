import { Helmet } from "react-helmet-async";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../styles/StaticPage.module.css";

function AboutUs() {
  return (
    <div className={styles.container}>
      <Helmet>
        <title>About Us - SquadZoo | Free Multiplayer Games Platform</title>
        <meta name="description" content="Learn about SquadZoo - Your destination for free multiplayer puzzle and strategy games. Play with friends online, challenge your mind, and have fun together!" />
        <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
      </Helmet>
      
      <Header />

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
            At SquadZoo, we believe in the power of games to bring people together. Our mission is to create 
            mind-stimulating games that enhance cognitive abilities, improve vocabulary, boost creativity, 
            and foster social connections. Whether you're looking for a quick mental workout or a fun way 
            to connect with friends and family, SquadZoo has something for everyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What We Offer</h2>
          <ul className={styles.list}>
            <li><strong>100% Free:</strong> All games are completely free to play with no hidden costs or subscriptions</li>
            <li><strong>No Downloads:</strong> Play instantly in your browser on any device</li>
            <li><strong>Mind Training:</strong> Games designed to enhance vocabulary, memory, and critical thinking</li>
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

      <Footer />
    </div>
  );
}

export default AboutUs;
