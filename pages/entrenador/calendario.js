import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const TIPOS_APTITUD = ['velocidad', 'fuerza', 'potencia', 'resistencia', 'mixto']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const colorTipo = { velocidad: '#29ABE2', fuerza: '#1B2A5E', potencia: '#E8722A', resistencia: '#10B981', mixto: '#8B5CF6' }

const FORM_INICIAL = { fecha: '', titulo: '', descripcion: '', tipo_aptitud: 'velocidad' }

export default function Calendario() {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [sesiones, setSesiones] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  useEffect(() => { cargarSesiones() }, [anio, mes])

  const cargarSesiones = async () => {
    const inicio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-31`
    const { data } = await supabase.from('calendario').select('*').gte('fecha', inicio).lte('fecha', fin).order('fecha')
    setSesiones(data || [])
  }

  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const primerDia = new Date(anio, mes, 1).getDay()
  const offsetInicio = primerDia === 0 ? 6 : primerDia - 1

  const sesionDelDia = (dia) => {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return sesiones.find(s => s.fecha === fechaStr)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const { error } = await supabase.from('calendario').insert([form])
      if (error) throw error
      toast.success('Sesión agregada al calendario')
      setModal(false)
      setForm(FORM_INICIAL)
      cargarSesiones()
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta sesión?')) return
    await supabase.from('calendario').delete().eq('id', id)
    toast.success('Sesión eliminada')
    setDiaSeleccionado(null)
    cargarSesiones()
  }

  const handleClickDia = (dia) => {
    const sesion = sesionDelDia(dia)
    if (sesion) setDiaSeleccionado(sesion)
    else {
      const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      setForm({ ...FORM_INICIAL, fecha: fechaStr })
      setModal(true)
    }
  }

  return (
    <Layout rol="entrenador">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">CALENDARIO</h1>
        <button onClick={() => { setForm(FORM_INICIAL); setModal(true) }} className="btn-primary">+ Agregar sesión</button>
      </div>

      {/* Navegación mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">‹</button>
        <h2 className="font-semibold text-[#1B2A5E]">{MESES[mes]} {anio}</h2>
        <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">›</button>
      </div>

      <div className="card">
        {/* Cabeceras días */}
        <div className="grid grid-cols-7 mb-2">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1 font-medium">{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-1">
          {Array(offsetInicio).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array(diasEnMes).fill(null).map((_, i) => {
            const dia = i + 1
            const sesion = sesionDelDia(dia)
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
            return (
              <div key={dia} onClick={() => handleClickDia(dia)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all text-xs
                  ${esHoy ? 'bg-[#29ABE2] text-white font-bold' : sesion ? 'border-2 font-semibold' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                style={sesion && !esHoy ? { borderColor: colorTipo[sesion.tipo_aptitud], color: colorTipo[sesion.tipo_aptitud], backgroundColor: `${colorTipo[sesion.tipo_aptitud]}15` } : {}}>
                {dia}
                {sesion && <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: esHoy ? 'white' : colorTipo[sesion.tipo_aptitud] }}></div>}
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
          {TIPOS_APTITUD.map(tipo => (
            <span key={tipo} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorTipo[tipo] }}></span>
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Lista sesiones del mes */}
      {sesiones.length > 0 && (
        <div className="card mt-4">
          <h3 className="font-semibold text-[#1B2A5E] text-sm mb-3">Sesiones de {MESES[mes]}</h3>
          <div className="space-y-2">
            {sesiones.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: colorTipo[s.tipo_aptitud] }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.titulo}</p>
                  <p className="text-xs text-gray-400">{new Date(s.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={() => handleEliminar(s.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal detalle sesión */}
      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: colorTipo[diaSeleccionado.tipo_aptitud] }}></div>
            <h2 className="font-bold text-[#1B2A5E] text-lg mb-1">{diaSeleccionado.titulo}</h2>
            <p className="text-xs text-gray-400 mb-3">{new Date(diaSeleccionado.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-sm text-gray-600 capitalize mb-1">Tipo: <span className="font-medium">{diaSeleccionado.tipo_aptitud}</span></p>
            {diaSeleccionado.descripcion && <p className="text-sm text-gray-600 mt-2">{diaSeleccionado.descripcion}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleEliminar(diaSeleccionado.id)} className="flex-1 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50">Eliminar</button>
              <button onClick={() => setDiaSeleccionado(null)} className="flex-1 btn-primary">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva sesión */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-4">Nueva sesión</h2>
            <form onSubmit={handleGuardar} className="space-y-3">
              <div><label className="label">Fecha</label><input type="date" className="input" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required /></div>
              <div><label className="label">Título</label><input className="input" placeholder="Ej: Trabajo de velocidad" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required /></div>
              <div>
                <label className="label">Aptitud física</label>
                <select className="input" value={form.tipo_aptitud} onChange={e => setForm({...form, tipo_aptitud: e.target.value})}>
                  {TIPOS_APTITUD.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="label">Descripción (opcional)</label><textarea className="input h-20 resize-none" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Detalles del entrenamiento..." /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 btn-primary">{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
