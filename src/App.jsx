import { useState } from "react";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import Disclaimer from "./pages/Disclaimer";
import DrawGuess from "./games/draw-guess/DrawGuess";
import WordChain from "./games/word-chain/WordChain";
import TicTacToe from "./games/tic-tac-toe/TicTacToe";
import Battleship from "./games/battleship/Battleship";

function App() {
  const [game, setGame] = useState(null);
  const [page, setPage] = useState("home");

  if (game === "draw-guess")
    return <DrawGuess onBack={() => setGame(null)} />;

  if (game === "word-chain")
    return <WordChain onBack={() => setGame(null)} />;

  if (game === "tic-tac-toe")
    return <TicTacToe onBack={() => setGame(null)} />;

  if (game === "battleship")
    return <Battleship onBack={() => setGame(null)} />;

  if (page === "about")
    return <AboutUs onBack={() => setPage("home")} />;

  if (page === "privacy")
    return <PrivacyPolicy onBack={() => setPage("home")} />;

  if (page === "terms")
    return <TermsOfService onBack={() => setPage("home")} />;

  if (page === "contact")
    return <ContactUs onBack={() => setPage("home")} />;

  if (page === "disclaimer")
    return <Disclaimer onBack={() => setPage("home")} />;

  return <Home onPlayGame={setGame} onNavigate={setPage} />;
}

export default App;
