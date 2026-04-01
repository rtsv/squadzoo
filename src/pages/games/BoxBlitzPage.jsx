import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import GameDescription from "../../components/GameDescription";
import BoxBlitz from "../../games/box-blitz/BoxBlitz";

function BoxBlitzPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate("/games/box-blitz/play" + location.search);
    }
  };

  const gameDescription = {
    title: "Box Blitz",
    description:
      "Play Box Blitz online with friends! Draw lines, complete boxes, and score points with dice-powered turns. Complete a box to gain bonus moves and dominate the board.",
    features: [
      "📦 Dots-and-boxes gameplay with dice mechanics",
      "🎲 Dice decides how many lines you can draw per turn",
      "👥 2-4 players local and online multiplayer",
      "🧠 Tactical line placement and box capture strategy",
      "🔁 Play again with same players and live score tracking",
      "🌐 Browser-based and mobile-friendly",
    ],
    howToPlay:
      "Roll the dice, then draw that many lines between adjacent dots. Completing a box scores a point and gives bonus moves. When all boxes are claimed, player with highest score wins.",
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Box Blitz Online | SquadZoo</title>
            <meta name="description" content="Active Box Blitz game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/box-blitz" />
          </>
        ) : (
          <>
            <title>{`Play Box Blitz Online Free - Multiplayer Strategy Game 2026 | SquadZoo`}</title>
            <meta name="description" content="Play Box Blitz online with friends! Draw lines, complete boxes, score points, and win in this dice-powered multiplayer strategy game for 2-4 players." />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/box-blitz" />
          </>
        )}
      </Helmet>

      <BoxBlitz
        onBack={() => navigate("/")}
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default BoxBlitzPage;
