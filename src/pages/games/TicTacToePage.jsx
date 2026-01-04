import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import TicTacToe from "../../games/tic-tac-toe/TicTacToe";
import GameDescription from "../../components/GameDescription";

function TicTacToePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const gameDescription = {
    title: "Tic-Tac-Toe",
    description: "Play Tic-Tac-Toe online free with friends! This classic strategy game (also known as Noughts and Crosses) challenges your tactical thinking in a simple 3x3 grid. Perfect for quick games, strategic practice, and competitive fun. Play online multiplayer with friends or locally on the same device. No downloads required - works on all devices including mobile, tablet, and desktop.",
    features: [
      "⭕ Classic Tic-Tac-Toe gameplay - X's and O's strategy game",
      "🎮 Free online multiplayer and local play modes",
      "🧠 Develop strategic thinking and planning skills",
      "⚡ Quick games - Perfect for short breaks",
      "📱 Mobile-friendly - Play anywhere, anytime",
      "🌐 No download or registration required"
    ],
    howToPlay: "Two players take turns placing X's and O's on a 3x3 grid. The goal is to get three of your symbols in a row - horizontally, vertically, or diagonally. Block your opponent while planning your own winning move! Create a room to play online with friends remotely, or choose local mode to play on the same device."
  };

  return (
    <>
      <Helmet>
        <title>Tic-Tac-Toe - Online Multiplayer Game | SquadZoo</title>
        <meta name="description" content="Play classic Tic-Tac-Toe online with friends! Free multiplayer game with local and online modes. Challenge your strategic thinking in this timeless 3x3 grid game." />
        <meta name="keywords" content="tic tac toe, tic tac toe online, multiplayer tic tac toe, noughts and crosses, strategy game, classic game online" />
        <link rel="canonical" href="https://squadzoo.games/games/tic-tac-toe" />
        <meta property="og:title" content="Tic-Tac-Toe - Free Online Multiplayer Game" />
        <meta property="og:description" content="Play classic Tic-Tac-Toe online with friends! Free multiplayer strategic game." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadzoo.games/games/tic-tac-toe" />
        <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tic-Tac-Toe - Online Multiplayer Game" />
        <meta name="twitter:description" content="Play Tic-Tac-Toe online with friends! Free strategic game." />
      </Helmet>
      
      <GameDescription {...gameDescription} />
      <TicTacToe onBack={() => navigate("/")} initialRoomCode={roomCode} />
    </>
  );
}

export default TicTacToePage;
