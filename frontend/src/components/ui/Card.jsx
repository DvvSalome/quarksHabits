export default function Card({ children, title, className = '', ...props }) {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden group ${className}`}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-400/50 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      {title && (
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-[0.15em] mb-4 glow-text flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          {title}
        </h3>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
