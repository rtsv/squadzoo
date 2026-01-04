import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import Disclaimer from "./pages/Disclaimer";
import DrawGuessPage from "./pages/games/DrawGuessPage";
import WordChainPage from "./pages/games/WordChainPage";
import TicTacToePage from "./pages/games/TicTacToePage";
import BattleshipPage from "./pages/games/BattleshipPage";

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/games/draw-and-guess" element={<DrawGuessPage />} />
          <Route path="/games/word-chain" element={<WordChainPage />} />
          <Route path="/games/tic-tac-toe" element={<TicTacToePage />} />
          <Route path="/games/battleship" element={<BattleshipPage />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
