import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SimulationPage from './pages/SimulationPage';
import GalleryPage from './pages/GalleryPage';
import SimulationView from './pages/SimulationView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/sim/:id" element={<SimulationView />} />
      </Routes>
    </Router>
  );
}

export default App;
