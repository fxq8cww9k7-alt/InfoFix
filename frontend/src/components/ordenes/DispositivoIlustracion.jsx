export default function DispositivoIlustracion({ esAntes = true, className = 'w-full h-full' }) {
  return (
    <svg
      viewBox="0 0 100 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chasis exterior del equipo */}
      <rect x="12" y="8" width="76" height="144" rx="16" fill="#1E293B" stroke="#334155" strokeWidth="2" />
      
      {/* Pantalla */}
      <rect x="17" y="18" width="66" height="124" rx="10" fill="#0F172A" />
      
      {/* Auricular superior / Isla dinámica */}
      <rect x="42" y="12" width="16" height="2.5" rx="1.25" fill="#475569" />

      {esAntes ? (
        /* Grietas de impacto para evidencias ANTES */
        <g stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <path d="M50 80 L35 95 L25 90" />
          <path d="M50 80 L65 92 L75 85" />
          <path d="M50 80 L48 60 L36 52" />
          <path d="M50 80 L56 62 L68 55" />
          <path d="M50 80 L52 105 L60 118" />
          <path d="M35 95 L32 112" />
          <path d="M65 92 L62 110" />
        </g>
      ) : (
        /* Indicador de equipo reparado / funcional para evidencias DESPUÉS */
        <g>
          <circle cx="50" cy="80" r="13" fill="#0284C7" />
          <path
            d="M45 80 L48.5 83.5 L55 76"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
