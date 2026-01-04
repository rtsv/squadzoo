import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Battleship from "../../games/battleship/Battleship";

function BattleshipPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

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
      <Battleship onBack={() => navigate("/")} initialRoomCode={roomCode} />
    </>
  );
}

export default BattleshipPage;
