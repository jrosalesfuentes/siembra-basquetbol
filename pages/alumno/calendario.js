import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const colorTipo = { velocidad: '#29ABE2', fuerza: '#1B2A5E', potencia: '#E8722A', resistencia: '#10B981', mixto: '#8B5CF6' }

export function CalendarioAlumno() {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [sesiones, setSesiones] = useState([])
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const inicio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
      const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-31`
      const { data } = await supabase.from('calendario').select('*').gte('fecha', inicio).lte('fecha', fin).order('fecha')
      setSesiones(data || [])
    }
    cargar()
  }, [anio, mes])

  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const primerDia = new Date(anio, mes, 1).getDay()
  const offsetInicio = primerDia === 0 ? 6 : primerDia - 1
  const sesionDelDia = (dia) => {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return sesiones.find(s => s.fecha === fechaStr)
  }

  return (
    <Layout rol="alumno">
      <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide mb-6">CALENDARIO</h1>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600">‹</button>
        <h2 className="font-semibold text-[#1B2A5E]">{MESES[mes]} {anio}</h2>
        <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600">›</button>
      </div>
      <div className="card">
        <div className="grid grid-cols-7 mb-2">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(offsetInicio).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array(diasEnMes).fill(null).map((_, i) => {
            const dia = i + 1
            const sesion = sesionDelDia(dia)
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
            return (
              <div key={dia} onClick={() => sesion && setDiaSeleccionado(sesion)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all
                  ${esHoy ? 'bg-[#29ABE2] text-white font-bold' : sesion ? 'border-2 font-semibold cursor-pointer' : 'bg-gray-50 text-gray-700'}`}
                style={sesion && !esHoy ? { borderColor: colorTipo[sesion.tipo_aptitud], color: colorTipo[sesion.tipo_aptitud], backgroundColor: `${colorTipo[sesion.tipo_aptitud]}15` } : {}}>
                {dia}
                {sesion && <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: esHoy ? 'white' : colorTipo[sesion.tipo_aptitud] }}></div>}
              </div>
            )
          })}
        </div>
      </div>
      {sesiones.length > 0 && (
        <div className="card mt-4">
          <h3 className="font-semibold text-[#1B2A5E] text-sm mb-3">Entrenamientos de {MESES[mes]}</h3>
          <div className="space-y-2">
            {sesiones.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: colorTipo[s.tipo_aptitud] }}></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.titulo}</p>
                  <p className="text-xs text-gray-400">{new Date(s.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#1B2A5E] text-lg mb-1">{diaSeleccionado.titulo}</h2>
            <p className="text-xs text-gray-400 mb-3">{new Date(diaSeleccionado.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p className="text-sm text-gray-600 capitalize">Tipo: <span className="font-medium">{diaSeleccionado.tipo_aptitud}</span></p>
            {diaSeleccionado.descripcion && <p className="text-sm text-gray-600 mt-2">{diaSeleccionado.descripcion}</p>}
            <button onClick={() => setDiaSeleccionado(null)} className="w-full btn-primary mt-4">Cerrar</button>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default CalendarioAlumno
