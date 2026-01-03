import styles from "../styles/StaticPage.module.css";

function Disclaimer({ onBack }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <img src="/images/brainy-playground.png" alt="SquadZoo Logo" className={styles.logoImage} />
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
        <h1 className={styles.title}>Disclaimer</h1>
        <p className={styles.lastUpdated}>Last Updated: January 2, 2026</p>
        
        <section className={styles.section}>
          <h2>1. General Information</h2>
          <p>
            The information provided by SquadZoo ("we," "us," or "our") on our website is for general 
            informational and entertainment purposes only. All information on the site is provided in good faith, 
            however we make no representation or warranty of any kind, express or implied, regarding the accuracy, 
            adequacy, validity, reliability, availability, or completeness of any information on the site.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. No Professional Advice</h2>
          <p>
            The content on SquadZoo is not intended to be a substitute for professional advice. The games 
            are designed for entertainment and educational purposes. Always seek the advice of qualified professionals 
            with any questions you may have regarding educational matters.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. External Links Disclaimer</h2>
          <p>
            The website may contain (or you may be sent through the website) links to other websites or content 
            belonging to or originating from third parties. We do not investigate, monitor, or check such external 
            links for accuracy, adequacy, validity, reliability, availability, or completeness.
          </p>
          <p>
            We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any 
            information offered by third-party websites linked through the site or any website or feature linked in 
            any banner or other advertising.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Gaming Content Disclaimer</h2>
          <p>
            Our games are designed for entertainment and educational purposes. While we strive to ensure all game 
            content is appropriate and accurate, we cannot guarantee that all user-generated content (such as player 
            names or drawings) will be appropriate. We encourage responsible use and parental supervision for younger users.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Technical Issues</h2>
          <p>
            We make every effort to ensure that our website and games function properly. However, we do not guarantee 
            that the website will be available at all times or that it will be free from errors, viruses, or other 
            harmful components. Your use of the website is at your own risk.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Educational Claims</h2>
          <p>
            While our games are designed to be educational and may help develop cognitive skills such as vocabulary, 
            memory, and strategic thinking, we make no guarantees about specific educational outcomes. Results may 
            vary by individual.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Advertising Disclaimer</h2>
          <p>
            This website is monetized through Google AdSense. We do not control the content of advertisements 
            displayed on our website. The appearance of advertisements on our website does not constitute an 
            endorsement or recommendation of any product or service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. No Liability</h2>
          <p>
            Under no circumstances shall we have any liability to you for any loss or damage of any kind incurred 
            as a result of the use of the website or reliance on any information provided on the website. Your use 
            of the website and your reliance on any information on the website is solely at your own risk.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Data Accuracy</h2>
          <p>
            We strive to ensure that all information on our website is accurate and up-to-date. However, we make no 
            warranties about the completeness, reliability, or accuracy of this information. Any action you take upon 
            the information on our website is strictly at your own risk.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Changes to Disclaimer</h2>
          <p>
            We reserve the right to make changes to this disclaimer at any time. Any changes will be posted on this 
            page with an updated revision date. Your continued use of the website following the posting of changes 
            constitutes your acceptance of such changes.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this disclaimer, please contact us through our Contact page.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Disclaimer;
