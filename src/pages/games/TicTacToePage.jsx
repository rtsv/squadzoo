import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import TicTacToe from "../../games/tic-tac-toe/TicTacToe";

function TicTacToePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

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
      <TicTacToe onBack={() => navigate("/")} initialRoomCode={roomCode} />
    </>
  );
}

export default TicTacToePage;
