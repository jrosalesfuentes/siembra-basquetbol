import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function Registro() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [paso, setPaso] = useState(1) // 1: formulario, 2: pendiente aprobación

  const handleRegistro = async (e) => {
    e.preventDefault()
    if (password !== confirmar) { toast.error('Las contraseñas no coinciden'); return }
    if (password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      // 1. Verificar que el email existe en una ficha creada por el entrenador
      const { data: alumnoExistente, error: errorBusqueda } = await supabase
        .from('alumnos')
        .select('id, nombre, estado_acceso, usuario_id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (errorBusqueda || !alumnoExistente) {
        toast.error('Este email no está registrado por el entrenador. Contacta al entrenador primero.')
        setLoading(false)
        return
      }

      if (alumnoExistente.usuario_id) {
        toast.error('Este email ya tiene una cuenta creada. Intenta iniciar sesión.')
        setLoading(false)
        return
      }

      if (alumnoExistente.estado_acceso === 'pendiente') {
        toast.error('Ya tienes una solicitud pendiente. Espera la aprobación del entrenador.')
        setLoading(false)
        return
      }

      if (alumnoExistente.estado_acceso === 'rechazado') {
        toast.error('Tu solicitud fue rechazada. Contacta al entrenador.')
        setLoading(false)
        return
      }

      // 2. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      })
      if (authError) throw authError

      // 3. Crear registro en tabla usuarios con rol alumno
      const { error: usuarioError } = await supabase.from('usuarios').insert([{
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        nombre: alumnoExistente.nombre,
        rol: 'alumno'
      }])
      if (usuarioError) throw usuarioError

      // 4. Actualizar ficha del alumno: vincular usuario y marcar como pendiente
      const { error: alumnoError } = await supabase
        .from('alumnos')
        .update({
          usuario_id: authData.user.id,
          estado_acceso: 'pendiente'
        })
        .eq('id', alumnoExistente.id)
      if (alumnoError) throw alumnoError

      // 5. Enviar notificación al entrenador
      await fetch('/api/notificaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: 'Nueva solicitud de acceso',
          mensaje: `${alumnoExistente.nombre} solicita acceso a la app`
        })
      })

      // Cerrar sesión hasta que sea aprobado
      await supabase.auth.signOut()
      setPaso(2)
    } catch (error) {
      toast.error(error.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1B2A5E] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Siembra Basketball" className="w-24 h-24 mx-auto mb-4 rounded-full bg-white p-1" />
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">SIEMBRA</h1>
          <p className="text-[#29ABE2] text-sm mt-1">Basketball Buin</p>
        </div>

        {paso === 1 ? (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1B2A5E] mb-1">Crear cuenta</h2>
            <p className="text-xs text-gray-400 mb-5">Usa el email que el entrenador registró para ti</p>
            <form onSubmit={handleRegistro} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input type="password" className="input" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repite tu contraseña" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#29ABE2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1a94cc] transition-colors disabled:opacity-50">
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-4">
              ¿Ya tienes cuenta?{' '}
              <Link href="/" className="text-[#29ABE2] hover:underline">Inicia sesión</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-2">Solicitud enviada</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tu cuenta fue creada correctamente. El entrenador debe aprobar tu acceso antes de que puedas ingresar.
            </p>
            <p className="text-xs text-gray-400 mb-5">Te avisaremos cuando seas aprobado.</p>
            <Link href="/" className="btn-primary w-full block text-center">Volver al inicio</Link>
          </div>
        )}

        <p className="text-center text-white/40 text-xs mt-6">
          Siembra Basketball Buin © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
