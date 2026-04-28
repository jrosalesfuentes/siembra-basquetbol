import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const navEntrenador = [
  { href: '/entrenador/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/entrenador/alumnos', label: 'Alumnos', icon: '◉' },
  { href: '/entrenador/solicitudes', label: 'Solicitudes', icon: '🔔' },
  { href: '/entrenador/evaluaciones', label: 'Evaluaciones', icon: '◈' },
  { href: '/entrenador/calendario', label: 'Calendario', icon: '▤' },
  { href: '/entrenador/asistencia', label: 'Asistencia', icon: '✓' },
  { href: '/entrenador/pagos', label: 'Pagos', icon: '$' },
  { href: '/entrenador/notificaciones', label: 'Notificaciones', icon: '📣' },
]

const navAlumno = [
  { href: '/alumno/dashboard', label: 'Inicio', icon: '▦' },
  { href: '/alumno/mi-ficha', label: 'Mi ficha', icon: '◉' },
  { href: '/alumno/evaluaciones', label: 'Mis evaluaciones', icon: '◈' },
  { href: '/alumno/calendario', label: 'Calendario', icon: '▤' },
  { href: '/alumno/asistencia', label: 'Mi asistencia', icon: '✓' },
  { href: '/alumno/pagos', label: 'Mis pagos', icon: '$' },
]

export default function Layout({ children, rol = 'entrenador' }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [menuMobile, setMenuMobile] = useState(false)
  const nav = rol === 'entrenador' ? navEntrenador : navAlumno

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      setUsuario(data)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-52 flex-shrink-0 bg-[#1B2A5E] flex-col p-4">
        <div className="text-center mb-5 pb-4 border-b border-white/10">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 mx-auto rounded-full bg-white p-1 mb-2" />
          <p className="text-white text-xs font-semibold">Siembra</p>
          <p className="text-white/50 text-xs">Basketball Buin</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${router.pathname === item.href ? 'active' : ''}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-3 mt-3">
          <p className="text-white/40 text-xs px-3 mb-1 truncate">{usuario?.nombre}</p>
          <button onClick={handleLogout} className="sidebar-nav-item text-red-400 hover:text-red-300">
            <span className="text-base w-5 text-center">⏏</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1B2A5E] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-white p-0.5" />
          <span className="text-white font-semibold text-sm">Siembra BB</span>
        </div>
        <button onClick={() => setMenuMobile(!menuMobile)} className="text-white text-xl">☰</button>
      </div>

      {/* Mobile menu */}
      {menuMobile && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#1B2A5E] pt-16 px-4 flex flex-col">
          <nav className="flex flex-col gap-1">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuMobile(false)}
                className={`sidebar-nav-item text-base py-3 ${router.pathname === item.href ? 'active' : ''}`}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto mb-8 sidebar-nav-item text-red-400 text-base py-3">
            <span className="text-lg w-6 text-center">⏏</span>
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
