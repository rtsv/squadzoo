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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Draw and Guess Online",
    "description": "Play Draw and Guess online! Like Pictionary but in your browser. Fun multiplayer drawing game for 2-12 players. No downloads needed.",
    "url": "https://squadzoo.games/games/draw-and-guess",
    "image": "https://squadzoo.games/images/squad-zoo-logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "SquadZoo",
      "url": "https://squadzoo.games"
    },
    "genre": ["Drawing Game", "Party Game", "Multiplayer Game"],
    "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
    "numberOfPlayers": {
      "@type": "QuantitativeValue",
      "minValue": 2,
      "maxValue": 12
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
      "ratingValue": "4.5",
      "ratingCount": "298",
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
      { "@type": "ListItem", "position": 3, "name": "Draw & Guess", "item": "https://squadzoo.games/games/draw-and-guess" }
    ]
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Draw & Guess Online | SquadZoo</title>
            <meta name="description" content="Active Draw & Guess game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://squadzoo.games/games/draw-and-guess" />
          </>
        ) : (
          <>
            <title>Play Draw & Guess Online Free - Multiplayer Drawing Game 2026 | SquadZoo</title>
            <meta name="description" content="Play Draw & Guess online with friends! Like Pictionary but free in your browser. Take turns drawing and guessing words. Fun multiplayer game for 2-12 players. No downloads required!" />
            <meta name="keywords" content="draw and guess, drawing game, pictionary online, multiplayer drawing game, guess the drawing, online drawing game, party game, draw game free, sketch and guess" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://squadzoo.games/games/draw-and-guess" />
            <meta property="og:type" content="game" />
            <meta property="og:title" content="Play Draw & Guess Online Free - Multiplayer Drawing Game | SquadZoo" />
            <meta property="og:description" content="Draw pictures and guess what others draw! Fun free multiplayer game for parties." />
            <meta property="og:url" content="https://squadzoo.games/games/draw-and-guess" />
            <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:site_name" content="SquadZoo" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Play Draw & Guess Online Free - Drawing Game" />
            <meta name="twitter:description" content="Play Draw & Guess with friends! Free multiplayer Pictionary game." />
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
