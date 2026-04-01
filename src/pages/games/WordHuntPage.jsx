import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import GameDescription from "../../components/GameDescription";
import WordHunt from "../../games/word-hunt/WordHunt";

function WordHuntPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate("/games/word-hunt/play" + location.search);
    }
  };

  const gameDescription = {
    title: "Word Hunt",
    description:
      "Race the clock in a 9×9 letter grid! Drag straight lines to spell valid English words. Play locally or online with 2–4 players in parallel — everyone searches at once.",
    features: [
      "🔍 9×9 grid with random letters",
      "✏️ Straight-line selection (8 directions)",
      "📖 Dictionary validation",
      "👥 2–4 players, local or online",
      "⚡ Parallel online play — no turn blocking",
      "⏱ Timed rounds with score by word length",
    ],
    howToPlay:
      "Drag across adjacent letters in a straight line to form a word of at least 3 letters. Submit valid words to score. Words can only be used once globally. Highest score when time runs out wins.",
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Word Hunt | SquadZoo</title>
            <meta name="description" content="Active Word Hunt game in progress." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/word-hunt" />
          </>
        ) : (
          <>
            <title>{`Play Word Hunt Online Free - Multiplayer Word Search ${new Date().getFullYear()} | SquadZoo`}</title>
            <meta
              name="description"
              content="Play Word Hunt online — a fast word search game on a 9×9 grid. Parallel multiplayer for 2–4 players, timed rounds, and dictionary-checked words."
            />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/word-hunt" />
          </>
        )}
      </Helmet>

      <WordHunt
        onBack={() => navigate("/")}
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default WordHuntPage;
