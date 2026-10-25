import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setDocumentDirection } from './i18n/config'
import { AuthProvider } from './context/AuthContext'
import { ErrorProvider } from './context/ErrorContext'
import { AuthRedirectEffect } from './components/AuthRedirectEffect'
import { AuthCheckedGate } from './components/AuthCheckedGate'
import { AppToast } from './components/AppToast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { Campaigns } from './pages/Campaigns'
import { Donate } from './pages/Donate'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { News } from './pages/News'
import { Partners } from './pages/Partners'
import { About } from './pages/About'
import { MyDonations } from './pages/MyDonations'
import { PaymentReturn } from './pages/PaymentReturn'
import { StudentRegistration } from './pages/StudentRegistration'
import { NotFound } from './pages/NotFound'

function DirSync() {
  const { i18n } = useTranslation()
  useEffect(() => {
    setDocumentDirection(i18n.language || 'ar')
  }, [i18n.language])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorProvider>
          <DirSync />
          <AuthRedirectEffect />
          <AuthCheckedGate>
            <AppToast />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/donate/return" element={<PaymentReturn />} />
              <Route path="/payments/success" element={<PaymentReturn />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/student-registration" element={<StudentRegistration />} />
              <Route path="/news" element={<News />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/about" element={<About />} />
              <Route path="/my-donations" element={<ProtectedRoute><MyDonations /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthCheckedGate>
        </ErrorProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
