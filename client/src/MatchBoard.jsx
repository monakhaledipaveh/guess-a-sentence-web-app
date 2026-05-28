import React, { useEffect, useRef, useState } from 'react'
import api from './api'

export default function MatchBoard({ user, onUserChange }) {
  const [match, setMatch] = useState(null)
  const [letter, setLetter] = useState('')
  const [full, setFull] = useState('')
  const [msg, setMsg] = useState('')
  const timerRef = useRef(null)

  useEffect(() => { startNew() }, [])

  useEffect(() => {
    if (!match || finished(match)) { clearInterval(timerRef.current); return }
    clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      const r = await api.get(`/matches/${match.id}`)
      setMatch(r.data)
      if (finished(r.data)) clearInterval(timerRef.current)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [match])

  function finished(m) { return m && ['won','lost','abandoned','timeout'].includes(m.status) }

  async function startNew() {
    const r = await api.post('/matches')
    setMatch(r.data); setMsg(''); setLetter(''); setFull('')
  }

  async function refreshCoins() {
    if (!user) return
    const u = await api.get('/sessions/current').catch(()=>null)
    if (u) onUserChange(u.data)
  }

  async function guessLetterFn(e) {
    e.preventDefault()
    if (!letter) return
    const r = await api.post(`/matches/${match.id}/guess-letter`, { letter })
    setMatch(r.data); setLetter(''); await refreshCoins()
  }

  async function guessSentenceFn(e) {
    e.preventDefault()
    if (!full.trim()) return
    const r = await api.post(`/matches/${match.id}/guess-sentence`, { sentence: full })
    setMatch(r.data); setFull('')
    if (r.data.status === 'won') setMsg('You WON! +100 coins.')
    await refreshCoins()
  }

  async function abandon() {
    const r = await api.post(`/matches/${match.id}/abandon`)
    setMatch(r.data)
  }

  const pct = match ? Math.round((match.secondsLeft ?? 60) / 60 * 100) : 100

  return (
    <div className="row justify-content-center">
      <div className="col-xl-10">
        <div className="card shadow-lg">
          <div className="card-body p-4 p-md-5">

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-primary btn-lg" onClick={startNew}>New Match</button>
                <span className="badge text-bg-info fs-6">Mode: {user ? 'Coins' : 'Guest'}</span>
              </div>
              {match && !finished(match) && (
  <button className="btn btn-outline-danger" onClick={abandon}>Abandon</button>
)}
            </div>

            {/* Timer */}
            <div className="mb-4">
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold">Time left</span><span className="fw-semibold">{match?.secondsLeft ?? 60}s</span>
              </div>
              <div className="progress" style={{ height: '1rem' }}>
                <div
                  className={`progress-bar ${pct < 20 ? 'bg-danger' : pct < 50 ? 'bg-warning' : 'bg-success'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Mask / Sentence */}
            {match && <div className="mask-line mb-4">{match.mask || match.sentence}</div>}

            {/* Active controls */}
            {!finished(match ?? {}) && match && (
              <div className="row g-4">
                <div className="col-md-6">
                  <form onSubmit={guessLetterFn}>
                    <label className="form-label fw-semibold fs-5">Guess a letter</label>
                    <div className="input-group input-group-lg">
                      <input className="form-control" maxLength={1} placeholder="e.g., e"
                             value={letter} onChange={e=>setLetter(e.target.value)} />
                      <button className="btn btn-outline-primary">Guess</button>
                    </div>
                    <div className="form-text">Vowel used: {match.vowelUsed ? 'Yes' : 'No'}</div>
                  </form>
                </div>

                <div className="col-md-6">
                  <form onSubmit={guessSentenceFn}>
                    <label className="form-label fw-semibold fs-5">Guess the full sentence</label>
                    <div className="input-group input-group-lg">
                      <input className="form-control" placeholder="type your full guess"
                             value={full} onChange={e=>setFull(e.target.value)} />
                      <button className="btn btn-primary">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {finished(match ?? {}) && match && (
              <div className="alert alert-info mt-4 fs-5">
                <strong>Status:</strong> {match.status}{' '}
                {match.sentence && <> — Answer: <code>{match.sentence}</code></>}
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              {msg && <div className="alert alert-success py-2 px-3 mb-0 fs-6">{msg}</div>}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
