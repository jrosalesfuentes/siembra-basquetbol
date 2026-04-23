import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

const TIPOS = ['velocidad', 'fuerza', 'potencia', 'resistencia']
const colorTipo = { velocidad: '#29ABE2', fuerza: '#1B2A5E', potencia: '#E8722A', resistencia: '#10B981' }

export default function EvaluacionesAlumno() {
  const [evaluaciones, setEvaluaciones] = useState([])
  const [filtro, setFiltro] = useState('velocidad')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: al } = await supabase.from('alumnos').select('id').eq('usuario_id', user.id).single()
      if (!al) { setLoading(false); return }
      const { data } = await supabase.from('evaluaciones').select('*').eq('alumno_id', al.id).order('fecha', { ascending: false })
      setEvaluaciones(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const evalsFiltradas = evaluaciones.filter(e => e.tipo === filtro)

  const renderResultado = (ev) => {
    if (ev.tipo === 'velocidad') return `${ev.distancia_metros}m en ${ev.tiempo_segundos} segundos`
    if (ev.tipo === 'fuerza') return `${ev.ejercicio}: ${ev.repeticiones} repeticiones`
    if (ev.tipo === 'potencia') return `${ev.distancia_salto_cm} cm de salto`
    if (ev.tipo === 'resistencia') return `${ev.distancia_recorrida_metros}m en ${ev.tiempo_minutos} minutos`
  }

  return (
    <Layout rol="alumno">
      <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide mb-6">MIS EVALUACIONES</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {TIPOS.map(tipo => (
          <button key={tipo} onClick={() => setFiltro(tipo)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${filtro === tipo ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
            style={filtro === tipo ? { backgroundColor: colorTipo[tipo] } : {}}>
            {tipo}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <p className="text-center text-gray-400 py-8">Cargando...</p> :
          evalsFiltradas.length === 0 ? <p className="text-center text-gray-400 py-8">Sin evaluaciones de {filtro} aún</p> :
          <div className="space-y-3">
            {evalsFiltradas.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: colorTipo[ev.tipo] }}></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{renderResultado(ev)}</p>
                  {ev.notas && <p className="text-xs text-gray-400 italic">{ev.notas}</p>}
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</p>
              </div>
            ))}
          </div>
        }
      </div>
    </Layout>
  )
}
