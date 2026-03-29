import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import TicTacToe from "../../games/tic-tac-toe/TicTacToe";
import GameDescription from "../../components/GameDescription";

function TicTacToePage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");
  
  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate('/games/tic-tac-toe/play' + location.search);
    }
  };

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Tic-Tac-Toe Online Multiplayer",
    "description": "Play classic Tic-Tac-Toe online with friends! Free multiplayer strategy game for 2 players. No downloads or registration required.",
    "url": "https://squadzoo.games/games/tic-tac-toe",
    "image": "https://squadzoo.games/images/squad-zoo-logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "SquadZoo",
      "url": "https://squadzoo.games"
    },
    "genre": ["Strategy Game", "Board Game", "Multiplayer Game"],
    "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
    "numberOfPlayers": {
      "@type": "QuantitativeValue",
      "minValue": 2,
      "maxValue": 2
    },
    "playMode": ["MultiPlayer"],
    "inLanguage": "en",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.6",
      "ratingCount": "412",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://squadzoo.games" },
      { "@type": "ListItem", "position": 2, "name": "Games", "item": "https://squadzoo.games/#games" },
      { "@type": "ListItem", "position": 3, "name": "Tic-Tac-Toe", "item": "https://squadzoo.games/games/tic-tac-toe" }
    ]
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Tic-Tac-Toe Online | SquadZoo</title>
            <meta name="description" content="Active Tic-Tac-Toe game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://squadzoo.games/games/tic-tac-toe" />
          </>
        ) : (
          <>
            <title>Play Tic-Tac-Toe Online Free - Multiplayer Strategy Game 2026 | SquadZoo</title>
            <meta name="description" content="Play classic Tic-Tac-Toe online with friends! Free multiplayer X's and O's game for 2 players. Local and online modes. No downloads or registration required - Start playing now!" />
            <meta name="keywords" content="tic tac toe, tic tac toe online, multiplayer tic tac toe, noughts and crosses, strategy game, classic game online, x and o game, tic tac toe free, two player games" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://squadzoo.games/games/tic-tac-toe" />
            <meta property="og:type" content="game" />
            <meta property="og:title" content="Play Tic-Tac-Toe Online Free - Multiplayer Game | SquadZoo" />
            <meta property="og:description" content="Classic Tic-Tac-Toe online with friends! Free multiplayer X's and O's game. No downloads required!" />
            <meta property="og:url" content="https://squadzoo.games/games/tic-tac-toe" />
            <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:site_name" content="SquadZoo" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Play Tic-Tac-Toe Online Free - Multiplayer Game" />
            <meta name="twitter:description" content="Play Tic-Tac-Toe online with friends! Free strategic game for 2 players." />
            <meta name="twitter:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta name="author" content="SquadZoo" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
            <meta name="language" content="English" />
            <meta name="revisit-after" content="7 days" />
            <meta name="rating" content="General" />
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
          </>
        )}
      </Helmet>
      
      <TicTacToe 
        onBack={() => navigate("/")} 
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default TicTacToePage;
