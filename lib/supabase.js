import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function calcularCategoria(fechaNacimiento) {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  const edad = hoy.getFullYear() - nacimiento.getFullYear()
  const cumpleEsteAno = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate())
  const edadActual = hoy < cumpleEsteAno ? edad - 1 : edad

  if (edadActual <= 13) return 'U13'
  if (edadActual === 14) return 'U14'
  if (edadActual === 15) return 'U15'
  if (edadActual <= 17) return 'U17'
  if (edadActual === 18) return 'U18'
  if (edadActual === 19) return 'U19'
  return 'Adulto'
}

export function formatearRut(rut) {
  const rutLimpio = rut.replace(/[^0-9kK]/g, '')
  if (rutLimpio.length < 2) return rutLimpio
  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toUpperCase()
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpoFormateado}-${dv}`
}
