import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function DashboardAlumno() {
  const [alumno, setAlumno] = useState(null)
  const [proximoEnt, setProximoEnt] = useState(null)
  const [ultimasEvals, setUltimasEvals] = useState([])
  const [pagoMes, setPagoMes] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: al } = await supabase.from('alumnos').select('*').eq('usuario_id', user.id).single()
      if (!al) { setLoading(false); return }
      setAlumno(al)
      const hoy = new Date().toISOString().split('T')[0]
      const mesActual = new Date().getMonth() + 1
      const anioActual = new Date().getFullYear()
      const [{ data: cal }, { data: evals }, { data: pago }] = await Promise.all([
        supabase.from('calendario').select('*').gte('fecha', hoy).order('fecha').limit(1),
        supabase.from('evaluaciones').select('*').eq('alumno_id', al.id).order('fecha', { ascending: false }).limit(3),
        supabase.from('pagos').select('*').eq('alumno_id', al.id).eq('mes', mesActual).eq('anio', anioActual).single()
      ])
      setProximoEnt(cal?.[0] || null)
      setUltimasEvals(evals || [])
      setPagoMes(pago)
      setLoading(false)
    }
    cargar()
  }, [])

  const colorTipo = { velocidad: '#29ABE2', fuerza: '#1B2A5E', potencia: '#E8722A', resistencia: '#10B981' }

  const renderResultado = (ev) => {
    if (ev.tipo === 'velocidad') return `${ev.distancia_metros}m en ${ev.tiempo_segundos}s`
    if (ev.tipo === 'fuerza') return `${ev.ejercicio}: ${ev.repeticiones} reps`
    if (ev.tipo === 'potencia') return `${ev.distancia_salto_cm} cm`
    if (ev.tipo === 'resistencia') return `${ev.distancia_recorrida_metros}m en ${ev.tiempo_minutos} min`
  }

  return (
    <Layout rol="alumno">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">
          HOLA, {alumno?.nombre?.split(' ')[0]?.toUpperCase() || 'ATLETA'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Mi categoría</p>
          <p className="text-2xl font-bold text-[#29ABE2]">{alumno?.categoria || '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Pago {new Date().toLocaleDateString('es-CL', { month: 'long' })}</p>
          {!pagoMes || pagoMes.estado === 'pendiente' ? (
            <p className="text-sm font-semibold text-red-500">Pendiente</p>
          ) : pagoMes.estado === 'subido' ? (
            <p className="text-sm font-semibold text-amber-500">En revisión</p>
          ) : (
            <p className="text-sm font-semibold text-green-600">Al día ✓</p>
          )}
        </div>
      </div>

      {/* Próximo entrenamiento */}
      <div className="card mb-4" style={{ borderLeft: '4px solid #29ABE2' }}>
        <p className="text-xs text-gray-400 mb-1">Próximo entrenamiento</p>
        {proximoEnt ? (
          <>
            <p className="font-semibold text-[#1B2A5E]">{proximoEnt.titulo}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(proximoEnt.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            {proximoEnt.descripcion && <p className="text-xs text-gray-500 mt-1">{proximoEnt.descripcion}</p>}
          </>
        ) : (
          <p className="text-sm text-gray-400">Sin entrenamientos programados</p>
        )}
      </div>

      {/* Últimas evaluaciones */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1B2A5E] text-sm">Mis últimas evaluaciones</h2>
          <Link href="/alumno/evaluaciones" className="text-xs text-[#29ABE2] hover:underline">Ver todas →</Link>
        </div>
        {ultimasEvals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">Sin evaluaciones aún</p>
        ) : (
          <div className="space-y-2">
            {ultimasEvals.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: colorTipo[ev.tipo] }}></div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700 capitalize">{ev.tipo}</p>
                  <p className="text-xs text-gray-500">{renderResultado(ev)}</p>
                </div>
                <p className="text-xs text-gray-400">{new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/alumno/pagos" className="card flex flex-col items-center gap-2 p-4 hover:bg-gray-50 transition-colors text-center">
          <span className="text-3xl">💳</span>
          <span className="text-xs font-medium text-[#1B2A5E]">Subir comprobante</span>
        </Link>
        <Link href="/alumno/calendario" className="card flex flex-col items-center gap-2 p-4 hover:bg-gray-50 transition-colors text-center">
          <span className="text-3xl">📅</span>
          <span className="text-xs font-medium text-[#1B2A5E]">Ver calendario</span>
        </Link>
      </div>
    </Layout>
  )
}
