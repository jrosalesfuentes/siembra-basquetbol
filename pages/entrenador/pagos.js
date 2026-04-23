import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ESTADOS_PAGO = [
  { value: 'pendiente', label: 'Pendiente', color: 'pill-red' },
  { value: 'subido', label: 'Comprobante subido', color: 'pill-yellow' },
  { value: 'verificado', label: 'Verificado', color: 'pill-green' },
  { value: 'rechazado', label: 'Rechazado', color: 'pill-gray' },
]

export default function Pagos() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [comprobante, setComprobante] = useState(null)

  useEffect(() => { cargarDatos() }, [mes, anio])

  const cargarDatos = async () => {
    setLoading(true)
    const { data: als } = await supabase.from('alumnos').select('id, nombre, categoria').eq('activo', true).order('nombre')
    const { data: pags } = await supabase.from('pagos').select('*').eq('mes', mes).eq('anio', anio)
    setAlumnos(als || [])
    setPagos(pags || [])
    setLoading(false)
  }

  const pagoDeAlumno = (alumnoId) => pagos.find(p => p.alumno_id === alumnoId)

  const cambiarEstado = async (alumnoId, nuevoEstado) => {
    const pago = pagoDeAlumno(alumnoId)
    if (pago) {
      await supabase.from('pagos').update({ estado: nuevoEstado }).eq('id', pago.id)
    } else {
      await supabase.from('pagos').insert([{ alumno_id: alumnoId, mes, anio, estado: nuevoEstado }])
    }
    toast.success('Estado actualizado')
    cargarDatos()
  }

  const verComprobante = async (pago) => {
    if (!pago?.comprobante_url) return toast.error('No hay comprobante')
    const { data } = await supabase.storage.from('comprobantes').createSignedUrl(pago.comprobante_url, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const exportarExcel = () => {
    const rows = alumnos.map(a => {
      const pago = pagoDeAlumno(a.id)
      const estado = ESTADOS_PAGO.find(e => e.value === pago?.estado)
      return {
        Nombre: a.nombre,
        Categoría: a.categoria,
        Mes: MESES[mes - 1],
        Año: anio,
        Monto: '$5.000',
        Estado: estado?.label || 'Pendiente',
        'Comprobante': pago?.comprobante_url ? 'Sí' : 'No'
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos')
    XLSX.writeFile(wb, `pagos-${MESES[mes-1]}-${anio}.xlsx`)
    toast.success('Excel exportado')
  }

  const resumen = {
    verificados: alumnos.filter(a => pagoDeAlumno(a.id)?.estado === 'verificado').length,
    subidos: alumnos.filter(a => pagoDeAlumno(a.id)?.estado === 'subido').length,
    pendientes: alumnos.filter(a => !pagoDeAlumno(a.id) || pagoDeAlumno(a.id)?.estado === 'pendiente').length,
  }

  return (
    <Layout rol="entrenador">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">PAGOS</h1>
        <button onClick={exportarExcel} className="btn-secondary text-xs">⬇ Excel</button>
      </div>

      {/* Selector mes */}
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <select className="input max-w-[140px]" value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input max-w-[100px]" value={anio} onChange={e => setAnio(Number(e.target.value))}>
          {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-sm text-gray-500">Mensualidad: <strong>$5.000</strong></span>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center p-3"><p className="text-2xl font-bold text-green-600">{resumen.verificados}</p><p className="text-xs text-gray-400">Verificados</p></div>
        <div className="card text-center p-3"><p className="text-2xl font-bold text-amber-500">{resumen.subidos}</p><p className="text-xs text-gray-400">Por revisar</p></div>
        <div className="card text-center p-3"><p className="text-2xl font-bold text-red-500">{resumen.pendientes}</p><p className="text-xs text-gray-400">Pendientes</p></div>
      </div>

      <div className="card">
        {loading ? <p className="text-center text-gray-400 py-8">Cargando...</p> :
          <div className="space-y-3">
            {alumnos.map(alumno => {
              const pago = pagoDeAlumno(alumno.id)
              const estadoActual = ESTADOS_PAGO.find(e => e.value === (pago?.estado || 'pendiente'))
              return (
                <div key={alumno.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-[#E8F7FF] flex items-center justify-center text-[#1B2A5E] text-xs font-bold flex-shrink-0">
                    {alumno.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{alumno.nombre}</p>
                    <p className="text-xs text-gray-400">{alumno.categoria}</p>
                  </div>
                  <span className={`pill ${estadoActual?.color} hidden sm:block`}>{estadoActual?.label}</span>
                  {pago?.comprobante_url && (
                    <button onClick={() => verComprobante(pago)} className="text-xs text-[#29ABE2] hover:underline">Ver</button>
                  )}
                  <select
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#29ABE2]"
                    value={pago?.estado || 'pendiente'}
                    onChange={e => cambiarEstado(alumno.id, e.target.value)}>
                    {ESTADOS_PAGO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        }
      </div>
    </Layout>
  )
}
