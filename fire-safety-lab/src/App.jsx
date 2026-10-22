import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Footer from './components/Footer'
import ProgressProvider from './components/ProgressProvider'
import TopPage from './pages/TopPage'
import SimulationPage from './pages/SimulationPage'
import LearningPage from './pages/LearningPage'
import CaseStudyPage from './pages/CaseStudyPage'
import QuizPage from './pages/QuizPage'
import NotFoundPage from './pages/NotFoundPage'

/** ページ遷移時にスクロール位置を先頭へ戻す */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ProgressProvider>
        <div className="min-h-screen flex flex-col">
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-white px-3 py-2 rounded-lg shadow">
            本文へスキップ
          </a>
          <ScrollToTop />
          <Header />
          <main id="main" className="flex-1">
            <Routes>
              <Route path="/" element={<TopPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/cases" element={<CaseStudyPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ProgressProvider>
    </MotionConfig>
  )
}

export default App
