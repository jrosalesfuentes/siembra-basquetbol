import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarSolicitudes() }, [])

  const cargarSolicitudes = async () => {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .eq('estado_acceso', 'pendiente')
      .order('created_at', { ascending: false })
    setSolicitudes(data || [])
    setLoading(false)
  }

  const aprobar = async (alumno) => {
    await supabase.from('alumnos').update({ estado_acceso: 'aprobado' }).eq('id', alumno.id)
    // Notificar al alumno
    await fetch('/api/notificaciones/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '¡Acceso aprobado!',
        mensaje: `${alumno.nombre}, ya puedes ingresar a la app de Siembra Basketball`
      })
    })
    toast.success(`${alumno.nombre} aprobado`)
    cargarSolicitudes()
  }

  const rechazar = async (alumno) => {
    if (!confirm(`¿Rechazar acceso de ${alumno.nombre}?`)) return
    await supabase.from('alumnos').update({ estado_acceso: 'rechazado', usuario_id: null }).eq('id', alumno.id)
    // Eliminar usuario de auth
    toast.success(`${alumno.nombre} rechazado`)
    cargarSolicitudes()
  }

  return (
    <Layout rol="entrenador">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">SOLICITUDES DE ACCESO</h1>
        <p className="text-gray-500 text-sm mt-1">Alumnos que quieren ingresar a la app</p>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando...</p>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-400 text-sm">No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map(alumno => (
              <div key={alumno.id} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0">
                  {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{alumno.nombre}</p>
                  <p className="text-xs text-gray-500">{alumno.email} · {alumno.categoria}</p>
                  <p className="text-xs text-amber-600 mt-0.5">Solicitud pendiente de aprobación</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => rechazar(alumno)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    Rechazar
                  </button>
                  <button onClick={() => aprobar(alumno)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#29ABE2] text-white hover:bg-[#1a94cc]">
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
