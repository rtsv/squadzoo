import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Ludo from "../../games/ludo/Ludo";
import GameDescription from "../../components/GameDescription";

function LudoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const gameDescription = {
    title: "Ludo",
    description: "Play Ludo online free with friends! This classic board game challenges 2-4 players to race their tokens around the board and reach home first. Perfect for family fun, strategic gameplay, and competitive entertainment. No downloads required - works on mobile and desktop browsers.",
    features: [
      "🎲 Classic Ludo gameplay - Race your tokens to victory",
      "🎮 Free online multiplayer and local play modes",
      "👥 2-4 players supported",
      "🧠 Develop strategic thinking and planning skills",
      "📱 Mobile-friendly - Play anywhere, anytime",
      "🌐 No download or registration required"
    ],
    howToPlay: "Roll the dice and move your tokens around the board. Roll a 6 to move a token out of home and get an extra turn! Land on opponents to send them back home (unless they're on a safe spot). First player to get all 4 tokens home wins! Create a room to play online with friends remotely, or choose local mode to play on the same device."
  };

  return (
    <>
      <Helmet>
        <title>Ludo - Online Multiplayer Board Game | SquadZoo</title>
        <meta name="description" content="Play classic Ludo online with friends! Free multiplayer board game for 2-4 players. Race your tokens around the board in this timeless strategy game." />
        <meta name="keywords" content="ludo online, ludo game, multiplayer ludo, board game online, classic ludo, ludo with friends" />
        <link rel="canonical" href="https://squadzoo.games/games/ludo" />
        <meta property="og:title" content="Ludo - Free Online Multiplayer Board Game" />
        <meta property="og:description" content="Play classic Ludo online with friends! Free multiplayer board game for 2-4 players." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadzoo.games/games/ludo" />
        <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ludo - Online Multiplayer Board Game" />
        <meta name="twitter:description" content="Play Ludo online with friends! Free strategic board game." />
      </Helmet>
      
      <Ludo onBack={() => navigate("/")} initialRoomCode={roomCode} />
      <GameDescription {...gameDescription} />
    </>
  );
}

export default LudoPage;