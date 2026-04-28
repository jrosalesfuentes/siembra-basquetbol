import { useState } from 'react'
import { supabase, calcularCategoria, formatearRut } from '../lib/supabase'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import Link from 'next/link'

const PASO1 = { email: '', password: '', confirmar: '' }
const PASO2 = {
  nombre: '', rut: '', fecha_nacimiento: '',
  enfermedades: '',
  contacto_emergencia_nombre: '', contacto_emergencia_telefono: ''
}

export default function Registro() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cred, setCred] = useState(PASO1)
  const [form, setForm] = useState(PASO2)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  // PASO 1 — Crear cuenta con email y contraseña
  const handlePaso1 = async (e) => {
    e.preventDefault()
    if (cred.password !== cred.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    if (cred.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cred.email.toLowerCase().trim(),
        password: cred.password,
      })
      if (error) throw error

      // Crear registro en usuarios
      const { error: usuarioError } = await supabase.from('usuarios').insert([{
        id: data.user.id,
        email: cred.email.toLowerCase().trim(),
        nombre: 'Por completar',
        rol: 'alumno'
      }])
      if (usuarioError) throw usuarioError

      setUserId(data.user.id)
      setPaso(2)
    } catch (error) {
      if (error.message?.includes('already registered')) {
        toast.error('Este email ya tiene una cuenta. Intenta iniciar sesión.')
      } else {
        toast.error(error.message || 'Error al crear cuenta')
      }
    } finally {
      setLoading(false)
    }
  }

  // PASO 2 — Completar datos personales
  const handlePaso2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const categoria = calcularCategoria(form.fecha_nacimiento)

      // Crear ficha del alumno
      const { error: alumnoError } = await supabase.from('alumnos').insert([{
        usuario_id: userId,
        nombre: form.nombre,
        rut: formatearRut(form.rut),
        fecha_nacimiento: form.fecha_nacimiento,
        categoria,
        email: cred.email.toLowerCase().trim(),
        enfermedades: form.enfermedades || null,
        contacto_emergencia_nombre: form.contacto_emergencia_nombre,
        contacto_emergencia_telefono: form.contacto_emergencia_telefono,
        estado_acceso: 'pendiente',
        activo: false
      }])
      if (alumnoError) throw alumnoError

      // Actualizar nombre en usuarios
      await supabase.from('usuarios').update({ nombre: form.nombre }).eq('id', userId)

      // Notificar al entrenador
      await fetch('/api/notificaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: 'Nueva solicitud de acceso',
          mensaje: `${form.nombre} solicita unirse a Siembra Basketball`
        })
      })

      // Cerrar sesión hasta ser aprobado
      await supabase.auth.signOut()
      setPaso(3)
    } catch (error) {
      toast.error(error.message || 'Error al guardar datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1B2A5E] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Siembra Basketball" className="w-20 h-20 mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">SIEMBRA</h1>
          <p className="text-[#29ABE2] text-sm mt-1">Basketball Buin</p>
        </div>

        {/* Indicador de pasos */}
        {paso < 3 && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${paso >= n ? 'bg-[#29ABE2] text-white' : 'bg-white/20 text-white/40'}`}>{n}</div>
                {n < 2 && <div className={`w-8 h-0.5 ${paso > n ? 'bg-[#29ABE2]' : 'bg-white/20'}`}></div>}
              </div>
            ))}
          </div>
        )}

        {/* PASO 1 — Cuenta */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1B2A5E] mb-1">Crear cuenta</h2>
            <p className="text-xs text-gray-400 mb-5">Paso 1 de 2 — Datos de acceso</p>
            <form onSubmit={handlePaso1} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={cred.email} onChange={e => setCred({...cred, email: e.target.value})} placeholder="tu@email.com" required />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input type="password" className="input" value={cred.password} onChange={e => setCred({...cred, password: e.target.value})} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input type="password" className="input" value={cred.confirmar} onChange={e => setCred({...cred, confirmar: e.target.value})} placeholder="Repite tu contraseña" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#29ABE2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1a94cc] transition-colors disabled:opacity-50">
                {loading ? 'Creando cuenta...' : 'Continuar →'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-4">
              ¿Ya tienes cuenta?{' '}
              <Link href="/" className="text-[#29ABE2] hover:underline">Inicia sesión</Link>
            </p>
          </div>
        )}

        {/* PASO 2 — Datos personales */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1B2A5E] mb-1">Tus datos</h2>
            <p className="text-xs text-gray-400 mb-5">Paso 2 de 2 — Información personal</p>
            <form onSubmit={handlePaso2} className="space-y-3">
              <div>
                <label className="label">Nombre completo</label>
                <input className="input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre y apellidos" required />
              </div>
              <div>
                <label className="label">RUT</label>
                <input className="input" value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} placeholder="12.345.678-9" required />
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input type="date" className="input" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} required />
                {form.fecha_nacimiento && (
                  <p className="text-xs text-[#29ABE2] mt-1">Categoría: <strong>{calcularCategoria(form.fecha_nacimiento)}</strong></p>
                )}
              </div>
              <div>
                <label className="label">Enfermedades o condiciones de salud</label>
                <textarea className="input h-14 resize-none" value={form.enfermedades} onChange={e => setForm({...form, enfermedades: e.target.value})} placeholder="Ninguna" />
              </div>
              <div>
                <label className="label">Nombre contacto de emergencia</label>
                <input className="input" value={form.contacto_emergencia_nombre} onChange={e => setForm({...form, contacto_emergencia_nombre: e.target.value})} required />
              </div>
              <div>
                <label className="label">Teléfono contacto de emergencia</label>
                <input type="tel" className="input" value={form.contacto_emergencia_telefono} onChange={e => setForm({...form, contacto_emergencia_telefono: e.target.value})} placeholder="+56 9 1234 5678" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#29ABE2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1a94cc] transition-colors disabled:opacity-50">
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
              </button>
            </form>
          </div>
        )}

        {/* PASO 3 — Pendiente */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-2">¡Solicitud enviada!</h2>
            <p className="text-sm text-gray-500 mb-2">Tus datos fueron registrados correctamente.</p>
            <p className="text-sm text-gray-500 mb-5">La entrenadora debe aprobar tu acceso antes de que puedas ingresar. Te avisaremos cuando seas aprobado.</p>
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
