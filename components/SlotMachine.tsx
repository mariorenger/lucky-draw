import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Employee } from '../types';
import { SLOT_CONFIG } from '../constants';

interface SlotMachineProps {
  candidates: Employee[];
  isSpinning: boolean;
  winners: Employee[];
  spinCount: number;
  spinDuration: number;
}

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

interface ReelProps {
    candidates: Employee[];
    isSpinning: boolean;
    winner: Employee | null;
    index: number;
    totalReels: number;
    spinDuration: number;
    itemHeight: number;
}

// Component: Cột Quay (Reel)
const Reel: React.FC<ReelProps> = ({ 
    candidates, 
    isSpinning, 
    winner, 
    index,
    totalReels,
    spinDuration,
    itemHeight
}) => {
    const controls = useAnimation();
    const [displayList, setDisplayList] = useState<Employee[]>([]);
    const [teaseIndex, setTeaseIndex] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    
    // Sử dụng Ref để tránh stale closure khi candidates thay đổi
    const candidatesRef = useRef(candidates);
    useEffect(() => {
        candidatesRef.current = candidates;
    }, [candidates]);

    // Sử dụng Ref để lưu winner.id hiện tại nhằm tránh trigger lại nếu trùng lặp
    const activeWinnerIdRef = useRef<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const runAnimation = async () => {
            const currentCandidates = candidatesRef.current;
            if (currentCandidates.length === 0) return;

            // CASE 1: ĐANG QUAY VÀ CÓ WINNER (TIẾN TRÌNH QUAY & DỪNG MƯỢT MÀ)
            if (isSpinning && winner) {
                if (activeWinnerIdRef.current === winner.id) return;
                activeWinnerIdRef.current = winner.id;
                
                controls.stop();
                setTeaseIndex(null);
                setIsFinished(false);

                // Tạo danh sách hiển thị dài để tạo hiệu ứng quay tốc độ cao mượt mà
                const spinItemsCount = Math.max(30, Math.floor(12 * spinDuration));
                const spinItems = Array.from({ length: spinItemsCount }).map(() => 
                    currentCandidates[Math.floor(Math.random() * currentCandidates.length)]
                );
                
                // Chọn một candidate làm tease (mừng hụt)
                const eligibleTease = currentCandidates.filter(c => c.id !== winner.id);
                const teaseUser = eligibleTease.length > 0 
                    ? eligibleTease[Math.floor(Math.random() * eligibleTease.length)]
                    : currentCandidates[Math.floor(Math.random() * currentCandidates.length)];
                
                const gapCount = 5;
                const gapItems = Array.from({ length: gapCount }).map(() => 
                    currentCandidates[Math.floor(Math.random() * currentCandidates.length)]
                );
                
                const tailItems = Array.from({ length: 3 }).map(() => 
                    currentCandidates[Math.floor(Math.random() * currentCandidates.length)]
                );

                const landingList = [...spinItems, teaseUser, ...gapItems, winner, ...tailItems];
                
                if (isCancelled) return;
                setDisplayList(landingList);

                // Khởi tạo y từ 0
                await controls.set({ y: 0 });

                const idxTease = spinItemsCount;
                const idxWinner = spinItemsCount + 1 + gapCount;

                const teaseY = -((idxTease - 1) * itemHeight);
                const winnerY = -((idxWinner - 1) * itemHeight);

                // Giai đoạn 1: Quay liên tục ở tốc độ cao
                const firstPartIndex = Math.floor(spinItemsCount * 0.7);
                const firstPartY = -((firstPartIndex - 1) * itemHeight);
                
                await controls.start({
                    y: firstPartY,
                    transition: {
                        duration: spinDuration * 0.7,
                        ease: "linear"
                    }
                });

                if (isCancelled) return;

                // Giai đoạn 2: Giảm tốc mượt mà về vị trí Tease (Mừng hụt)
                const stopDelay = index * SLOT_CONFIG.REEL_DELAY;
                await controls.start({
                    y: teaseY,
                    transition: {
                        duration: (spinDuration * 0.3) + stopDelay,
                        ease: [0.1, 0.9, 0.2, 1] // Bézier giảm tốc tuyệt đẹp
                    }
                });

                if (isCancelled) return;

                // Highlight ô Mừng hụt
                setTeaseIndex(idxTease);
                await new Promise(resolve => setTimeout(resolve, SLOT_CONFIG.TEASE_PAUSE * 1000));

                if (isCancelled) return;

                // Giai đoạn 3: Trượt mượt mà sang Winner thật
                setTeaseIndex(null);
                await controls.start({
                    y: winnerY,
                    transition: {
                        duration: SLOT_CONFIG.WINNER_MOVE,
                        ease: "easeInOut"
                    }
                });

                if (isCancelled) return;

                // Giai đoạn 4: Hiệu ứng nảy (Bounce)
                const halfBounce = SLOT_CONFIG.BOUNCE / 2;
                await controls.start({
                    y: winnerY + 15, // nhún xuống
                    transition: { duration: halfBounce }
                });
                await controls.start({
                    y: winnerY, // nảy lại
                    transition: { duration: halfBounce, type: "spring", stiffness: 220, damping: 12 }
                });

                if (isCancelled) return;
                setIsFinished(true);
            }

            // CASE 2: ĐANG QUAY NHƯNG CHƯA CÓ WINNER (FALLBACK)
            else if (isSpinning && !winner) {
                activeWinnerIdRef.current = null;
                setTeaseIndex(null);
                setIsFinished(false);
                
                const loopBase = shuffle(currentCandidates).slice(0, 15);
                setDisplayList([...loopBase, ...loopBase, ...loopBase]);
                
                if (isCancelled) return;
                await controls.set({ y: 0 });
                await controls.start({
                    y: [0, -15 * itemHeight],
                    transition: {
                        duration: SLOT_CONFIG.SPIN_SPEED,
                        ease: "linear",
                        repeat: Infinity
                    }
                });
            }

            // CASE 3: TRẠNG THÁI CHỜ THƯ GIÃN (IDLE)
            else {
                activeWinnerIdRef.current = null;
                setTeaseIndex(null);
                setIsFinished(false);

                const loopBase = shuffle(currentCandidates).slice(0, 15);
                setDisplayList([...loopBase, ...loopBase, ...loopBase]);
                
                if (isCancelled) return;
                await controls.set({ y: 0 });
                await controls.start({
                    y: [0, -15 * itemHeight],
                    transition: {
                        duration: 35 + (index * 8),
                        ease: "linear",
                        repeat: Infinity
                    }
                });
            }
        };

        runAnimation();

        return () => {
            isCancelled = true;
            controls.stop();
        };
    }, [isSpinning, winner?.id, spinDuration, itemHeight, index]);

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
                                ${isTease ? 'bg-white/10 animate-pulse' : ''}
                                ${isRealWinner ? 'bg-brand-yellow/20' : ''}
                            `}
                            style={{ height: itemHeight }}
                        >
                            <span className={`font-display font-black text-center leading-tight break-words w-full px-4 transition-all duration-500
                                ${totalReels === 1 ? 'text-4xl md:text-6xl' : totalReels <= 3 ? 'text-2xl md:text-4xl' : totalReels <= 5 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}
                                
                                ${isRealWinner 
                                    ? 'text-[#FFC62F] scale-110 drop-shadow-[0_0_30px_rgba(255,198,47,1)] z-10' 
                                    : isTease 
                                        ? 'text-white scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                                        : 'text-white/40 blur-[0.5px]'}
                            `}>
                                {emp.name}
                            </span>
                            
                            <span className={`mt-2 font-mono text-teal-200 uppercase tracking-widest truncate max-w-full font-bold transition-all duration-500
                                ${totalReels === 1 ? 'text-lg' : totalReels <= 3 ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'}
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

const SlotMachine: React.FC<SlotMachineProps> = ({ 
    candidates, 
    isSpinning, 
    winners, 
    spinCount,
    spinDuration
}) => {
  const [leverState, setLeverState] = useState<'idle' | 'pulled'>('idle');

  useEffect(() => {
    if (isSpinning) {
        setLeverState('pulled');
        setTimeout(() => setLeverState('idle'), 600);
    }
  }, [isSpinning]);

  const getItemHeight = () => {
      if (spinCount === 1) return 160;
      if (spinCount <= 3) return 130;
      if (spinCount <= 5) return 110;
      return 90;
  };
  
  const itemHeight = getItemHeight();

  const getMachineWidth = () => {
      if (spinCount === 1) return 'max-w-xl md:max-w-2xl';
      if (spinCount === 2) return 'max-w-2xl md:max-w-4xl';
      if (spinCount === 3) return 'max-w-3xl md:max-w-6xl';
      return 'max-w-[95vw]';
  };

  return (
    <div className="relative w-full flex justify-center items-center py-6 perspective-[1000px]">
       
       <div className={`relative ${getMachineWidth()} w-full transition-all duration-500`}>
            
            <div className="relative z-10 bg-[#004d4b] rounded-[40px] p-4 md:p-8 border-[8px] border-[#FFC62F] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_0_60px_rgba(0,0,0,0.6)]">
                
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-4 z-20 bg-[#002e2c] px-4 py-1.5 rounded-full border border-[#FFC62F]">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 border-[#FFC62F] ${isSpinning ? 'bg-red-500 animate-pulse' : 'bg-red-800'}`} />
                    ))}
                </div>

                <div className="relative bg-[#001a19] rounded-2xl overflow-hidden border-[3px] border-[#b45309] shadow-inner">
                    <div 
                        className="grid w-full"
                        style={{ 
                            height: itemHeight * VISIBLE_ITEMS, 
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
                                spinDuration={spinDuration}
                                itemHeight={itemHeight}
                            />
                        ))}
                    </div>

                    <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.95)_0%,transparent_25%,transparent_75%,rgba(0,0,0,0.95)_100%)]" />

                    <div 
                        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 pointer-events-none"
                        style={{ height: itemHeight }} 
                    >   
                        <div className="absolute inset-0 border-y-[4px] border-[#FFC62F]/50 shadow-[0_0_20px_rgba(255,198,47,0.3)]"></div>
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-[#FFC62F] drop-shadow-lg text-4xl">►</div>
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-[#FFC62F] drop-shadow-lg text-4xl">◄</div>
                    </div>
                </div>

                <div className="mt-4 flex justify-center opacity-40">
                    <div className="h-1.5 w-1/4 bg-black/40 rounded-full"></div>
                </div>
            </div>

            <div className="absolute top-1/2 -right-16 md:-right-20 -translate-y-1/2 w-[70px] h-[220px] z-0 hidden md:block">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[35px] h-[70px] bg-[#b45309] rounded-r-xl border-y-[2.5px] border-r-[2.5px] border-[#78350f] shadow-lg"></div>
                <div className="absolute top-1/2 left-[15px] -translate-y-1/2 w-[24px] h-[24px] bg-gray-400 rounded-full z-10 border-4 border-gray-600 shadow-sm"></div>
                <motion.div
                    className="absolute top-1/2 left-[27px] w-[14px] h-[150px] origin-[50%_100%] z-0"
                    style={{ marginTop: '-150px' }} 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: leverState === 'pulled' ? 160 : 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 12 }}
                >
                    <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 rounded-t-full shadow-md border border-gray-400"></div>
                    <div className="absolute -top-7 -left-[21px] w-[56px] h-[56px] rounded-full bg-[radial-gradient(circle_at_35%_35%,_#ff4d4d,_#cc0000)] shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_-4px_8px_rgba(0,0,0,0.3)] border-2 border-[#990000]"></div>
                </motion.div>
            </div>
       </div>
    </div>
  );
};

export default SlotMachine;
