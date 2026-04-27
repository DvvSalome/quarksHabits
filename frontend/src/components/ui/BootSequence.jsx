import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BootSequence({ onComplete }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Phase 0: Just black (0s to 0.5s)
    const t1 = setTimeout(() => setPhase(1), 500)
    
    // Phase 1: Small dot appears and pulses (0.5s to 1.5s)
    const t2 = setTimeout(() => setPhase(2), 1500)
    
    // Phase 2: Dot expands into spinning rings (1.5s to 3s)
    const t3 = setTimeout(() => setPhase(3), 3000)

    // Phase 3: Flash of light / explosion (3s to 3.5s)
    const t4 = setTimeout(() => setPhase(4), 3800)

    // Phase 4: Done
    const t5 = setTimeout(() => onComplete(), 4500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100] overflow-hidden">
      <AnimatePresence>
        {/* Phase 1: Small Dot */}
        {phase === 1 && (
          <motion.div
            key="dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_20px_5px_rgba(6,182,212,0.8)]"
          />
        )}

        {/* Phase 2: Expanding Rings */}
        {phase >= 2 && phase < 4 && (
          <motion.div
            key="rings"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute w-64 h-64 border-t-2 border-r-2 border-cyan-500/50 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            />
            {/* Middle Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute w-48 h-48 border-b-2 border-l-2 border-cyan-400/80 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]"
            />
            {/* Inner Core */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-16 h-16 bg-cyan-300 rounded-full shadow-[0_0_50px_10px_rgba(6,182,212,1)] blur-[2px]"
            />
            
            {/* Text that fades in */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-40 text-cyan-300 font-mono tracking-[0.5em] text-sm uppercase glow-text whitespace-nowrap"
            >
              System Online
            </motion.div>
          </motion.div>
        )}

        {/* Phase 3: Flash Explosion */}
        {phase === 3 && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 10, 20] }}
            transition={{ duration: 0.8, ease: "easeIn" }}
            className="absolute w-32 h-32 bg-cyan-100 rounded-full mix-blend-screen blur-xl"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
