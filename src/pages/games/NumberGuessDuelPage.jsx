import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import GameDescription from "../../components/GameDescription";
import NumberGuessDuel from "../../games/number-guess-duel/NumberGuessDuel";

function NumberGuessDuelPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate("/games/number-guess-duel/play" + location.search);
    }
  };

  const gameDescription = {
    title: "Number Guess Duel",
    description:
      "Two players each hide a secret number, then take turns guessing the other’s number with Higher, Lower, or Correct hints. First to hit the opponent’s number wins the round.",
    features: [
      "🔢 Classic higher-or-lower duel for exactly 2 players",
      "🏠 Local pass-and-play or online rooms",
      "🔐 Secrets stay hidden — hints only",
      "📊 Per-player guess history",
      "🎚️ Optional ranges: 1–50, 1–100, or 1–500",
    ],
    howToPlay:
      "Each player picks a secret number in the chosen range. On your turn, guess your opponent’s number. You’ll be told if the answer is higher, lower, or correct. First correct guess wins.",
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Number Guess Duel | SquadZoo</title>
            <meta name="description" content="Active Number Guess Duel game in progress. Ad-free play session." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/number-guess-duel" />
          </>
        ) : (
          <>
            <title>Play Number Guess Duel Online Free — 2 Player Guessing Game 2026 | SquadZoo</title>
            <meta
              name="description"
              content="Play Number Guess Duel online: hide a number, guess your opponent’s, get Higher/Lower hints. Free 2-player game — local or multiplayer."
            />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/number-guess-duel" />
          </>
        )}
      </Helmet>

      <NumberGuessDuel
        onBack={() => navigate("/")}
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default NumberGuessDuelPage;
