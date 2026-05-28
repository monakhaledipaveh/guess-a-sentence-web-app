import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import api from './api'
import Login from './Login'
import MatchBoard from './MatchBoard'

export default function App() {
  const [user, setUser] = useState(null)
  
  const nav = useNavigate()

  useEffect(() => {
    api.get('/sessions/current').then(r => setUser(r.data)).catch(() => setUser(null))
  }, [])

  const logout = async () => {
    await api.delete('/sessions/current')
    setUser(null)
    nav('/')
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-gradient shadow-sm">
  <div className="container">
    {/* Clickable Logo (SVG) */}
    <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
      <img src="/src/assets/logo.svg" alt="Logo" width="64" height="64" />  {/* Logo size adjustable */}
    </Link>

    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
      <span className="navbar-toggler-icon"></span>
    </button>

    <div id="navMain" className="collapse navbar-collapse">
      <ul className="navbar-nav me-auto mb-2 mb-lg-0">
        <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
        <li className="nav-item"><Link className="nav-link" to="/play">Play</Link></li>
      </ul>

      <div className="d-flex align-items-center gap-3">
        {user ? (
          <>
            <span className="badge text-bg-primary">💰 {user.coins}</span>
            <span className="text-white-75">👤 {user.username}</span>
<button onClick={logout} className="btn btn-outline-light btn-sm text-dark hover:text-white hover:bg-warning focus:ring-2 focus:ring-warning">
  Logout
</button>
          </>
        ) : (
<Link className="btn btn-light btn-sm text-dark hover:text-white hover:bg-warning focus:ring-2 focus:ring-warning" to="/login">
  Login
</Link>
        )}
      </div>
    </div>
  </div>
</nav>



      {/* Page container */}
      <div className="container py-4">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/play" element={<MatchBoard user={user} onUserChange={setUser} />} />
          {/* if someone hits a wrong URL, go Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <footer className="app-footer text-center small">
          Guessr — a minimal guessing game for the WA1 exam demo.
        </footer>
      </div>
    </>
  )
}

function Home({ user }) {
  return (
    <div className="row justify-content-center">
      <div className="col-xl-10">

        {/* HERO section (visible, big, colorful) */}
        <div className="hero-card shadow-lg p-4 p-md-5 mb-4">
          <h1 className="display-5 fw-bold mb-2">Guess the Sentence</h1>
          <p className="lead mb-0">Beat the 60s timer, reveal letters, and win coins.</p>
        </div>

        {/* Rules / quick start */}
        <div className="card shadow-lg">
          <div className="card-body">
            <p className="fs-5 text-secondary mb-3">
              Mode: {user ? 'Coins mode (logged in)' : 'Guest mode (no coins)'}
            </p>
            <ul className="fs-5 ms-1 list-unstyled">
              <li>• 60-second timer</li>
              <li>• Only one vowel per match</li>
              <li>• Vowels cost 10 coins; wrong consonant guess costs double</li>
              <li>• Correct full-sentence guess: +100 coins</li>
            </ul>
            <div className="mt-3 d-flex gap-2">
              <Link className="btn btn-primary btn-lg" to="/play">Start Playing</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}