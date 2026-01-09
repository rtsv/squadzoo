import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DrawGuess from "../../games/draw-guess/DrawGuess";
import GameDescription from "../../components/GameDescription";

function DrawGuessPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");
  
  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate('/games/draw-and-guess/play' + location.search);
    }
  };

  const gameDescription = {
    title: "Draw & Guess",
    description: "Play Draw & Guess online free! Like Pictionary but in your browser, this fun multiplayer drawing game lets you take turns drawing pictures while others guess what you're creating. Perfect for parties, family game nights, and virtual hangouts with 2-12 players. No downloads needed - works seamlessly on mobile and desktop devices with touch or mouse controls.",
    features: [
      "🎨 Free online drawing game - Like Pictionary for the web",
      "👥 Multiplayer fun for 2-12 players online or locally",
      "🖼️ Easy-to-use drawing canvas with multiple colors",
      "📱 Touch-friendly for tablets and mobile devices",
      "🌐 No download or installation required",
      "⚡ Instant play - No account needed"
    ],
    howToPlay: "Players take turns drawing a randomly assigned word while others try to guess what it is. The drawer cannot use letters, numbers, or symbols - only drawings! Guessers type their answers in the chat. Great for creativity, fun, and friendly competition. Create a room, share the code with friends, and start drawing!"
  };

  return (
    <>
      <Helmet>
        <title>Draw and Guess - Online Multiplayer Drawing Game | SquadZoo</title>
        <meta name="description" content="Play Draw and Guess online! Take turns drawing and guessing words with friends in this fun multiplayer game. Like Pictionary but online and free for 2-12 players." />
        <meta name="keywords" content="draw and guess, drawing game, pictionary online, multiplayer drawing game, guess the drawing, online drawing game, party game" />
        <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
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
      
      <DrawGuess 
        onBack={() => navigate("/")} 
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default DrawGuessPage;
