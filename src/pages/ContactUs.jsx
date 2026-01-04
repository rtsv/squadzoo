import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../styles/StaticPage.module.css";

function ContactUs() {
  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <h1 className={styles.title}>Contact Us</h1>
        
        <section className={styles.section}>
          <h2>Get in Touch</h2>
          <p>
            We'd love to hear from you! Whether you have questions, suggestions, feedback, or just want to say hello, 
            feel free to reach out to us.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Contact Information</h2>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <strong>Email:</strong>
              <p>contact@squadzoo.com</p>
            </div>
            <div className={styles.contactItem}>
              <strong>Support:</strong>
              <p>support@squadzoo.com</p>
            </div>
            {/* <div className={styles.contactItem}>
              <strong>Business Inquiries:</strong>
              <p>business@squadzoo.com</p>
            </div> */}
          </div>
        </section>

        <section className={styles.section}>
          <h2>What You Can Contact Us About</h2>
          <ul className={styles.list}>
            <li><strong>Game Suggestions:</strong> Have an idea for a new game? We'd love to hear it!</li>
            <li><strong>Bug Reports:</strong> Found a problem? Let us know so we can fix it.</li>
            <li><strong>Feature Requests:</strong> Want to see a new feature? Share your thoughts!</li>
            <li><strong>General Feedback:</strong> Tell us what you think about SquadZoo.</li>
            <li><strong>Partnership Opportunities:</strong> Interested in collaborating? Get in touch!</li>
            <li><strong>Privacy Concerns:</strong> Questions about your data? We're here to help.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Response Time</h2>
          <p>
            We strive to respond to all inquiries within 24-48 hours during business days. For urgent matters, 
            please mark your email as "Urgent" in the subject line.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Follow Us</h2>
          <p>
            Stay updated with the latest games, features, and news by following us on social media and bookmarking 
            our website.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default ContactUs;
