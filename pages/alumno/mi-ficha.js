import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

export default function MiFicha() {
  const [alumno, setAlumno] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('alumnos').select('*').eq('usuario_id', user.id).single()
      setAlumno(data)
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return <Layout rol="alumno"><p className="text-center text-gray-400 py-12">Cargando...</p></Layout>
  if (!alumno) return <Layout rol="alumno"><p className="text-center text-gray-400 py-12">No se encontró tu ficha. Contacta al entrenador.</p></Layout>

  const edad = () => {
    const hoy = new Date()
    const nac = new Date(alumno.fecha_nacimiento)
    let e = hoy.getFullYear() - nac.getFullYear()
    if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) e--
    return e
  }

  return (
    <Layout rol="alumno">
      <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide mb-6">MI FICHA</h1>
      <div className="card">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-[#E8F7FF] flex items-center justify-center text-[#1B2A5E] text-xl font-bold">
            {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-[#1B2A5E] text-lg">{alumno.nombre}</h2>
            <span className="pill pill-blue">{alumno.categoria}</span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-400">RUT</span><span className="font-medium">{alumno.rut}</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-400">Fecha de nacimiento</span><span className="font-medium">{new Date(alumno.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-CL')}</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-400">Edad</span><span className="font-medium">{edad()} años</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-400">Categoría</span><span className="font-medium">{alumno.categoria}</span></div>
          <div className="py-2 border-b border-gray-50">
            <p className="text-gray-400 mb-1">Condiciones de salud</p>
            <p className="font-medium">{alumno.enfermedades || 'Ninguna'}</p>
          </div>
          <div className="py-2">
            <p className="text-gray-400 mb-1">Contacto de emergencia</p>
            <p className="font-medium">{alumno.contacto_emergencia_nombre}</p>
            <p className="text-[#29ABE2]">{alumno.contacto_emergencia_telefono}</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
