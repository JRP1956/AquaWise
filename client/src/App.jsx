import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Calculator from './pages/Calculator.jsx';
import Advisory from './pages/Advisory.jsx';
import Tips from './pages/Tips.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Society from './pages/Society.jsx';
import Report from './pages/Report.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/advisory" element={<Advisory />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/society" element={<ProtectedRoute><Society /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute needsSociety><Report /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute needsSociety><Dashboard /></ProtectedRoute>} />
          <Route path="/complaints/:id" element={<ProtectedRoute needsSociety><ComplaintDetail /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
