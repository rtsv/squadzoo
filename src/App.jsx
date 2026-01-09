import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import Disclaimer from "./pages/Disclaimer";
import FAQ from "./pages/FAQ";
import DrawGuessPage from "./pages/games/DrawGuessPage";
import WordChainPage from "./pages/games/WordChainPage";
import TicTacToePage from "./pages/games/TicTacToePage";
import BattleshipPage from "./pages/games/BattleshipPage";
import LudoPage from "./pages/games/LudoPage";

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Game setup/menu pages (with ads) */}
          <Route path="/games/draw-and-guess" element={<DrawGuessPage />} />
          <Route path="/games/word-chain" element={<WordChainPage />} />
          <Route path="/games/tic-tac-toe" element={<TicTacToePage />} />
          <Route path="/games/battleship" element={<BattleshipPage />} />
          <Route path="/games/ludo" element={<LudoPage />} />
          
          {/* Active gameplay pages (no ads for AdSense exclusion) */}
          <Route path="/games/draw-and-guess/play" element={<DrawGuessPage isPlayMode={true} />} />
          <Route path="/games/word-chain/play" element={<WordChainPage isPlayMode={true} />} />
          <Route path="/games/tic-tac-toe/play" element={<TicTacToePage isPlayMode={true} />} />
          <Route path="/games/battleship/play" element={<BattleshipPage isPlayMode={true} />} />
          <Route path="/games/ludo/play" element={<LudoPage isPlayMode={true} />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
