import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, register, isAuthenticated } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        await register(form)
        toast.success('Cuenta creada. Revisa tu correo si la confirmacion esta habilitada.')
      } else {
        await login({ email: form.email, password: form.password })
      }
    } catch (error) {
      toast.error(error?.message || 'No se pudo autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</h1>
        <p className="text-sm text-stone-500 mt-1">Tu informacion queda separada por usuario.</p>

        <div className="mt-5 flex flex-col gap-3">
          {isRegister && (
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2"
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          )}
          <input
            className="w-full border border-stone-200 rounded-lg px-3 py-2"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            className="w-full border border-stone-200 rounded-lg px-3 py-2"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            minLength={6}
            required
          />
        </div>

        <button
          disabled={loading}
          className="mt-5 w-full bg-violet-600 text-white rounded-lg py-2 font-semibold hover:bg-violet-700 disabled:opacity-60"
          type="submit"
        >
          {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
        </button>

        <button
          type="button"
          className="mt-3 text-sm text-violet-600 hover:underline"
          onClick={() => setIsRegister((v) => !v)}
        >
          {isRegister ? 'Ya tengo cuenta' : 'No tengo cuenta, registrarme'}
        </button>
      </form>
    </div>
  )
}
