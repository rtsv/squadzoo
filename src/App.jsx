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
import WordChainPage from "./pages/games/WordChainPage";
import TicTacToePage from "./pages/games/TicTacToePage";

import LudoPage from "./pages/games/LudoPage";
import NumberRecallPage from "./pages/games/NumberRecallPage";
import CupStackBattlePage from "./pages/games/CupStackBattlePage";
import DiceBlitzPage from "./pages/games/DiceBlitzPage";
import BoxBlitzPage from "./pages/games/BoxBlitzPage";
import WordHuntPage from "./pages/games/WordHuntPage";
import NumberGuessDuelPage from "./pages/games/NumberGuessDuelPage";

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
          <Route path="/games/word-chain" element={<WordChainPage />} />
          <Route path="/games/tic-tac-toe" element={<TicTacToePage />} />

          <Route path="/games/ludo" element={<LudoPage />} />
          <Route path="/games/number-recall" element={<NumberRecallPage />} />
          <Route path="/games/cup-stack-battle" element={<CupStackBattlePage />} />
          <Route path="/games/dice-blitz" element={<DiceBlitzPage />} />
          <Route path="/games/box-blitz" element={<BoxBlitzPage />} />
          <Route path="/games/word-hunt" element={<WordHuntPage />} />
          <Route path="/games/number-guess-duel" element={<NumberGuessDuelPage />} />
          
          {/* Active gameplay pages (no ads for AdSense exclusion) */}
          <Route path="/games/word-chain/play" element={<WordChainPage isPlayMode={true} />} />
          <Route path="/games/tic-tac-toe/play" element={<TicTacToePage isPlayMode={true} />} />

          <Route path="/games/ludo/play" element={<LudoPage isPlayMode={true} />} />
          <Route path="/games/number-recall/play" element={<NumberRecallPage isPlayMode={true} />} />
          <Route path="/games/cup-stack-battle/play" element={<CupStackBattlePage isPlayMode={true} />} />
          <Route path="/games/dice-blitz/play" element={<DiceBlitzPage isPlayMode={true} />} />
          <Route path="/games/box-blitz/play" element={<BoxBlitzPage isPlayMode={true} />} />
          <Route path="/games/word-hunt/play" element={<WordHuntPage isPlayMode={true} />} />
          <Route path="/games/number-guess-duel/play" element={<NumberGuessDuelPage isPlayMode={true} />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
