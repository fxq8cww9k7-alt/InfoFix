import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ShieldCheck, Wrench, Smartphone, FileText, CheckCircle2 } from 'lucide-react'

function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header InfoFIX */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6 mb-8">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
          <Wrench className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">InfoFIX</h1>
            <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              v0.1.0 • Base
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sistema de Trazabilidad, Seguimiento y Certificación de Reparaciones (CUCEI)
          </p>
        </div>
      </div>

      {/* Grid de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>API BACKEND</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Proxy :3000
            </span>
          </div>
          <div className="text-xl font-bold text-slate-200">Express + SQLite</div>
          <p className="text-[11px] text-slate-500 mt-1">11/11 tests de integración pasando</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>SEGURIDAD</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-200">JWT + UUID v4</div>
          <p className="text-[11px] text-slate-500 mt-1">Sesiones 8h y consulta pública con QR</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>FRONTEND (T06)</span>
            <Smartphone className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-200">React + Vite</div>
          <p className="text-[11px] text-slate-500 mt-1">Tailwind CSS v4 + React Router</p>
        </div>
      </div>

      {/* Mapeo de Rutas Clave */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 font-mono">
          Rutas Principales del Sistema
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-medium text-slate-200">Acceso Personal (P1-P3)</div>
                <div className="text-xs text-slate-500">Login, registro con código y recuperación</div>
              </div>
            </div>
            <code className="text-xs bg-slate-800/50 px-2.5 py-1 rounded text-cyan-300 font-mono">/login</code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-200">Portal Público del Cliente (P15)</div>
                <div className="text-xs text-slate-500">Avance de reparación vía QR (sin sesión)</div>
              </div>
            </div>
            <code className="text-xs bg-slate-800/50 px-2.5 py-1 rounded text-cyan-300 font-mono">/estatus/:token</code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-medium text-slate-200">Verificación de Certificado (P23)</div>
                <div className="text-xs text-slate-500">Validación pública de garantía legal</div>
              </div>
            </div>
            <code className="text-xs bg-slate-800/50 px-2.5 py-1 rounded text-cyan-300 font-mono">/verificar/:token</code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  )
}
