
import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Employee } from '../types';
import { SLOT_CONFIG } from '../constants';

interface SlotMachineProps {
  candidates: Employee[];
  isSpinning: boolean;
  winners: Employee[];
  spinCount: number;
}

// Chiều cao ô chữ
const ITEM_HEIGHT = 220; 
// Số ô hiển thị (Luôn là số lẻ để có tâm điểm)
const VISIBLE_ITEMS = 3; 

// Helper: Trộn mảng
const shuffle = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Component: Cột Quay (Reel)
const Reel = ({ 
    candidates, 
    isSpinning, 
    winner, 
    index,
    totalReels 
}: { 
    candidates: Employee[], 
    isSpinning: boolean, 
    winner: Employee | null, 
    index: number,
    totalReels: number
}) => {
    const controls = useAnimation();
    const [displayList, setDisplayList] = useState<Employee[]>([]);
    
    // State highlight người "Mừng hụt"
    const [teaseIndex, setTeaseIndex] = useState<number | null>(null);
    // State xác nhận đã dừng hẳn tại Winner thật
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (candidates.length === 0) return;
        setDisplayList(shuffle(candidates).slice(0, 30));
    }, [candidates]);

    useEffect(() => {
        const runAnimation = async () => {
            // CASE 1: TRẠNG THÁI DỪNG & CÓ KẾT QUẢ (WINNER)
            if (winner) {
                controls.stop();
                setTeaseIndex(null);
                setIsFinished(false);
                
                // --- CẤU TRÚC DANH SÁCH DỪNG ---
                const stopDelay = index * SLOT_CONFIG.REEL_DELAY; // Delay biến động theo cấu hình
                
                // 1. Buffer đầu
                const bufferCount = 12;
                const bufferList = Array.from({ length: bufferCount }).map(() => 
                    candidates[Math.floor(Math.random() * candidates.length)]
                );

                // 2. Người "Mừng hụt" (Tease)
                const teaseUser = candidates[Math.floor(Math.random() * candidates.length)];
                
                // 3. Khoảng cách (Gap) từ Tease đến Winner
                const gapCount = 6; 
                const gapList = Array.from({ length: gapCount }).map(() => 
                    candidates[Math.floor(Math.random() * candidates.length)]
                );
                
                // 4. Các ô đệm cuối cùng
                const tailList = Array.from({ length: 3 }).map(() => 
                    candidates[Math.floor(Math.random() * candidates.length)]
                );

                const landingList = [...bufferList, teaseUser, ...gapList, winner, ...tailList];
                setDisplayList(landingList);

                // Reset vị trí về 0 
                await controls.set({ y: 0 });

                // Tính toán tọa độ Y
                const idxTease = bufferList.length; 
                const idxWinner = landingList.indexOf(winner);

                const teaseY = -((idxTease - 1) * ITEM_HEIGHT);
                const winnerY = -((idxWinner - 1) * ITEM_HEIGHT);

                // BƯỚC 1: Giảm tốc và dừng tại Tease User (Sử dụng biến DECEL_DURATION)
                await controls.start({
                    y: teaseY,
                    transition: {
                        duration: SLOT_CONFIG.DECEL_DURATION + stopDelay, 
                        ease: [0.1, 0.9, 0.2, 1] 
                    }
                });

                // Highlight Tease
                setTeaseIndex(idxTease);
                await new Promise(resolve => setTimeout(resolve, SLOT_CONFIG.TEASE_PAUSE * 1000)); // Dừng theo cấu hình

                // BƯỚC 2: Bỏ Highlight & Trượt tiếp đến Winner thật (Sử dụng biến WINNER_MOVE)
                setTeaseIndex(null);
                await controls.start({
                    y: winnerY,
                    transition: {
                        duration: SLOT_CONFIG.WINNER_MOVE, 
                        ease: "easeInOut"
                    }
                });
                
                // BƯỚC 3: Hiệu ứng Bounce (Nảy) tại đích (Sử dụng biến BOUNCE)
                // Chia nhỏ thời gian Bounce làm 2 giai đoạn (xuống và lên)
                const halfBounce = SLOT_CONFIG.BOUNCE / 2;
                await controls.start({
                    y: winnerY + 20, 
                    transition: { duration: halfBounce }
                });
                await controls.start({
                    y: winnerY, 
                    transition: { duration: halfBounce, type: "spring", stiffness: 200, damping: 10 }
                });

                // KẾT THÚC: Đánh dấu đã xong để bật sáng Winner
                setIsFinished(true);
                return; 
            }
            
            // CASE 2: TRẠNG THÁI QUAY (SPINNING)
            else if (isSpinning) {
                setTeaseIndex(null);
                setIsFinished(false);
                
                const loopBase = shuffle(candidates).slice(0, 15);
                setDisplayList([...loopBase, ...loopBase, ...loopBase]);
                
                await controls.start({
                    y: [0, -15 * ITEM_HEIGHT],
                    transition: {
                        duration: SLOT_CONFIG.SPIN_SPEED, // Sử dụng biến
                        ease: "linear",
                        repeat: Infinity
                    }
                });
            } 

            // CASE 3: TRẠNG THÁI CHỜ (IDLE) 
            else if (!winner && !isSpinning && candidates.length > 5) {
                setTeaseIndex(null);
                setIsFinished(false);
                
                const loopBase = shuffle(candidates).slice(0, 15);
                setDisplayList([...loopBase, ...loopBase, ...loopBase]);
                
                await controls.start({
                    y: [0, -15 * ITEM_HEIGHT],
                    transition: {
                        duration: 40 + (index * 5),
                        ease: "linear",
                        repeat: Infinity
                    }
                });
            }
        };

        runAnimation();
    }, [isSpinning, winner, candidates, controls, index]);

    return (
        <div className="relative h-full overflow-hidden bg-[#002e2c] border-r border-brand-yellow/20 last:border-r-0">
            <motion.div 
                animate={controls}
                className="flex flex-col items-center w-full"
            >
                {displayList.map((emp, i) => {
                    const isTease = i === teaseIndex;
                    const isRealWinner = isFinished && emp.id === winner?.id;
                    
                    return (
                        <div 
                            key={`${emp.id}-${i}`} 
                            className={`w-full flex flex-col items-center justify-center relative px-2 transition-all duration-500 border-b border-white/5
                                ${isTease ? 'bg-white/10' : ''}
                                ${isRealWinner ? 'bg-brand-yellow/20' : ''}
                            `}
                            style={{ height: ITEM_HEIGHT }}
                        >
                            <span className={`font-display font-black text-center leading-tight break-words w-full px-4 transition-all duration-500
                                ${totalReels === 1 ? 'text-7xl md:text-8xl' : totalReels <= 3 ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}
                                
                                ${isRealWinner 
                                    ? 'text-[#FFC62F] scale-110 drop-shadow-[0_0_30px_rgba(255,198,47,1)] z-10' 
                                    : isTease 
                                        ? 'text-white scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                                        : 'text-white/40 blur-[0.5px]'}
                            `}>
                                {emp.name}
                            </span>
                            
                            <span className={`mt-3 font-mono text-teal-200 uppercase tracking-widest truncate max-w-full font-bold transition-all duration-500
                                ${totalReels === 1 ? 'text-2xl' : 'text-base'}
                                ${isRealWinner ? 'text-[#FFC62F] opacity-100' : 'opacity-40'}
                            `}>
                                {emp.department || emp.email.split('@')[0]}
                            </span>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};

const SlotMachine: React.FC<SlotMachineProps> = ({ candidates, isSpinning, winners, spinCount }) => {
  const [leverState, setLeverState] = useState<'idle' | 'pulled'>('idle');

  useEffect(() => {
    if (isSpinning) {
        setLeverState('pulled');
        setTimeout(() => setLeverState('idle'), 600);
    }
  }, [isSpinning]);

  const getMachineWidth = () => {
      if (spinCount === 1) return 'max-w-3xl';
      if (spinCount === 2) return 'max-w-5xl';
      if (spinCount === 3) return 'max-w-7xl';
      return 'max-w-[90vw]';
  };

  return (
    <div className="relative w-full flex justify-center items-center py-10 perspective-[1000px]">
       
       <div className={`relative ${getMachineWidth()} w-full transition-all duration-500`}>
            
            <div className="relative z-10 bg-[#004d4b] rounded-[40px] p-6 md:p-10 border-[10px] border-[#FFC62F] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(0,0,0,0.6)]">
                
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-6 z-20 bg-[#002e2c] px-6 py-2 rounded-full border border-[#FFC62F]">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 border-[#FFC62F] ${isSpinning ? 'bg-red-500 animate-pulse' : 'bg-red-800'}`} />
                    ))}
                </div>

                <div className="relative bg-[#001a19] rounded-2xl overflow-hidden border-[3px] border-[#b45309] shadow-inner">
                    <div 
                        className="grid w-full"
                        style={{ 
                            height: ITEM_HEIGHT * VISIBLE_ITEMS, 
                            gridTemplateColumns: `repeat(${spinCount}, minmax(0, 1fr))` 
                        }}
                    >
                        {Array.from({ length: spinCount }).map((_, i) => (
                            <Reel 
                                key={i}
                                index={i}
                                candidates={candidates}
                                isSpinning={isSpinning}
                                winner={winners.length > i ? winners[i] : null}
                                totalReels={spinCount}
                            />
                        ))}
                    </div>

                    <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.9)_0%,transparent_30%,transparent_70%,rgba(0,0,0,0.9)_100%)]" />

                    <div 
                        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 pointer-events-none"
                        style={{ height: ITEM_HEIGHT }} 
                    >   
                        <div className="absolute inset-0 border-y-[4px] border-[#FFC62F]/50 shadow-[0_0_20px_rgba(255,198,47,0.2)]"></div>
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-[#FFC62F] drop-shadow-lg text-5xl">►</div>
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-[#FFC62F] drop-shadow-lg text-5xl">◄</div>
                    </div>
                </div>

                <div className="mt-6 flex justify-center opacity-50">
                    <div className="h-2 w-1/3 bg-black/40 rounded-full"></div>
                </div>
            </div>

            <div className="absolute top-1/2 -right-16 md:-right-24 -translate-y-1/2 w-[80px] h-[250px] z-0 hidden md:block">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[40px] h-[80px] bg-[#b45309] rounded-r-xl border-y-[3px] border-r-[3px] border-[#78350f] shadow-xl"></div>
                <div className="absolute top-1/2 left-[20px] -translate-y-1/2 w-[30px] h-[30px] bg-gray-400 rounded-full z-10 border-4 border-gray-600 shadow-md"></div>
                <motion.div
                    className="absolute top-1/2 left-[35px] w-[18px] h-[180px] origin-[50%_100%] z-0"
                    style={{ marginTop: '-180px' }} 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: leverState === 'pulled' ? 160 : 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 12 }}
                >
                    <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 rounded-t-full shadow-lg border border-gray-400"></div>
                    <div className="absolute -top-8 -left-[26px] w-[70px] h-[70px] rounded-full bg-[radial-gradient(circle_at_35%_35%,_#ff4d4d,_#cc0000)] shadow-[0_5px_10px_rgba(0,0,0,0.4),inset_0_-5px_10px_rgba(0,0,0,0.3)] border-2 border-[#990000]"></div>
                </motion.div>
            </div>
       </div>
    </div>
  );
};

export default SlotMachine;
