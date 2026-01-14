
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Employee } from '../types';

interface SlotMachineProps {
  candidates: Employee[];
  isSpinning: boolean;
  winner: Employee | null;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ candidates, isSpinning, winner }) => {
  const [displayEmployee, setDisplayEmployee] = useState<Employee | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const idleIntervalRef = useRef<number | null>(null);
  const counterRef = useRef(0);

  const spin = () => {
    if (!isSpinning) return;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    setDisplayEmployee(candidates[randomIndex]);
    counterRef.current++;

    // Tăng delay lên 120ms (thay vì 90ms) để nhân viên kịp đọc tên
    // Vòng quay ADC cần sự chính xác và tin cậy
    let delay = 120;

    const cyclePos = counterRef.current % 20; // Giảm xuống 20 để teasing thường xuyên hơn
    
    if (cyclePos === 0) {
      delay = 1800 + Math.random() * 400; // Tạm dừng lâu hơn để soi "insight"
    } else if (cyclePos > 15) {
      delay = 120 + (cyclePos - 15) * 250;
    }

    timeoutRef.current = window.setTimeout(spin, delay);
  };

  useEffect(() => {
    if (isSpinning && candidates.length > 0) {
      counterRef.current = 0;
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      spin();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (winner) setDisplayEmployee(winner);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isSpinning, candidates, winner]);

  useEffect(() => {
    if (!isSpinning && !winner && candidates.length > 0) {
      if (!displayEmployee) setDisplayEmployee(candidates[0]);
      idleIntervalRef.current = window.setInterval(() => {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        setDisplayEmployee(candidates[randomIndex]);
      }, 4000); // Idle chậm hơn
    }
    return () => { if (idleIntervalRef.current) clearInterval(idleIntervalRef.current); };
  }, [isSpinning, winner, candidates]);

  const cyclePos = counterRef.current % 20;
  const isTeasing = isSpinning && cyclePos === 0;

  return (
    <div className="relative w-full max-w-5xl mx-auto h-72 md:h-[450px] bg-brand-emeraldDark/80 rounded-[48px] border-8 border-brand-yellow/30 overflow-hidden shadow-[0_0_120px_rgba(255,198,47,0.2)] backdrop-blur-3xl flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/5 via-transparent to-brand-yellow/5" />
      
      <AnimatePresence>
        {isTeasing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-yellow pointer-events-none z-0" />
        )}
      </AnimatePresence>

      <div className="relative z-10 text-center px-12 w-full h-full flex flex-col items-center justify-center">
        <AnimatePresence mode='popLayout'>
          {displayEmployee ? (
             <motion.div
               key={displayEmployee.id}
               initial={{ y: 120, opacity: 0, scale: 0.8 }}
               animate={isTeasing ? { 
                 y: 0, scale: 1.15, opacity: 1,
                 transition: { type: 'spring', stiffness: 200, damping: 20 }
               } : { 
                 y: 0, opacity: 1, scale: 1
               }}
               exit={{ y: -120, opacity: 0, scale: 0.8 }}
               transition={{ 
                  duration: isSpinning ? (cyclePos > 12 ? 0.35 : 0.12) : 0.6, 
                  ease: "circOut"
               }}
               className="flex flex-col items-center justify-center w-full"
             >
               <h2 className={`font-display font-black text-5xl md:text-9xl bg-clip-text text-transparent bg-gradient-to-b ${isSpinning ? (isTeasing ? 'from-brand-yellow to-white' : 'from-white to-gray-500') : 'from-brand-yellow via-white to-brand-yellow'} drop-shadow-2xl leading-none`}>
                 {displayEmployee.name}
               </h2>
               <div className="mt-8 space-y-2">
                 <p className="text-2xl md:text-3xl text-teal-200 font-light tracking-widest truncate uppercase">
                    {displayEmployee.email}
                 </p>
                 {displayEmployee.department && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center gap-3 mt-6">
                      <div className="h-px w-12 bg-brand-yellow/50" />
                      <span className="px-10 py-3 rounded-full bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30 font-black uppercase tracking-[0.3em] text-sm shadow-xl">
                        {displayEmployee.department}
                      </span>
                      <div className="h-px w-12 bg-brand-yellow/50" />
                   </motion.div>
                 )}
               </div>
             </motion.div>
          ) : (
            <div className="text-brand-yellow/20 text-4xl font-display animate-pulse uppercase tracking-[0.5em] font-black italic">Syncing Data...</div>
          )}
        </AnimatePresence>
      </div>

      {/* Center Focus Frame */}
      <div className="absolute inset-0 border-[24px] border-brand-emeraldDark/40 pointer-events-none" />
      <div className="absolute top-[15%] left-[10%] right-[10%] bottom-[15%] border-2 border-brand-yellow/20 rounded-[32px] pointer-events-none shadow-inner" />
      
      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-brand-yellow/50 rounded-tl-xl" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-brand-yellow/50 rounded-tr-xl" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-brand-yellow/50 rounded-bl-xl" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-brand-yellow/50 rounded-br-xl" />
    </div>
  );
};

export default SlotMachine;
