import levels from "./levels";

function LevelSelect({ onSelectLevel, onBack }) {
  const grouped = levels.reduce((acc, level) => {
    acc[level.difficulty] = acc[level.difficulty] || [];
    acc[level.difficulty].push(level);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={onBack}>⬅ Back</button>
      <h2>🧱 Bridge Builder – Select Level</h2>

      {Object.keys(grouped).map(diff => (
        <div key={diff} style={{ marginTop: "20px" }}>
          <h3>{diff}</h3>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {grouped[diff].map(level => (
              <button
                key={level.id}
                onClick={() => onSelectLevel(level.id - 1)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Level {level.id}
                <br />
                <small>{level.name}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default LevelSelect;
