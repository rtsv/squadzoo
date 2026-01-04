import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DrawGuess from "../../games/draw-guess/DrawGuess";

function DrawGuessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  return (
    <>
      <Helmet>
        <title>Draw and Guess - Online Multiplayer Drawing Game | SquadZoo</title>
        <meta name="description" content="Play Draw and Guess online! Take turns drawing and guessing words with friends in this fun multiplayer game. Like Pictionary but online and free for 2-12 players." />
        <meta name="keywords" content="draw and guess, drawing game, pictionary online, multiplayer drawing game, guess the drawing, online drawing game, party game" />
        <link rel="canonical" href="https://squadzoo.games/games/draw-and-guess" />
        <meta property="og:title" content="Draw and Guess - Free Online Multiplayer Drawing Game" />
        <meta property="og:description" content="Draw pictures and guess what others draw! Fun multiplayer drawing game for parties and friends." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadzoo.games/games/draw-and-guess" />
        <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Draw and Guess - Online Drawing Game" />
        <meta name="twitter:description" content="Play Draw and Guess online with friends! Free multiplayer drawing game." />
      </Helmet>
      <DrawGuess onBack={() => navigate("/")} initialRoomCode={roomCode} />
    </>
  );
}

export default DrawGuessPage;
