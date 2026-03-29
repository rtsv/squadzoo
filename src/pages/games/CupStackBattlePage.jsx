import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import CupStackBattle from "../../games/cup-stack/CupStackBattle";
import GameDescription from "../../components/GameDescription";

function CupStackBattlePage({ isPlayMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

  const handleGameStart = () => {
    if (!isPlayMode) {
      navigate("/games/cup-stack-battle/play" + location.search);
    }
  };

  const gameDescription = {
    title: "Cup Merge Battle",
    description:
      "Play Cup Merge Battle online free with friends! Roll the dice and merge opponent groups — all selected groups fuse into one, then your cup goes on top! The board shrinks each turn. Dominate every group to win! A fun, strategic multiplayer party game for 2-4 players. No downloads required.",
    features: [
      "🏆 Unique group-merging strategy gameplay",
      "🎲 Dice-based turn system with tactical choices",
      "👥 2-4 players - local and online multiplayer",
      "🎨 Colorful, animated 3D cup stack visuals",
      "📱 Mobile-friendly - play anywhere, anytime",
      "🌐 No download or registration required",
    ],
    howToPlay:
      "Roll the dice to determine how many opponent groups you can merge. Select groups whose top color isn't yours — they all fuse into one big group, and your cup goes on top! The board shrinks each turn as groups combine. Win by having your color on top of every group. Create a room to play online with friends, or choose local mode to play on the same device.",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: "Cup Merge Battle - Online Multiplayer",
    description:
      "Play Cup Merge Battle online with friends! Free multiplayer strategy game for 2-4 players. Roll dice and merge groups to dominate the board. No downloads or registration required.",
    url: "https://squadzoo.games/games/cup-stack-battle",
    image: "https://squadzoo.games/images/squad-zoo-logo.png",
    publisher: {
      "@type": "Organization",
      name: "SquadZoo",
      url: "https://squadzoo.games",
    },
    genre: ["Strategy Game", "Party Game", "Multiplayer Game"],
    gamePlatform: ["Web Browser", "Desktop", "Mobile"],
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 2,
      maxValue: 4,
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
            <title>Playing Cup Merge Battle Online | SquadZoo</title>
            <meta name="description" content="Active Cup Merge Battle game in progress. Enjoy ad-free gameplay experience." />
            <meta name="robots" content="noindex, nofollow" />
            <link rel="canonical" href="https://squadzoo.games/games/cup-stack-battle" />
          </>
        ) : (
          <>
            <title>{`Play Cup Merge Battle Online Free - Multiplayer Strategy Game 2026 | SquadZoo`}</title>
            <meta name="description" content="Play Cup Merge Battle online with friends! Free multiplayer strategy game for 2-4 players. Roll dice and merge groups to dominate the board. No downloads required!" />
            <meta name="keywords" content="cup merge battle, cup merging game, multiplayer strategy game, online party game, dice game online, cup game with friends, free multiplayer game, merging game, board game online" />
            <meta name="google-adsense-account" content="ca-pub-7575193067019168" />
            <link rel="canonical" href="https://squadzoo.games/games/cup-stack-battle" />

            <meta property="og:type" content="game" />
            <meta property="og:title" content="Play Cup Merge Battle Online Free - Multiplayer Strategy Game | SquadZoo" />
            <meta property="og:description" content="Roll dice and merge groups to dominate the board! Free multiplayer game for 2-4 players." />
            <meta property="og:url" content="https://squadzoo.games/games/cup-stack-battle" />
            <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
            <meta property="og:site_name" content="SquadZoo" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Play Cup Merge Battle Online Free" />
            <meta name="twitter:description" content="Roll dice and merge groups to dominate! Free multiplayer game for 2-4 players." />
            <meta name="twitter:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />

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
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://squadzoo.games" },
                  { "@type": "ListItem", position: 2, name: "Games", item: "https://squadzoo.games/#games" },
                  { "@type": "ListItem", position: 3, name: "Cup Merge Battle", item: "https://squadzoo.games/games/cup-stack-battle" },
                ],
              })}
            </script>
          </>
        )}
      </Helmet>

      <CupStackBattle
        onBack={() => navigate("/")}
        initialRoomCode={roomCode}
        onGameStart={handleGameStart}
        isPlayMode={isPlayMode}
      />
      {!isPlayMode && <GameDescription {...gameDescription} />}
    </>
  );
}

export default CupStackBattlePage;
