import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase, calcularCategoria, formatearRut } from '../../lib/supabase'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const CATEGORIAS = ['U13', 'U14', 'U15', 'U17', 'U18', 'U19', 'Adulto']

const FORM_INICIAL = {
  nombre: '', rut: '', fecha_nacimiento: '', enfermedades: '',
  contacto_emergencia_nombre: '', contacto_emergencia_telefono: ''
}

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarAlumnos() }, [])

  const cargarAlumnos = async () => {
    const { data } = await supabase.from('alumnos').select('*').order('nombre')
    setAlumnos(data || [])
    setLoading(false)
  }

  const alumnosFiltrados = alumnos.filter(a => {
    const coincideCategoria = filtro === 'Todos' || a.categoria === filtro
    const coincideBusqueda = a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.rut.includes(busqueda)
    return coincideCategoria && coincideBusqueda
  })

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const categoria = calcularCategoria(form.fecha_nacimiento)
      const datos = { ...form, categoria, rut: formatearRut(form.rut) }
      if (editando) {
        const { error } = await supabase.from('alumnos').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', editando)
        if (error) throw error
        toast.success('Alumno actualizado')
      } else {
        const { error } = await supabase.from('alumnos').insert([datos])
        if (error) throw error
        toast.success('Alumno registrado')
      }
      setModal(false)
      setForm(FORM_INICIAL)
      setEditando(null)
      cargarAlumnos()
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = (alumno) => {
    setForm({
      nombre: alumno.nombre, rut: alumno.rut,
      fecha_nacimiento: alumno.fecha_nacimiento,
      enfermedades: alumno.enfermedades || '',
      contacto_emergencia_nombre: alumno.contacto_emergencia_nombre,
      contacto_emergencia_telefono: alumno.contacto_emergencia_telefono
    })
    setEditando(alumno.id)
    setModal(true)
    setModalDetalle(null)
  }

  const exportarExcel = async (alumno = null) => {
    const datos = alumno ? [alumno] : alumnosFiltrados
    const rows = datos.map(a => ({
      Nombre: a.nombre, RUT: a.rut,
      'Fecha nacimiento': a.fecha_nacimiento,
      Categoría: a.categoria,
      'Enfermedades/condiciones': a.enfermedades || 'Ninguna',
      'Contacto emergencia': a.contacto_emergencia_nombre,
      'Teléfono emergencia': a.contacto_emergencia_telefono,
      Estado: a.activo ? 'Activo' : 'Inactivo'
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos')
    XLSX.writeFile(wb, `alumnos-siembra-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel exportado')
  }

  const colorCategoria = (cat) => {
    const map = { U13: 'pill-blue', U14: 'pill-blue', U15: 'pill-green', U17: 'pill-green', U18: 'pill-yellow', U19: 'pill-yellow', Adulto: 'pill-gray' }
    return map[cat] || 'pill-gray'
  }

  return (
    <Layout rol="entrenador">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">ALUMNOS</h1>
        <div className="flex gap-2">
          <button onClick={() => exportarExcel()} className="btn-secondary text-xs">⬇ Excel</button>
          <button onClick={() => { setForm(FORM_INICIAL); setEditando(null); setModal(true) }} className="btn-primary">+ Nuevo</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['Todos', ...CATEGORIAS].map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filtro === cat ? 'bg-[#1B2A5E] text-white border-[#1B2A5E]' : 'border-gray-200 text-gray-600 hover:border-[#29ABE2]'}`}>
            {cat}
          </button>
        ))}
      </div>

      <input className="input mb-4" placeholder="Buscar por nombre o RUT..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      <div className="card">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando...</p>
        ) : alumnosFiltrados.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay alumnos</p>
        ) : (
          <div className="space-y-3">
            {alumnosFiltrados.map(alumno => (
              <div key={alumno.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#E8F7FF] flex items-center justify-content-center flex items-center justify-center text-[#1B2A5E] text-xs font-bold flex-shrink-0">
                  {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{alumno.nombre}</p>
                  <p className="text-xs text-gray-400">{alumno.rut} · {alumno.enfermedades ? `⚠️ ${alumno.enfermedades}` : 'Sin condiciones'}</p>
                </div>
                <span className={`pill ${colorCategoria(alumno.categoria)} hidden sm:block`}>{alumno.categoria}</span>
                <button onClick={() => setModalDetalle(alumno)} className="text-xs text-[#29ABE2] hover:underline">Ver</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo/editar alumno */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-4">{editando ? 'Editar alumno' : 'Nuevo alumno'}</h2>
            <form onSubmit={handleGuardar} className="space-y-3">
              <div><label className="label">Nombre completo</label><input className="input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required /></div>
              <div><label className="label">RUT</label><input className="input" placeholder="12.345.678-9" value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} required /></div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input type="date" className="input" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} required />
                {form.fecha_nacimiento && <p className="text-xs text-[#29ABE2] mt-1">Categoría: {calcularCategoria(form.fecha_nacimiento)}</p>}
              </div>
              <div><label className="label">Enfermedades o condiciones de salud</label><textarea className="input h-16 resize-none" value={form.enfermedades} onChange={e => setForm({...form, enfermedades: e.target.value})} placeholder="Ninguna" /></div>
              <div><label className="label">Nombre contacto de emergencia</label><input className="input" value={form.contacto_emergencia_nombre} onChange={e => setForm({...form, contacto_emergencia_nombre: e.target.value})} required /></div>
              <div><label className="label">Teléfono contacto de emergencia</label><input className="input" type="tel" value={form.contacto_emergencia_telefono} onChange={e => setForm({...form, contacto_emergencia_telefono: e.target.value})} required /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 btn-primary">{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle alumno */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#E8F7FF] flex items-center justify-center text-[#1B2A5E] font-bold">
                {modalDetalle.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-[#1B2A5E]">{modalDetalle.nombre}</h2>
                <span className={`pill ${colorCategoria(modalDetalle.categoria)}`}>{modalDetalle.categoria}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">RUT</span><span className="font-medium">{modalDetalle.rut}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Nacimiento</span><span className="font-medium">{new Date(modalDetalle.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-CL')}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Condiciones</span><span className="font-medium text-right max-w-[60%]">{modalDetalle.enfermedades || 'Ninguna'}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Emergencia</span><span className="font-medium">{modalDetalle.contacto_emergencia_nombre}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Teléfono</span><span className="font-medium">{modalDetalle.contacto_emergencia_telefono}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => exportarExcel(modalDetalle)} className="flex-1 btn-secondary text-xs">⬇ Excel</button>
              <button onClick={() => handleEditar(modalDetalle)} className="flex-1 btn-primary text-xs">Editar</button>
              <button onClick={() => setModalDetalle(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-xs hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
