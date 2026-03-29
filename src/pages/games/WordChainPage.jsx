import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import WordChain from "../../games/word-chain/WordChain";
import GameDescription from "../../components/GameDescription";

function WordChainPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");
  
  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate('/games/word-chain/play' + location.search);
    }
  };

  useEffect(() => {
    // Auto-join room if room code is in URL
    if (roomCode) {
      console.log("Room code from URL:", roomCode);
    }
  }, [roomCode]);

  const gameDescription = {
    title: "Word Chain",
    description: "Play Word Chain online free with friends! This engaging multiplayer word game challenges your vocabulary as you create chains of words where each word must start with the last letter of the previous word. Perfect for educational fun, vocabulary building, and competitive play with 2-12 players. No downloads required - works on mobile and desktop browsers.",
    features: [
      "🎮 Free multiplayer word game - Play online with 2-12 friends",
      "🧠 Build vocabulary and improve spelling skills",
      "🌐 No download required - Play directly in your browser",
      "📱 Works on mobile, tablet, and desktop devices",
      "⚡ Instant play - No sign-up or registration needed",
      "🏆 Competitive gameplay with lives system"
    ],
    howToPlay: "Take turns entering words that start with the last letter of the previous word. For example: CAT → TABLE → EGG → GAME. Each player has 3 lives. Lose a life if you use an invalid word, repeat a word, or start with the wrong letter. The last player standing wins! Share a room code to play with friends remotely or play locally on the same device."
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Word Chain Online Multiplayer",
    "description": "Play Word Chain online with friends! Free multiplayer word game for 2-12 players. Build vocabulary chains where each word starts with the last letter.",
    "url": "https://squadzoo.games/games/word-chain",
    "image": "https://squadzoo.games/images/squad-zoo-logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "SquadZoo",
      "url": "https://squadzoo.games"
    },
    "genre": ["Word Game", "Educational Game", "Multiplayer Game"],
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
      "ratingValue": "4.7",
      "ratingCount": "389",
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
      { "@type": "ListItem", "position": 3, "name": "Word Chain", "item": "https://squadzoo.games/games/word-chain" }
    ]
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Word Chain Online | SquadZoo</title>
            <meta name="description" content="Active Word Chain game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://squadzoo.games/games/word-chain" />
          </>
        ) : (
          <>
            <title>Play Word Chain Online Free - Multiplayer Word Game 2026 | SquadZoo</title>
            <meta name="description" content="Play Word Chain online with friends! Free multiplayer vocabulary game for 2-12 players. Build word chains where each word starts with the last letter of the previous word. No downloads required - Start playing now!" />
            <meta name="keywords" content="word chain game, word chain online, multiplayer word game, vocabulary game, logic game, word game online, educational game, word games free, vocabulary builder, english word game" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://squadzoo.games/games/word-chain" />
            <meta property="og:type" content="game" />
            <meta property="og:title" content="Play Word Chain Online Free - Multiplayer Word Game | SquadZoo" />
            <meta property="og:description" content="Challenge your vocabulary! Play Word Chain online with friends. Connect words in a chain for 2-12 players!" />
            <meta property="og:url" content="https://squadzoo.games/games/word-chain" />
            <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:site_name" content="SquadZoo" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Play Word Chain Online Free - Multiplayer Word Game" />
            <meta name="twitter:description" content="Play Word Chain online with friends! Free vocabulary game for 2-12 players." />
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
      
      <WordChain 
        onBack={() => navigate("/")} 
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default WordChainPage;
