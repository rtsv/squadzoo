import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DiceBlitz from "../../games/dice-blitz/DiceBlitz";
import GameDescription from "../../components/GameDescription";

function DiceBlitzPage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate("/games/dice-blitz/play" + location.search);
    }
  };

  const gameDescription = {
    title: "Dice Blitz",
    description:
      "Play Dice Blitz – Online Multiplayer Dice Race! Clear your own 3x3 grid first to win! A high-speed race for 2 players. No downloads or sign-ups required - works on all devices.",
    features: [
      "🎲 High-speed dice clearing gameplay",
      "🏁 Strategic race to clear your board",
      "👥 Exactly 2 players - local and online multiplayer",
      "⚡ Fast rounds - perfect for head-to-head fun",
      "📱 Mobile-friendly - play anywhere, anytime",
      "🌐 No download required - play in your browser",
    ],
    howToPlay:
      "Each player has a 3x3 grid of random numbers (1-6). Take turns rolling a die. When a number is rolled, it is marked as 'crossed' on YOUR own grid. The first player to clear all cells on their own grid wins! Share a room code to play with a friend remotely or choose local mode to play together.",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: "Dice Blitz - 2 Player Dice Race Game Online",
    description:
      "Play Dice Blitz online with a friend! Free 2-player dice race game. Roll dice and clear your own grid first to win. No downloads or registration required.",
    url: "https://www.squadzoo.games/games/dice-blitz",
    image: "https://www.squadzoo.games/images/squad-zoo-logo.png",
    publisher: {
      "@type": "Organization",
      name: "SquadZoo",
      url: "https://www.squadzoo.games",
    },
    genre: ["Dice Game", "Race Game", "Multiplayer Game"],
    gamePlatform: ["Web Browser", "Desktop", "Mobile"],
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 2,
      maxValue: 2,
    },
    playMode: ["MultiPlayer"],
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Helmet>
        {isPlayMode ? (
          <>
            <title>Playing Dice Blitz Online | SquadZoo</title>
            <meta name="description" content="Active Dice Blitz game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://www.squadzoo.games/games/dice-blitz" />
          </>
        ) : (
          <>
            <title>{`Play Dice Blitz Online Free - Multiplayer Dice Game 2026 | SquadZoo`}</title>
            <meta name="description" content="Play Dice Blitz online with friends! Free multiplayer dice game for 2-4 players. Roll the dice, strike your opponent's grid, and win fast! No downloads required!" />
            <meta name="keywords" content="dice blitz online, dice game online, multiplayer dice game, strategy dice game, strike game, free multiplayer game, dice game with friends, board game online" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://www.squadzoo.games/games/dice-blitz" />

            <meta property="og:type" content="game" />
            <meta property="og:title" content="Play Dice Blitz Online Free - Multiplayer Dice Game | SquadZoo" />
            <meta property="og:description" content="Roll the dice, strike your opponent's grid, and win fast! Free multiplayer game for 2-4 players." />
            <meta property="og:url" content="https://www.squadzoo.games/games/dice-blitz" />
            <meta property="og:image" content="https://www.squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:site_name" content="SquadZoo" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Play Dice Blitz Online Free" />
            <meta name="twitter:description" content="Roll the dice and strike your opponent's grid to win! Free multiplayer game for 2-4 players." />
            <meta name="twitter:image" content="https://www.squadzoo.games/images/squad-zoo-logo.png" />

            <meta name="author" content="SquadZoo" />
            <meta name="robots" content="index, follow" />
            <meta name="language" content="English" />
            <meta name="revisit-after" content="7 days" />
            <meta name="rating" content="General" />
            <meta name="theme-color" content="#1a1a1a" />

            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>

            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://www.squadzoo.games" },
                  { "@type": "ListItem", position: 2, name: "Games", item: "https://www.squadzoo.games/#games" },
                  { "@type": "ListItem", position: 3, name: "Dice Blitz", item: "https://www.squadzoo.games/games/dice-blitz" },
                ],
              })}
            </script>
          </>
        )}
      </Helmet>

      <DiceBlitz
        onBack={() => navigate("/")}
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default DiceBlitzPage;
