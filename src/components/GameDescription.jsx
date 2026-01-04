import styles from "../styles/GameDescription.module.css";

function GameDescription({ title, description, features, howToPlay }) {
  return (
    <div className={styles.descriptionContainer}>
      <div className={styles.descriptionSection}>
        <h2 className={styles.descriptionTitle}>About {title}</h2>
        <p className={styles.descriptionText}>{description}</p>
      </div>

      {features && features.length > 0 && (
        <div className={styles.featuresSection}>
          <h3 className={styles.sectionTitle}>✨ Key Features</h3>
          <ul className={styles.featuresList}>
            {features.map((feature, index) => (
              <li key={index} className={styles.featureItem}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {howToPlay && (
        <div className={styles.howToPlaySection}>
          <h3 className={styles.sectionTitle}>🎮 How to Play</h3>
          <p className={styles.howToPlayText}>{howToPlay}</p>
        </div>
      )}
    </div>
  );
}

export default GameDescription;
