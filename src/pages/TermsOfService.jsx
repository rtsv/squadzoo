import styles from "../styles/StaticPage.module.css";

function TermsOfService({ onBack }) {
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
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last Updated: January 2, 2026</p>
        
        <section className={styles.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using SquadZoo ("the Service"), you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Description of Service</h2>
          <p>
            SquadZoo provides online multiplayer games that are designed to be educational and entertaining. 
            The Service is provided free of charge and is supported by advertising.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. User Eligibility</h2>
          <p>
            Our Service is intended for users of all ages. However, users under the age of 13 should use our Service 
            under parental supervision. By using our Service, you represent that you meet these eligibility requirements.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. User Conduct</h2>
          <p>You agree to use the Service only for lawful purposes. You agree not to:</p>
          <ul className={styles.list}>
            <li>Use the Service in any way that violates any applicable laws or regulations</li>
            <li>Use offensive, inappropriate, or abusive language in player names or game content</li>
            <li>Attempt to interfere with or disrupt the Service or servers</li>
            <li>Use any automated means to access the Service</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Intellectual Property Rights</h2>
          <p>
            The Service and its original content, features, and functionality are owned by SquadZoo and are 
            protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. User-Generated Content</h2>
          <p>
            Users may create content such as player names and drawings within games. By creating content, you grant us 
            a non-exclusive, royalty-free license to use, reproduce, and display such content solely for the purpose 
            of operating and improving the Service. You retain all rights to your content.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Advertising</h2>
          <p>
            The Service is supported by advertising through Google AdSense. By using our Service, you acknowledge and 
            agree that we may display advertisements. We do not control the content of advertisements displayed on our Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied. 
            We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Limitation of Liability</h2>
          <p>
            In no event shall SquadZoo, its directors, employees, partners, agents, suppliers, or affiliates, 
            be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
            limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Modifications to Service</h2>
          <p>
            We reserve the right to modify or discontinue the Service at any time, temporarily or permanently, with or 
            without notice. We shall not be liable to you or any third party for any modification, suspension, or 
            discontinuance of the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any changes by posting the 
            new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after any 
            such changes constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with applicable laws, without regard to its 
            conflict of law provisions.
          </p>
        </section>

        <section className={styles.section}>
          <h2>13. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us through our Contact page.
          </p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService;
