import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

const ESTADOS = { presente: { label: 'Presente', color: 'pill-green' }, ausente: { label: 'Ausente', color: 'pill-red' }, justificado: { label: 'Justificado', color: 'pill-yellow' }, licencia_medica: { label: 'Lic. médica', color: 'pill-gray' } }

export default function AsistenciaAlumno() {
  const [registros, setRegistros] = useState([])
  const [stats, setStats] = useState({ total: 0, presente: 0, porcentaje: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: al } = await supabase.from('alumnos').select('id').eq('usuario_id', user.id).single()
      if (!al) { setLoading(false); return }
      const { data } = await supabase.from('asistencia').select('*').eq('alumno_id', al.id).order('fecha', { ascending: false })
      setRegistros(data || [])
      const total = data?.length || 0
      const presentes = data?.filter(r => r.estado === 'presente').length || 0
      setStats({ total, presente: presentes, porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0 })
      setLoading(false)
    }
    cargar()
  }, [])

  return (
    <Layout rol="alumno">
      <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide mb-6">MI ASISTENCIA</h1>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center p-3"><p className="text-2xl font-bold text-[#29ABE2]">{stats.porcentaje}%</p><p className="text-xs text-gray-400">Asistencia</p></div>
        <div className="card text-center p-3"><p className="text-2xl font-bold text-green-600">{stats.presente}</p><p className="text-xs text-gray-400">Presentes</p></div>
        <div className="card text-center p-3"><p className="text-2xl font-bold text-gray-500">{stats.total}</p><p className="text-xs text-gray-400">Total</p></div>
      </div>
      <div className="card">
        {loading ? <p className="text-center text-gray-400 py-8">Cargando...</p> :
          registros.length === 0 ? <p className="text-center text-gray-400 py-8">Sin registros aún</p> :
          <div className="space-y-2">
            {registros.map(r => {
              const est = ESTADOS[r.estado]
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-700">{new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <span className={`pill ${est?.color}`}>{est?.label}</span>
                </div>
              )
            })}
          </div>
        }
      </div>
    </Layout>
  )
}
