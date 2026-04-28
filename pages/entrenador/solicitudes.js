import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState(null)

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
    await supabase.from('alumnos')
      .update({ estado_acceso: 'aprobado', activo: true })
      .eq('id', alumno.id)

    await fetch('/api/notificaciones/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: '¡Acceso aprobado!',
        mensaje: `${alumno.nombre}, ya puedes ingresar a la app de Siembra Basketball`
      })
    })
    toast.success(`${alumno.nombre} aprobado ✅`)
    setDetalle(null)
    cargarSolicitudes()
  }

  const rechazar = async (alumno) => {
    if (!confirm(`¿Rechazar solicitud de ${alumno.nombre}?`)) return
    await supabase.from('alumnos')
      .update({ estado_acceso: 'rechazado', activo: false })
      .eq('id', alumno.id)
    toast.success(`Solicitud de ${alumno.nombre} rechazada`)
    setDetalle(null)
    cargarSolicitudes()
  }

  const edad = (fechaNac) => {
    const hoy = new Date()
    const nac = new Date(fechaNac)
    let e = hoy.getFullYear() - nac.getFullYear()
    if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) e--
    return e
  }

  return (
    <Layout rol="entrenador">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">SOLICITUDES</h1>
        <p className="text-gray-500 text-sm mt-1">Alumnos esperando aprobación</p>
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
          <div className="space-y-3">
            {solicitudes.map(alumno => (
              <div key={alumno.id} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0 text-sm">
                  {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{alumno.nombre}</p>
                  <p className="text-xs text-gray-500">{alumno.categoria} · {alumno.email}</p>
                  {alumno.enfermedades && (
                    <p className="text-xs text-amber-600 mt-0.5">⚠️ {alumno.enfermedades}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setDetalle(alumno)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Ver
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

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#E8F7FF] flex items-center justify-center text-[#1B2A5E] font-bold">
                {detalle.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-[#1B2A5E]">{detalle.nombre}</h2>
                <span className="pill pill-blue">{detalle.categoria}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">RUT</span><span className="font-medium">{detalle.rut}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Nacimiento</span><span className="font-medium">{new Date(detalle.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-CL')} ({edad(detalle.fecha_nacimiento)} años)</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Email</span><span className="font-medium">{detalle.email}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Condiciones</span><span className="font-medium text-right max-w-[60%]">{detalle.enfermedades || 'Ninguna'}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Emergencia</span><span className="font-medium">{detalle.contacto_emergencia_nombre}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Teléfono</span><span className="font-medium">{detalle.contacto_emergencia_telefono}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => rechazar(detalle)} className="flex-1 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50">Rechazar</button>
              <button onClick={() => aprobar(detalle)} className="flex-1 bg-[#29ABE2] text-white py-2 rounded-lg text-sm hover:bg-[#1a94cc]">Aprobar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
