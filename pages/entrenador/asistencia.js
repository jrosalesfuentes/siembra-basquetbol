import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ESTADOS = [
  { value: 'presente', label: 'Presente', color: 'pill-green' },
  { value: 'ausente', label: 'Ausente', color: 'pill-red' },
  { value: 'justificado', label: 'Justificado', color: 'pill-yellow' },
  { value: 'licencia_medica', label: 'Lic. médica', color: 'pill-gray' },
]

export default function Asistencia() {
  const hoy = new Date().toISOString().split('T')[0]
  const [fecha, setFecha] = useState(hoy)
  const [alumnos, setAlumnos] = useState([])
  const [asistencia, setAsistencia] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historial, setHistorial] = useState([])
  const [vistaHistorial, setVistaHistorial] = useState(false)

  useEffect(() => { cargarAlumnos() }, [])
  useEffect(() => { if (alumnos.length > 0) cargarAsistencia() }, [fecha, alumnos])

  const cargarAlumnos = async () => {
    const { data } = await supabase.from('alumnos').select('id, nombre, categoria').eq('activo', true).order('nombre')
    setAlumnos(data || [])
  }

  const cargarAsistencia = async () => {
    setLoading(true)
    const { data } = await supabase.from('asistencia').select('*').eq('fecha', fecha)
    const map = {}
    data?.forEach(a => { map[a.alumno_id] = a.estado })
    setAsistencia(map)
    setLoading(false)
  }

  const cargarHistorial = async () => {
    const { data } = await supabase.from('asistencia')
      .select('*, alumnos(nombre, categoria)')
      .order('fecha', { ascending: false })
      .limit(50)
    setHistorial(data || [])
    setVistaHistorial(true)
  }

  const marcarEstado = (alumnoId, estado) => {
    setAsistencia(prev => ({ ...prev, [alumnoId]: estado }))
  }

  const guardarAsistencia = async () => {
    setGuardando(true)
    try {
      const registros = alumnos.map(a => ({
        alumno_id: a.id,
        fecha,
        estado: asistencia[a.id] || 'ausente'
      }))
      const { error } = await supabase.from('asistencia').upsert(registros, { onConflict: 'alumno_id,fecha' })
      if (error) throw error
      toast.success('Asistencia guardada')
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const resumen = {
    presente: alumnos.filter(a => asistencia[a.id] === 'presente').length,
    ausente: alumnos.filter(a => asistencia[a.id] === 'ausente').length,
    justificado: alumnos.filter(a => asistencia[a.id] === 'justificado').length,
    licencia_medica: alumnos.filter(a => asistencia[a.id] === 'licencia_medica').length,
  }

  return (
    <Layout rol="entrenador">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">ASISTENCIA</h1>
        <button onClick={cargarHistorial} className="btn-secondary text-xs">Ver historial</button>
      </div>

      {/* Selector fecha */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 font-medium">Fecha:</label>
        <input type="date" className="input max-w-[180px]" value={fecha} onChange={e => setFecha(e.target.value)} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {ESTADOS.map(e => (
          <div key={e.value} className="card text-center p-3">
            <p className="text-xl font-bold text-[#1B2A5E]">{resumen[e.value]}</p>
            <p className="text-xs text-gray-400 mt-0.5">{e.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1B2A5E] text-sm">
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <button onClick={guardarAsistencia} disabled={guardando || alumnos.length === 0} className="btn-primary text-xs">
            {guardando ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>

        {loading ? <p className="text-center text-gray-400 py-6">Cargando...</p> :
          alumnos.length === 0 ? <p className="text-center text-gray-400 py-6">No hay alumnos registrados</p> :
          <div className="space-y-2">
            {alumnos.map(alumno => (
              <div key={alumno.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-[#E8F7FF] flex items-center justify-center text-[#1B2A5E] text-xs font-bold flex-shrink-0">
                  {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{alumno.nombre}</p>
                  <p className="text-xs text-gray-400">{alumno.categoria}</p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {ESTADOS.map(e => (
                    <button key={e.value} onClick={() => marcarEstado(alumno.id, e.value)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${asistencia[alumno.id] === e.value ? `pill ${e.color} border-transparent` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* Modal historial */}
      {vistaHistorial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1B2A5E]">Historial de asistencia</h2>
              <button onClick={() => setVistaHistorial(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {historial.map(h => {
                const estado = ESTADOS.find(e => e.value === h.estado)
                return (
                  <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{h.alumnos?.nombre}</p>
                      <p className="text-xs text-gray-400">{new Date(h.fecha + 'T12:00:00').toLocaleDateString('es-CL')} · {h.alumnos?.categoria}</p>
                    </div>
                    <span className={`pill ${estado?.color}`}>{estado?.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
