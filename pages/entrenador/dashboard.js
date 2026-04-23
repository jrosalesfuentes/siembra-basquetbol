import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function DashboardEntrenador() {
  const [stats, setStats] = useState({ alumnos: 0, pagosPendientes: 0, proximoEntrenamiento: null })
  const [alumnosRecientes, setAlumnosRecientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const [{ count: totalAlumnos }, { data: pagos }, { data: calendario }, { data: recientes }] = await Promise.all([
        supabase.from('alumnos').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('pagos').select('*').eq('mes', new Date().getMonth() + 1).eq('anio', new Date().getFullYear()).eq('estado', 'pendiente'),
        supabase.from('calendario').select('*').gte('fecha', new Date().toISOString().split('T')[0]).order('fecha').limit(1),
        supabase.from('alumnos').select('*').eq('activo', true).order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        alumnos: totalAlumnos || 0,
        pagosPendientes: pagos?.length || 0,
        proximoEntrenamiento: calendario?.[0] || null,
      })
      setAlumnosRecientes(recientes || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const colorCategoria = (cat) => {
    const map = { U13: 'pill-blue', U14: 'pill-blue', U15: 'pill-green', U17: 'pill-green', U18: 'pill-yellow', U19: 'pill-yellow', Adulto: 'pill-gray' }
    return map[cat] || 'pill-gray'
  }

  return (
    <Layout rol="entrenador">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">DASHBOARD</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Total alumnos</p>
          <p className="text-3xl font-bold text-[#29ABE2]">{loading ? '—' : stats.alumnos}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Pagos pendientes</p>
          <p className="text-3xl font-bold text-[#E8722A]">{loading ? '—' : stats.pagosPendientes}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('es-CL', { month: 'long' })}</p>
        </div>
        <div className="card col-span-2">
          <p className="text-xs text-gray-400 mb-1">Próximo entrenamiento</p>
          {stats.proximoEntrenamiento ? (
            <>
              <p className="text-base font-semibold text-[#1B2A5E]">{stats.proximoEntrenamiento.titulo}</p>
              <p className="text-xs text-gray-400">{new Date(stats.proximoEntrenamiento.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Sin entrenamientos programados</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Alumnos recientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1B2A5E] text-sm">Alumnos recientes</h2>
            <Link href="/entrenador/alumnos" className="text-xs text-[#29ABE2] hover:underline">Ver todos →</Link>
          </div>
          {alumnosRecientes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No hay alumnos registrados</p>
          ) : (
            <div className="space-y-3">
              {alumnosRecientes.map(alumno => (
                <div key={alumno.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E8F7FF] flex items-center justify-center text-[#1B2A5E] text-xs font-semibold flex-shrink-0">
                    {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{alumno.nombre}</p>
                    <p className="text-xs text-gray-400">{alumno.categoria}</p>
                  </div>
                  <span className={`pill ${colorCategoria(alumno.categoria)}`}>{alumno.categoria}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="card">
          <h2 className="font-semibold text-[#1B2A5E] text-sm mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/entrenador/alumnos?nuevo=1" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#E8F7FF] hover:bg-[#d0eef9] transition-colors text-center">
              <span className="text-2xl">➕</span>
              <span className="text-xs font-medium text-[#1B2A5E]">Nuevo alumno</span>
            </Link>
            <Link href="/entrenador/asistencia" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#E8F7FF] hover:bg-[#d0eef9] transition-colors text-center">
              <span className="text-2xl">✅</span>
              <span className="text-xs font-medium text-[#1B2A5E]">Tomar asistencia</span>
            </Link>
            <Link href="/entrenador/evaluaciones?nueva=1" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#FEF0E8] hover:bg-[#fde0cc] transition-colors text-center">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-medium text-[#E8722A]">Nueva evaluación</span>
            </Link>
            <Link href="/entrenador/calendario?nuevo=1" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#FEF0E8] hover:bg-[#fde0cc] transition-colors text-center">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-medium text-[#E8722A]">Agregar sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
