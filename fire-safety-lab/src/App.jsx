import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import TopPage from './pages/TopPage'
import SimulationPage from './pages/SimulationPage'
import LearningPage from './pages/LearningPage'
import CaseStudyPage from './pages/CaseStudyPage'
import QuizPage from './pages/QuizPage'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/cases" element={<CaseStudyPage />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
