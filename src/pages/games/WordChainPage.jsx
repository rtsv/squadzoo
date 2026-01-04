import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import WordChain from "../../games/word-chain/WordChain";
import GameDescription from "../../components/GameDescription";

function WordChainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("room");

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

  return (
    <>
      <Helmet>
        <title>Word Chain - Online Multiplayer Word Game | SquadZoo</title>
        <meta name="description" content="Play Word Chain online with friends! Create word chains by connecting words that start with the last letter of the previous word. Free multiplayer word game for 2-12 players." />
        <meta name="keywords" content="word chain game, word chain online, multiplayer word game, vocabulary game, logic game, word game online, educational game" />
        <link rel="canonical" href="https://squadzoo.games/games/word-chain" />
        <meta property="og:title" content="Word Chain - Free Online Multiplayer Word Game" />
        <meta property="og:description" content="Challenge your vocabulary! Play Word Chain online with friends. Connect words that start with the last letter of the previous word." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://squadzoo.games/games/word-chain" />
        <meta property="og:image" content="https://squadzoo.games/images/squad-zoo-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Word Chain - Online Multiplayer Word Game" />
        <meta name="twitter:description" content="Play Word Chain online with friends! Free multiplayer vocabulary game." />
      </Helmet>
      
      <GameDescription {...gameDescription} />
      <WordChain onBack={() => navigate("/")} initialRoomCode={roomCode} />
    </>
  );
}

export default WordChainPage;
