import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../styles/StaticPage.module.css";

function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "What is SquadZoo?",
      answer: "SquadZoo is a free online platform offering multiplayer puzzle and strategy games like Word Chain, Tic-Tac-Toe, Battleship, and Draw & Guess. Play with friends without downloads or sign-ups!"
    },
    {
      question: "Are the games really free?",
      answer: "Yes! All games on SquadZoo are 100% free. No hidden costs, no subscriptions, no in-app purchases."
    },
    {
      question: "Do I need to create an account?",
      answer: "No account needed! Just enter your name and start playing instantly. Share a room code with friends to play together online."
    },
    {
      question: "How many players can play together?",
      answer: "It depends on the game. Tic-Tac-Toe and Battleship support 2 players, while Word Chain and Draw & Guess support 2-12 players."
    },
    {
      question: "Can I play on mobile devices?",
      answer: "Absolutely! SquadZoo works on any device with a web browser - smartphones, tablets, laptops, and desktops."
    },
    {
      question: "How do I invite friends to play?",
      answer: "Create a room and share the 8-character room code with your friends. They can enter the code to join your game instantly."
    },
    {
      question: "What browsers are supported?",
      answer: "SquadZoo works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera."
    },
    {
      question: "Are the games educational?",
      answer: "Yes! Games like Word Chain improve vocabulary, while Tic-Tac-Toe and Battleship develop strategic thinking and problem-solving skills."
    },
    {
      question: "Can I play offline or locally?",
      answer: "Yes! Most games offer both local play (on the same device) and online multiplayer modes."
    },
    {
      question: "Is there a time limit for games?",
      answer: "Most games have optional time limits to keep gameplay exciting, but you can play at your own pace."
    },
    {
      question: "What is Word Chain game?",
      answer: "Word Chain is a word game where players create a chain of words. Each word must start with the last letter of the previous word. It's great for building vocabulary!"
    },
    {
      question: "How do I play Draw & Guess?",
      answer: "Players take turns drawing a word while others guess. It's like Pictionary online - fun for parties and groups!"
    },
    {
      question: "Is my data safe?",
      answer: "Yes! We don't collect personal data. No accounts means no stored information. Room codes are temporary and deleted after games end."
    },
    {
      question: "Can I report bugs or suggest features?",
      answer: "Yes! Use our Contact page to report bugs, suggest new games, or share feedback. We love hearing from our players!"
    },
    {
      question: "Will you add more games?",
      answer: "Yes! We're constantly working on new puzzle, word, and strategy games. Check back regularly for updates."
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | SquadZoo Games</title>
        <meta name="description" content="Get answers to common questions about SquadZoo multiplayer puzzle games. Learn how to play, invite friends, and enjoy free online games without downloads." />
        <meta name="keywords" content="squadzoo faq, how to play puzzle games, multiplayer game questions, online games help, word chain how to play, free games faq" />
        <link rel="canonical" href="https://www.squadzoo.games/faq" />
        <meta property="og:title" content="SquadZoo FAQ - Your Questions Answered" />
        <meta property="og:description" content="Find answers to frequently asked questions about SquadZoo free multiplayer puzzle and strategy games." />
        <meta property="og:url" content="https://www.squadzoo.games/faq" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>

      <div className={styles.pageContainer}>
        <Header />
        
        <main className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>Frequently Asked Questions</h1>
            <p className={styles.subtitle}>
              Everything you need to know about SquadZoo multiplayer puzzle and strategy games
            </p>
          </div>

          <div className={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
                <h2 className={styles.faqQuestion}>{faq.question}</h2>
                <p className={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className={styles.ctaSection}>
            <h2>Ready to Play?</h2>
            <p>Start playing free multiplayer puzzle and strategy games now!</p>
            <button onClick={() => navigate("/")} className={styles.ctaButton}>
              Browse Games
            </button>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default FAQ;
