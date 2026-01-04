import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../styles/StaticPage.module.css";

function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: January 2, 2026</p>
        
        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            Welcome to SquadZoo. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you about how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Information We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
          <ul className={styles.list}>
            <li><strong>Usage Data:</strong> Information about how you use our website and games</li>
            <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting, browser plug-in types and versions</li>
            <li><strong>Game Data:</strong> Player names you enter, game scores, and gameplay statistics (stored locally in your browser)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect in the following ways:</p>
          <ul className={styles.list}>
            <li>To provide and maintain our gaming services</li>
            <li>To improve user experience and game functionality</li>
            <li>To analyze usage patterns and trends</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To display relevant advertisements through Google AdSense</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and store certain information. 
            Cookies are files with small amounts of data which may include an anonymous unique identifier.
          </p>
          <p>We use the following types of cookies:</p>
          <ul className={styles.list}>
            <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
            <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements through Google AdSense</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Third-Party Services</h2>
          <p>We may employ third-party companies and services:</p>
          <ul className={styles.list}>
            <li><strong>Google AdSense:</strong> For displaying advertisements. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.</li>
            <li><strong>Analytics Services:</strong> To monitor and analyze the use of our service</li>
          </ul>
          <p>
            These third parties have access to your personal data only to perform these tasks on our behalf and are 
            obligated not to disclose or use it for any other purpose.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Data Storage and Security</h2>
          <p>
            Most game data (player names, game progress) is stored locally in your browser and is not transmitted to our servers. 
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized 
            or unlawful processing and against accidental loss, destruction or damage.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Your Rights</h2>
          <p>Under data protection laws, you have rights including:</p>
          <ul className={styles.list}>
            <li>The right to access your personal data</li>
            <li>The right to correct inaccurate personal data</li>
            <li>The right to erase your personal data</li>
            <li>The right to object to processing of your personal data</li>
            <li>The right to data portability</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>8. Children's Privacy</h2>
          <p>
            Our service is intended for general audiences. We do not knowingly collect personally identifiable information 
            from children under 13. If you are a parent or guardian and you are aware that your child has provided us with 
            personal data, please contact us.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through our Contact page.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default PrivacyPolicy;
