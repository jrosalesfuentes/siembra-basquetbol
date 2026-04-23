import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PagosAlumno() {
  const hoy = new Date()
  const [alumno, setAlumno] = useState(null)
  const [pagos, setPagos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const inputRef = useRef()

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: al } = await supabase.from('alumnos').select('*').eq('usuario_id', user.id).single()
    if (!al) return
    setAlumno(al)
    const { data: pags } = await supabase.from('pagos').select('*').eq('alumno_id', al.id).order('anio', { ascending: false }).order('mes', { ascending: false })
    setPagos(pags || [])
  }

  const handleArchivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('El archivo no puede superar 5MB'); return }
    setArchivo(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const subirComprobante = async () => {
    if (!archivo || !alumno) return
    setSubiendo(true)
    try {
      const mes = hoy.getMonth() + 1
      const anio = hoy.getFullYear()
      const ext = archivo.name.split('.').pop()
      const path = `${alumno.id}/${anio}-${mes}.${ext}`
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, archivo, { upsert: true })
      if (uploadError) throw uploadError
      const pagoExistente = pagos.find(p => p.mes === mes && p.anio === anio)
      if (pagoExistente) {
        await supabase.from('pagos').update({ estado: 'subido', comprobante_url: path }).eq('id', pagoExistente.id)
      } else {
        await supabase.from('pagos').insert([{ alumno_id: alumno.id, mes, anio, estado: 'subido', comprobante_url: path }])
      }
      toast.success('Comprobante subido correctamente')
      setArchivo(null)
      setPreview(null)
      cargarDatos()
    } catch (error) {
      toast.error('Error al subir el comprobante')
    } finally {
      setSubiendo(false)
    }
  }

  const estadoColor = { pendiente: 'pill-red', subido: 'pill-yellow', verificado: 'pill-green', rechazado: 'pill-gray' }
  const estadoLabel = { pendiente: 'Pendiente', subido: 'En revisión', verificado: 'Verificado ✓', rechazado: 'Rechazado' }

  const pagoMesActual = pagos.find(p => p.mes === hoy.getMonth() + 1 && p.anio === hoy.getFullYear())

  return (
    <Layout rol="alumno">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1B2A5E] tracking-wide">MIS PAGOS</h1>
        <p className="text-gray-500 text-sm mt-1">Mensualidad: $5.000</p>
      </div>

      {/* Subir comprobante mes actual */}
      <div className="card mb-4">
        <h2 className="font-semibold text-[#1B2A5E] text-sm mb-1">
          {MESES[hoy.getMonth()]} {hoy.getFullYear()}
        </h2>
        {pagoMesActual?.estado === 'verificado' ? (
          <div className="flex items-center gap-2 py-3">
            <span className="text-2xl">✅</span>
            <p className="text-green-600 font-medium text-sm">Pago verificado por el entrenador</p>
          </div>
        ) : pagoMesActual?.estado === 'subido' ? (
          <div className="flex items-center gap-2 py-3">
            <span className="text-2xl">⏳</span>
            <p className="text-amber-600 font-medium text-sm">Comprobante en revisión</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">Sube tu comprobante de transferencia de $5.000</p>
            <div onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#29ABE2] transition-colors mb-3">
              {preview ? (
                <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
              ) : (
                <>
                  <p className="text-3xl mb-2">📎</p>
                  <p className="text-sm text-gray-500">Toca para seleccionar imagen o PDF</p>
                  <p className="text-xs text-gray-400 mt-1">Máximo 5MB</p>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleArchivo} />
            {archivo && (
              <button onClick={subirComprobante} disabled={subiendo}
                className="w-full btn-primary">
                {subiendo ? 'Subiendo...' : 'Enviar comprobante'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Historial */}
      <div className="card">
        <h2 className="font-semibold text-[#1B2A5E] text-sm mb-3">Historial de pagos</h2>
        {pagos.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Sin registros aún</p>
        ) : (
          <div className="space-y-2">
            {pagos.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{MESES[p.mes - 1]} {p.anio}</p>
                  <p className="text-xs text-gray-400">$5.000</p>
                </div>
                <span className={`pill ${estadoColor[p.estado]}`}>{estadoLabel[p.estado]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
