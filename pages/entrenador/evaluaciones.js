import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const TIPOS = ['velocidad', 'fuerza', 'potencia', 'resistencia', 'antropometría']
const colorTipo = { velocidad: '#29ABE2', fuerza: '#1B2A5E', potencia: '#E8722A', resistencia: '#10B981', 'antropometría': '#8B5CF6' }

const FORM_INICIAL = {
  alumno_id: '', tipo: 'velocidad', fecha: new Date().toISOString().split('T')[0],
  distancia_metros: '', tiempo_segundos: '',
  ejercicio: '', repeticiones: '',
  distancia_salto_cm: '',
  distancia_recorrida_metros: '', tiempo_minutos: '',
  peso_kg: '', talla_cm: '',
  notas: ''
}

export default function Evaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState([])
  const [antropometrias, setAntropometrias] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('velocidad')
  const [filtroAlumno, setFiltroAlumno] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const [{ data: evals }, { data: antro }, { data: als }] = await Promise.all([
      supabase.from('evaluaciones').select('*, alumnos(nombre, categoria)').order('fecha', { ascending: false }),
      supabase.from('evaluaciones_antropometricas').select('*, alumnos(nombre, categoria)').order('fecha', { ascending: false }),
      supabase.from('alumnos').select('id, nombre, categoria').eq('activo', true).order('nombre')
    ])
    setEvaluaciones(evals || [])
    setAntropometrias(antro || [])
    setAlumnos(als || [])
    setLoading(false)
  }

  const evalsFiltradas = filtroTipo === 'antropometría'
    ? antropometrias.filter(e => !filtroAlumno || e.alumno_id === filtroAlumno)
    : evaluaciones.filter(e => e.tipo === filtroTipo && (!filtroAlumno || e.alumno_id === filtroAlumno))

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (form.tipo === 'antropometría') {
        const { error } = await supabase.from('evaluaciones_antropometricas').insert([{
          alumno_id: form.alumno_id, fecha: form.fecha,
          peso_kg: parseFloat(form.peso_kg), talla_cm: parseFloat(form.talla_cm), notas: form.notas
        }])
        if (error) throw error
      } else {
        const datos = { alumno_id: form.alumno_id, tipo: form.tipo, fecha: form.fecha, notas: form.notas }
        if (form.tipo === 'velocidad') { datos.distancia_metros = parseFloat(form.distancia_metros); datos.tiempo_segundos = parseFloat(form.tiempo_segundos) }
        if (form.tipo === 'fuerza') { datos.ejercicio = form.ejercicio; datos.repeticiones = parseInt(form.repeticiones) }
        if (form.tipo === 'potencia') { datos.distancia_salto_cm = parseFloat(form.distancia_salto_cm) }
        if (form.tipo === 'resistencia') { datos.distancia_recorrida_metros = parseFloat(form.distancia_recorrida_metros); datos.tiempo_minutos = parseFloat(form.tiempo_minutos) }
        const { error } = await supabase.from('evaluaciones').insert([datos])
        if (error) throw error
      }
      toast.success('Evaluación registrada')
      setModal(false)
      setForm(FORM_INICIAL)
      cargarDatos()
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const renderResultado = (ev) => {
    if (ev.tipo === 'velocidad') return `${ev.distancia_metros}m en ${ev.tiempo_segundos}s`
    if (ev.tipo === 'fuerza') return `${ev.ejercicio}: ${ev.repeticiones} reps`
    if (ev.tipo === 'potencia') return `${ev.distancia_salto_cm} cm de salto`
    if (ev.tipo === 'resistencia') return `${ev.distancia_recorrida_metros}m en ${ev.tiempo_minutos} min`
    return '—'
  }

  const clasificarIMC = (imc) => {
    if (!imc) return null
    const v = parseFloat(imc)
    if (v < 18.5) return { label: 'Bajo peso', color: 'pill-yellow' }
    if (v < 25) return { label: 'Normal', color: 'pill-green' }
    if (v < 30) return { label: 'Sobrepeso', color: 'pill-yellow' }
    return { label: 'Obesidad', color: 'pill-red' }
  }

  const imcPreview = form.peso_kg && form.talla_cm
    ? (parseFloat(form.peso_kg) / ((parseFloat(form.talla_cm) / 100) ** 2)).toFixed(1)
    : null

  return (
    <Layout rol="entrenador">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">EVALUACIONES</h1>
        <button onClick={() => { setForm(FORM_INICIAL); setModal(true) }} className="btn-primary">+ Nueva</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TIPOS.map(tipo => (
          <button key={tipo} onClick={() => setFiltroTipo(tipo)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${filtroTipo === tipo ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-[#29ABE2]'}`}
            style={filtroTipo === tipo ? { backgroundColor: colorTipo[tipo] } : {}}>
            {tipo}
          </button>
        ))}
      </div>

      <select className="input mb-4 max-w-xs" value={filtroAlumno} onChange={e => setFiltroAlumno(e.target.value)}>
        <option value="">Todos los alumnos</option>
        {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.categoria})</option>)}
      </select>

      <div className="card">
        {loading ? <p className="text-center text-gray-400 py-8">Cargando...</p> :
          evalsFiltradas.length === 0 ? <p className="text-center text-gray-400 py-8 capitalize">No hay evaluaciones de {filtroTipo}</p> :
          <div className="space-y-3">
            {filtroTipo === 'antropometría' ? evalsFiltradas.map(ev => {
              const claseIMC = clasificarIMC(ev.imc)
              return (
                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: colorTipo['antropometría'] }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{ev.alumnos?.nombre}</p>
                    <p className="text-xs text-gray-500">
                      Peso: <strong>{ev.peso_kg} kg</strong> · Talla: <strong>{ev.talla_cm} cm</strong>
                      {ev.imc && ` · IMC: ${ev.imc}`}
                    </p>
                    {ev.notas && <p className="text-xs text-gray-400 italic mt-0.5">{ev.notas}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    {claseIMC && <span className={`pill ${claseIMC.color}`}>{claseIMC.label}</span>}
                    <p className="text-xs text-gray-400">{new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</p>
                  </div>
                </div>
              )
            }) : evalsFiltradas.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: colorTipo[ev.tipo] }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{ev.alumnos?.nombre}</p>
                  <p className="text-xs text-gray-500">{renderResultado(ev)}</p>
                  {ev.notas && <p className="text-xs text-gray-400 italic mt-0.5">{ev.notas}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="pill pill-gray text-xs">{ev.alumnos?.categoria}</span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</p>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-4">Nueva evaluación</h2>
            <form onSubmit={handleGuardar} className="space-y-3">
              <div>
                <label className="label">Alumno</label>
                <select className="input" value={form.alumno_id} onChange={e => setForm({...form, alumno_id: e.target.value})} required>
                  <option value="">Seleccionar alumno</option>
                  {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.categoria})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="label">Fecha</label><input type="date" className="input" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required /></div>

              {form.tipo === 'velocidad' && <>
                <div><label className="label">Distancia (metros)</label><input type="number" step="0.1" className="input" value={form.distancia_metros} onChange={e => setForm({...form, distancia_metros: e.target.value})} required /></div>
                <div><label className="label">Tiempo (segundos)</label><input type="number" step="0.01" className="input" value={form.tiempo_segundos} onChange={e => setForm({...form, tiempo_segundos: e.target.value})} required /></div>
              </>}
              {form.tipo === 'fuerza' && <>
                <div><label className="label">Ejercicio</label><input className="input" placeholder="Ej: Sentadillas, Press de banca..." value={form.ejercicio} onChange={e => setForm({...form, ejercicio: e.target.value})} required /></div>
                <div><label className="label">Repeticiones</label><input type="number" className="input" value={form.repeticiones} onChange={e => setForm({...form, repeticiones: e.target.value})} required /></div>
              </>}
              {form.tipo === 'potencia' && (
                <div><label className="label">Distancia de salto (cm)</label><input type="number" step="0.1" className="input" value={form.distancia_salto_cm} onChange={e => setForm({...form, distancia_salto_cm: e.target.value})} required /></div>
              )}
              {form.tipo === 'resistencia' && <>
                <div><label className="label">Distancia recorrida (metros)</label><input type="number" className="input" value={form.distancia_recorrida_metros} onChange={e => setForm({...form, distancia_recorrida_metros: e.target.value})} required /></div>
                <div><label className="label">Tiempo (minutos)</label><input type="number" step="0.1" className="input" value={form.tiempo_minutos} onChange={e => setForm({...form, tiempo_minutos: e.target.value})} required /></div>
              </>}
              {form.tipo === 'antropometría' && <>
                <div><label className="label">Peso (kg)</label><input type="number" step="0.1" className="input" placeholder="Ej: 65.5" value={form.peso_kg} onChange={e => setForm({...form, peso_kg: e.target.value})} required /></div>
                <div><label className="label">Talla (cm)</label><input type="number" step="0.1" className="input" placeholder="Ej: 172.0" value={form.talla_cm} onChange={e => setForm({...form, talla_cm: e.target.value})} required /></div>
                {imcPreview && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-purple-600 font-medium">IMC calculado automáticamente</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{imcPreview}</p>
                    <p className="text-xs text-purple-500">{clasificarIMC(imcPreview)?.label}</p>
                  </div>
                )}
              </>}
              <div><label className="label">Notas (opcional)</label><textarea className="input h-16 resize-none" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} /></div>
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
