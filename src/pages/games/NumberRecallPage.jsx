import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import NumberRecallTiles from "../../games/number-recall/NumberRecallTiles";
import GameDescription from "../../components/GameDescription";

function NumberRecallPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialRoomCode = searchParams.get('room');
  
  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate('/games/number-recall/play' + location.search);
    }
  };

  const gameDescription = {
    title: "Number Recall Tiles",
    description: "Play Number Recall Tiles online free! Test your memory and concentration with this brain-training puzzle game. Numbers 1-9 appear randomly on a 3x3 grid - memorize their positions and click them in the correct sequence. Perfect for memory training, cognitive improvement, and fun challenges with friends. Choose from Easy, Medium, or Hard difficulty levels. No downloads required - works on mobile and desktop.",
    features: [
      "🧠 Memory training puzzle game - Enhance recall skills",
      "🎯 Three difficulty levels - Easy, Medium, Hard",
      "👥 2-4 players supported - Compete with friends",
      "⚡ Quick rounds - Perfect for brain workouts",
      "📱 Mobile-friendly - Train your memory anywhere",
      "🌐 No download or registration required"
    ],
    howToPlay: "Watch carefully as numbers 1-9 appear on a 3x3 grid. Memorize their positions during the preview phase. Then click the tiles in the correct sequence (1 to 9 in Easy/Medium, random sequence in Hard mode). Make a mistake and your turn ends! In multiplayer mode, take turns and compete for the highest score. The player who completes the most sequences wins!"
  };

  // Structured Data for SEO (JSON-LD Schema)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Number Recall Tiles",
    "description": "Free memory training puzzle game. Memorize number positions on a 3x3 grid and click them in sequence. Test your recall skills with multiple difficulty levels!",
    "url": "https://squadzoo.games/games/number-recall",
    "image": "https://squadzoo.games/images/squad-zoo-logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "SquadZoo",
      "url": "https://squadzoo.games"
    },
    "genre": ["Puzzle Game", "Memory Game", "Brain Training"],
    "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
    "numberOfPlayers": {
      "@type": "QuantitativeValue",
      "minValue": 1,
      "maxValue": 4
    },
    "playMode": ["SinglePlayer", "MultiPlayer"],
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
      "ratingCount": "287",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        {isPlayMode ? (
          <>
            <title>Playing Number Recall Tiles | SquadZoo</title>
            <meta name="description" content="Active Number Recall game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://squadzoo.games/games/number-recall" />
          </>
        ) : (
          <>
            <title>Number Recall Tiles - Free Memory Training Game 2026 | SquadZoo</title>
            <meta name="description" content="Play Number Recall Tiles online free! Memory training puzzle game with 3x3 grid. Test your recall skills with numbers 1-9. Multiple difficulty levels, supports 1-4 players. No downloads required - Start brain training now!" />
            <meta name="keywords" content="number recall game, memory game, brain training, memory puzzle, number sequence game, cognitive training, memory test, recall game online, number memory game, brain workout, concentration game, memory training free, puzzle game online" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://squadzoo.games/games/number-recall" />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="game" />
            <meta property="og:title" content="Number Recall Tiles - Free Memory Training Game | SquadZoo" />
            <meta property="og:description" content="Test your memory with Number Recall Tiles! Free brain training puzzle game. Memorize positions, click in sequence. Challenge friends!" />
            <meta property="og:url" content="https://squadzoo.games/games/number-recall" />
            <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Number Recall Tiles Memory Game" />
            <meta property="og:site_name" content="SquadZoo" />
            <meta property="og:locale" content="en_US" />
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Number Recall Tiles - Memory Training Game" />
            <meta name="twitter:description" content="Test your memory! Free number recall puzzle game with multiple difficulty levels." />
            <meta name="twitter:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta name="twitter:image:alt" content="Number Recall Game" />
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
            
            {/* Mobile App Meta Tags */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Number Recall - SquadZoo" />
            <meta name="application-name" content="SquadZoo Number Recall" />
            <meta name="theme-color" content="#1a1a1a" />
            
            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
            
            {/* Breadcrumb Schema */}
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
                    "name": "Number Recall Tiles",
                    "item": "https://squadzoo.games/games/number-recall"
                  }
                ]
              })}
            </script>
          </>
        )}
      </Helmet>
      
      <NumberRecallTiles 
        onBack={() => navigate("/")}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
        initialRoomCode={initialRoomCode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default NumberRecallPage;
