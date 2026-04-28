import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIAS = ['U13', 'U14', 'U15', 'U17', 'U18', 'U19', 'Adulto']

export default function Notificaciones() {
  const [alumnos, setAlumnos] = useState([])
  const [destinatario, setDestinatario] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('U17')
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('')
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [historial, setHistorial] = useState([])

  useEffect(() => { cargarAlumnos() }, [])

  const cargarAlumnos = async () => {
    const { data } = await supabase.from('alumnos').select('id, nombre, categoria').eq('activo', true).order('nombre')
    setAlumnos(data || [])
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !mensaje.trim()) { toast.error('Completa el título y mensaje'); return }
    setEnviando(true)
    try {
      let segmento = 'All'
      let destinatarioLabel = 'Todos los alumnos'

      if (destinatario === 'categoria') {
        segmento = 'All' // OneSignal free no filtra por segmento custom, enviamos a todos
        destinatarioLabel = `Categoría ${categoriaSeleccionada}`
      } else if (destinatario === 'alumno') {
        const alumno = alumnos.find(a => a.id === alumnoSeleccionado)
        destinatarioLabel = alumno?.nombre || 'Alumno'
      }

      const res = await fetch('/api/notificaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, mensaje, segmento })
      })

      if (!res.ok) throw new Error('Error al enviar')

      toast.success('Notificación enviada ✅')

      // Guardar en historial local
      setHistorial(prev => [{
        id: Date.now(),
        titulo,
        mensaje,
        destinatario: destinatarioLabel,
        fecha: new Date()
      }, ...prev].slice(0, 10))

      setTitulo('')
      setMensaje('')
    } catch (error) {
      toast.error('Error al enviar la notificación')
    } finally {
      setEnviando(false)
    }
  }

  const ejemplos = [
    { titulo: '🏀 Entrenamiento hoy', mensaje: 'Recuerda que hoy hay entrenamiento a las 19:00 hrs. ¡Los esperamos!' },
    { titulo: '⚠️ Entrenamiento cancelado', mensaje: 'El entrenamiento de hoy ha sido cancelado. Se avisará nueva fecha.' },
    { titulo: '💰 Recordatorio de pago', mensaje: 'Recuerda subir tu comprobante de pago del mes en la app.' },
    { titulo: '📋 Evaluación física', mensaje: 'Este jueves realizaremos evaluaciones físicas. Vengan preparados.' },
  ]

  return (
    <Layout rol="entrenador">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">NOTIFICACIONES</h1>
        <p className="text-gray-500 text-sm mt-1">Envía mensajes a tus alumnos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Formulario */}
        <div className="card">
          <h2 className="font-semibold text-[#1B2A5E] text-sm mb-4">Nueva notificación</h2>
          <form onSubmit={handleEnviar} className="space-y-4">

            {/* Destinatario */}
            <div>
              <label className="label">Enviar a</label>
              <div className="flex gap-2">
                {[
                  { value: 'todos', label: '👥 Todos' },
                  { value: 'categoria', label: '🏷️ Categoría' },
                  { value: 'alumno', label: '👤 Alumno' },
                ].map(op => (
                  <button key={op.value} type="button"
                    onClick={() => setDestinatario(op.value)}
                    className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${destinatario === op.value ? 'bg-[#1B2A5E] text-white border-[#1B2A5E]' : 'border-gray-200 text-gray-600 hover:border-[#29ABE2]'}`}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector categoría */}
            {destinatario === 'categoria' && (
              <div>
                <label className="label">Categoría</label>
                <select className="input" value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* Selector alumno */}
            {destinatario === 'alumno' && (
              <div>
                <label className="label">Alumno</label>
                <select className="input" value={alumnoSeleccionado} onChange={e => setAlumnoSeleccionado(e.target.value)} required>
                  <option value="">Seleccionar alumno</option>
                  {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.categoria})</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label">Título</label>
              <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Entrenamiento hoy" required maxLength={50} />
              <p className="text-xs text-gray-400 mt-1 text-right">{titulo.length}/50</p>
            </div>

            <div>
              <label className="label">Mensaje</label>
              <textarea className="input h-24 resize-none" value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Escribe el mensaje aquí..." required maxLength={200} />
              <p className="text-xs text-gray-400 mt-1 text-right">{mensaje.length}/200</p>
            </div>

            <button type="submit" disabled={enviando} className="w-full btn-primary">
              {enviando ? 'Enviando...' : '📣 Enviar notificación'}
            </button>
          </form>
        </div>

        {/* Panel derecho */}
        <div className="flex flex-col gap-4">
          {/* Mensajes de ejemplo */}
          <div className="card">
            <h2 className="font-semibold text-[#1B2A5E] text-sm mb-3">Mensajes rápidos</h2>
            <div className="space-y-2">
              {ejemplos.map((ej, i) => (
                <button key={i} onClick={() => { setTitulo(ej.titulo); setMensaje(ej.mensaje) }}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-[#E8F7FF] transition-colors border border-transparent hover:border-[#29ABE2]">
                  <p className="text-xs font-semibold text-gray-800">{ej.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ej.mensaje}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Historial */}
          {historial.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-[#1B2A5E] text-sm mb-3">Enviadas recientemente</h2>
              <div className="space-y-2">
                {historial.map(h => (
                  <div key={h.id} className="p-3 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-800">{h.titulo}</p>
                      <p className="text-xs text-gray-400 flex-shrink-0">{h.fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{h.mensaje}</p>
                    <p className="text-xs text-[#29ABE2] mt-1">→ {h.destinatario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
