import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Battleship from "../../games/battleship/Battleship";
import GameDescription from "../../components/GameDescription";

function BattleshipPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const gameDescription = {
    title: "Battleship",
    description: "Play Battleship online free with friends! This classic naval strategy game challenges you to sink your opponent's fleet before they sink yours. Place your ships strategically, guess coordinates, and use tactical thinking to dominate the ocean. Play online multiplayer with friends or locally on the same device. No downloads required - works perfectly on mobile and desktop browsers.",
    features: [
      "🚢 Classic Battleship naval warfare gameplay",
      "🎯 Strategic ship placement and tactical guessing",
      "👥 Free online multiplayer for 2 players",
      "🌊 Traditional 10x10 grid with 5 ships",
      "📱 Mobile and desktop compatible",
      "⚡ Instant play - No account or download needed"
    ],
    howToPlay: "Place your 5 ships (Carrier, Battleship, Cruiser, Submarine, and Destroyer) on a 10x10 grid. Take turns calling out coordinates to attack. Your opponent says 'Hit' or 'Miss'. Sink all enemy ships to win! Use strategic thinking to predict ship locations. Create a room to play online with friends or choose local mode for same-device play."
  };

  return (
    <>
      <Helmet>
        <title>Battleship - Online Multiplayer Naval Strategy Game | SquadZoo</title>
        <meta name="description" content="Play Battleship online with friends! Classic naval strategy game where you sink your opponent's fleet. Free multiplayer game with tactical gameplay for 2 players." />
        <meta name="keywords" content="battleship game, battleship online, multiplayer battleship, naval strategy game, board game online, war game" />
        <link rel="canonical" href="https://squadzoo.games/games/battleship" />
        <meta property="og:title" content="Battleship - Free Online Multiplayer Naval Game" />
        <meta property="og:description" content="Sink enemy ships in this classic naval strategy game! Play Battleship online with friends." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadzoo.games/games/battleship" />
        <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Battleship - Online Multiplayer Game" />
        <meta name="twitter:description" content="Play Battleship online with friends! Free naval strategy game." />
      </Helmet>
      
      <GameDescription {...gameDescription} />
      <Battleship onBack={() => navigate("/")} initialRoomCode={roomCode} />
    </>
  );
}

export default BattleshipPage;
