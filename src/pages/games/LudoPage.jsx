import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Ludo from "../../games/ludo/Ludo";
import GameDescription from "../../components/GameDescription";

function LudoPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");
  
  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate('/games/ludo/play' + location.search);
    }
  };

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

  // Structured Data for SEO (JSON-LD Schema)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Ludo Online Multiplayer",
    "description": "Play classic Ludo online with friends! Free multiplayer board game for 2-4 players. Race your tokens around the board in this timeless strategy game. No downloads or registration required.",
    "url": "https://squadzoo.games/games/ludo",
    "image": "https://squadzoo.games/images/squad-zoo-logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "SquadZoo",
      "url": "https://squadzoo.games"
    },
    "genre": ["Board Game", "Strategy Game", "Multiplayer Game"],
    "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
    "numberOfPlayers": {
      "@type": "QuantitativeValue",
      "minValue": 2,
      "maxValue": 4
    },
    "playMode": ["MultiPlayer", "CoOp"],
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
      "ratingCount": "523",
      "bestRating": "5",
      "worstRating": "1"
    },
    "gameItem": {
      "@type": "Thing",
      "name": "Ludo Tokens"
    }
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        {isPlayMode ? (
          <>
            <title>Playing Ludo Online | SquadZoo</title>
            <meta name="description" content="Active Ludo game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://squadzoo.games/games/ludo" />
          </>
        ) : (
          <>
            <title>Play Ludo Online Free - Multiplayer Board Game 2026 | SquadZoo</title>
            <meta name="description" content="Play classic Ludo online with friends! Free multiplayer board game for 2-4 players. Race your tokens around the board in this timeless strategy game. No downloads or registration required - Start playing now!" />
            <meta name="keywords" content="ludo online, ludo game, multiplayer ludo, board game online, classic ludo, ludo with friends, play ludo free, ludo multiplayer, online ludo game, ludo 2 player, ludo 4 player, ludo strategy game, free board games, ludo dice game, ludo king online, pachisi game" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://squadzoo.games/games/ludo" />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="game" />
            <meta property="og:title" content="Play Ludo Online Free - Multiplayer Board Game | SquadZoo" />
            <meta property="og:description" content="Play classic Ludo online with friends! Free multiplayer board game for 2-4 players. Race your tokens around the board. No downloads required!" />
            <meta property="og:url" content="https://squadzoo.games/games/ludo" />
            <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Ludo Online Multiplayer Game" />
            <meta property="og:site_name" content="SquadZoo" />
            <meta property="og:locale" content="en_US" />
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Play Ludo Online Free - Multiplayer Board Game" />
            <meta name="twitter:description" content="Play Ludo online with friends! Free strategic board game for 2-4 players. No downloads required!" />
            <meta name="twitter:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta name="twitter:image:alt" content="Ludo Online Game" />
            <meta name="twitter:site" content="@SquadZoo" />
            
            {/* Additional SEO Meta Tags */}
            <meta name="author" content="SquadZoo" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="googlebot" content="index, follow" />
            <meta name="bingbot" content="index, follow" />
            <meta name="language" content="English" />
            <meta name="revisit-after" content="7 days" />
            <meta name="rating" content="General" />
            <meta name="distribution" content="global" />
            <meta name="category" content="Games" />
            <meta name="coverage" content="Worldwide" />
            <meta name="target" content="all" />
            
            {/* Geo Tags */}
            <meta name="geo.region" content="US" />
            <meta name="geo.placename" content="United States" />
            
            {/* Mobile App Meta Tags */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Ludo - SquadZoo" />
            <meta name="application-name" content="SquadZoo Ludo" />
            <meta name="msapplication-TileColor" content="#FFD700" />
            <meta name="theme-color" content="#1a1a1a" />
            
            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
            
            {/* Additional Breadcrumb Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://squadzoo.games"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Games",
                    "item": "https://squadzoo.games/#games"
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": "Ludo",
                    "item": "https://squadzoo.games/games/ludo"
                  }
                ]
              })}
            </script>
            
            {/* WebPage Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Play Ludo Online Free - Multiplayer Board Game",
                "description": "Play classic Ludo online with friends! Free multiplayer board game for 2-4 players.",
                "url": "https://squadzoo.games/games/ludo",
                "publisher": {
                  "@type": "Organization",
                  "name": "SquadZoo"
                },
                "datePublished": "2026-01-10",
                "dateModified": "2026-01-10",
                "inLanguage": "en-US"
              })}
            </script>
          </>
        )}
      </Helmet>
      
      <Ludo 
        onBack={() => navigate("/")} 
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default LudoPage;