import { motion } from 'framer-motion'

export default function Card({
  children,
  title,
  className = '',
  animate = false,
  gradient = false,
  glow = false,
  ...props
}) {
  const base = `relative bg-white/90 backdrop-blur-sm border border-stone-100/80 rounded-2xl p-6 shadow-sm overflow-hidden`

  const hoverShadow = glow
    ? '0 20px 48px -8px rgba(124, 58, 237, 0.18), 0 8px 20px -4px rgba(0,0,0,0.07)'
    : '0 14px 36px -8px rgba(124, 58, 237, 0.10), 0 6px 14px -4px rgba(0,0,0,0.06)'

  const content = (
    <>
      {/* Top gradient accent line */}
      {gradient && (
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.5) 30%, rgba(168,85,247,0.7) 60%, transparent 100%)',
          }}
        />
      )}
      {title && (
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
          {title}
        </h3>
      )}
      {children}
    </>
  )

  if (animate) {
    return (
      <motion.div
        whileHover={{ y: -3, boxShadow: hoverShadow, borderColor: 'rgba(167, 139, 250, 0.3)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        className={`${base} ${glow ? 'border-violet-100' : ''} ${className}`}
        {...props}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div
      className={`${base} card-lifted ${glow ? 'border-violet-100' : ''} ${className}`}
      {...props}
    >
      {content}
    </div>
  )
}
