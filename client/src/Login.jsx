import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const r = await api.post('/sessions', { username, password })
      onLogin(r.data)
      nav('/play')
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <div className="card shadow-lg">
          <div className="card-body p-4 p-md-5">
            <h3 className="h3 mb-4 fw-bold">Login</h3>

            <form onSubmit={submit} className="grid gap-3">
              <div className="form-floating">
                <input id="u" className="form-control form-control-lg" placeholder="username"
                       value={username} onChange={e=>setUsername(e.target.value)} />
                <label htmlFor="u">Username</label>
              </div>
              <div className="form-floating">
                <input id="p" type="password" className="form-control form-control-lg" placeholder="password"
                       value={password} onChange={e=>setPassword(e.target.value)} />
                <label htmlFor="p">Password</label>
              </div>

              {err && <div className="alert alert-danger py-2">{err}</div>}
              <button className="btn btn-primary btn-lg w-100">Sign in</button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
