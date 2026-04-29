import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PHRASES = [
  'Tu constancia es tu superpoder.',
  'Los hábitos de hoy construyen la vida de mañana.',
  'Cada pequeño paso cuenta. Tú puedes con todo.',
  'El progreso, por pequeño que sea, siempre vale.',
  'Empieza. El resto llegará solo.',
]

export default function BootSequence({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const phrase = useMemo(
    () => PHRASES[Math.floor(Math.random() * PHRASES.length)],
    []
  )

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1300)
    const t3 = setTimeout(() => setPhase(3), 3400)
    const t4 = setTimeout(() => setPhase(4), 4100)
    const t5 = setTimeout(() => onComplete(), 4900)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="fixed inset-0 flex flex-col items-center justify-center z-[100] overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0d0720 0%, #1e0a45 45%, #0c0b28 100%)',
      }}
    >
      {/* Subtle grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Far radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)',
        }}
      />

      <AnimatePresence>
        {/* ── Phase 1: small dot ── */}
        {phase === 1 && (
          <motion.div
            key="dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-3 h-3 rounded-full"
            style={{
              background: '#a855f7',
              boxShadow: '0 0 28px 7px rgba(168,85,247,0.9)',
            }}
          />
        )}

        {/* ── Phase 2: spinning rings + welcome ── */}
        {phase >= 2 && phase < 4 && (
          <motion.div
            key="rings"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.85, ease: 'circOut' }}
            className="relative flex items-center justify-center"
          >
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
              className="absolute w-72 h-72 rounded-full"
              style={{
                border: '1px solid rgba(167,139,250,0.25)',
                boxShadow: '0 0 40px rgba(124,58,237,0.25)',
              }}
            />

            {/* Middle ring — counter */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
              className="absolute w-52 h-52 rounded-full"
              style={{
                borderTop: '2px solid rgba(196,149,252,0.75)',
                borderRight: '2px solid transparent',
                borderBottom: '2px solid rgba(196,149,252,0.35)',
                borderLeft: '2px solid transparent',
                boxShadow: '0 0 25px rgba(168,85,247,0.4)',
              }}
            />

            {/* Inner ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
              className="absolute w-36 h-36 rounded-full"
              style={{
                borderTop: '2px solid rgba(167,139,250,0.9)',
                borderRight: '2px solid transparent',
                borderBottom: '2px solid transparent',
                borderLeft: '2px solid rgba(167,139,250,0.5)',
                boxShadow: '0 0 16px rgba(167,139,250,0.6)',
              }}
            />

            {/* Core glow */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-full"
              style={{
                background: 'radial-gradient(circle, #f3e8ff 0%, #a855f7 60%)',
                boxShadow: '0 0 70px 14px rgba(168,85,247,0.75)',
                filter: 'blur(2px)',
              }}
            />

            {/* Welcome text block — positioned below rings */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="absolute text-center"
              style={{ top: 'calc(50% + 100px)' }}
            >
              <p
                className="text-xs uppercase font-semibold tracking-[0.35em]"
                style={{ color: 'rgba(196,181,253,0.7)' }}
              >
                Bienvenida
              </p>

              <motion.h2
                initial={{ opacity: 0, scale: 0.88, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-5xl font-black mt-1 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #ddd6fe 35%, #a78bfa 75%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Salomé ✨
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.55, duration: 0.7 }}
                className="text-sm mt-3 max-w-xs italic"
                style={{ color: 'rgba(196,181,253,0.68)' }}
              >
                &ldquo;{phrase}&rdquo;
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* ── Phase 3: Flash ── */}
        {phase === 3 && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0, 7, 18] }}
            transition={{ duration: 0.7, ease: 'easeIn' }}
            className="absolute w-44 h-44 rounded-full blur-2xl"
            style={{
              background: 'radial-gradient(circle, #f3e8ff, #a855f7)',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
