import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Employee } from '../types';
import { SLOT_CONFIG } from '../constants';

interface SlotMachineProps {
  candidates: Employee[];
  isSpinning: boolean;
  winners: Employee[];
  spinCount: number;
  spinDuration: number;
  enableTease?: boolean;
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
    enableTease?: boolean;
}

// Component: Cột Quay (Reel)
const Reel: React.FC<ReelProps> = ({ 
    candidates, 
    isSpinning, 
    winner, 
    index,
    totalReels,
    spinDuration,
    itemHeight,
    enableTease = false
}) => {
    const controls = useAnimation();
    const [displayList, setDisplayList] = useState<Employee[]>([]);
    const [teaseIndex, setTeaseIndex] = useState<number | null>(null);
    const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
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
                setWinnerIndex(null);
                setIsFinished(false);

                // Tạo danh sách hiển thị với số lượng tối ưu để quay tốc độ vừa phải, dễ nhìn rõ tên
                const spinItemsCount = Math.max(25, Math.floor(6 * spinDuration));
                const spinItems = Array.from({ length: spinItemsCount }).map(() => 
                    currentCandidates[Math.floor(Math.random() * currentCandidates.length)]
                );
                
                const tailItems = Array.from({ length: 3 }).map(() => {
                    const pool = currentCandidates.filter(c => c.id !== winner.id);
                    const selectedPool = pool.length > 0 ? pool : currentCandidates;
                    return selectedPool[Math.floor(Math.random() * selectedPool.length)];
                });

                if (enableTease) {
                    // CHẾ ĐỘ MỪNG HỤT (Dừng giả lập trước khi chốt)
                    const eligibleTease = currentCandidates.filter(c => c.id !== winner.id);
                    const teaseUser = eligibleTease.length > 0 
                        ? eligibleTease[Math.floor(Math.random() * eligibleTease.length)]
                        : currentCandidates[Math.floor(Math.random() * currentCandidates.length)];
                    
                    const gapCount = 5;
                    const gapItems = Array.from({ length: gapCount }).map(() => {
                        const pool = currentCandidates.filter(c => c.id !== winner.id);
                        const selectedPool = pool.length > 0 ? pool : currentCandidates;
                        return selectedPool[Math.floor(Math.random() * selectedPool.length)];
                    });

                    const landingList = [...spinItems, teaseUser, ...gapItems, winner, ...tailItems];
                    
                    if (isCancelled) return;
                    setDisplayList(landingList);

                    await controls.set({ y: 0 });

                    const idxTease = spinItemsCount;
                    const idxWinner = spinItemsCount + 1 + gapCount;
                    setWinnerIndex(idxWinner);

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
                            ease: [0.1, 0.9, 0.2, 1]
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
                        y: winnerY + 15,
                        transition: { duration: halfBounce }
                    });
                    await controls.start({
                        y: winnerY,
                        transition: { duration: halfBounce, type: "spring", stiffness: 220, damping: 12 }
                    });

                    if (isCancelled) return;
                    setIsFinished(true);
                } else {
                    // CHẾ ĐỘ QUAY TRỰC TIẾP (MẶC ĐỊNH - Quay mượt thẳng ra người trúng)
                    const landingList = [...spinItems, winner, ...tailItems];
                    
                    if (isCancelled) return;
                    setDisplayList(landingList);

                    await controls.set({ y: 0 });

                    const idxWinner = spinItemsCount;
                    setWinnerIndex(idxWinner);

                    const winnerY = -((idxWinner - 1) * itemHeight);
                    const stopDelay = index * SLOT_CONFIG.REEL_DELAY;
                    const totalDuration = spinDuration + stopDelay;

                    await controls.start({
                        y: winnerY,
                        transition: {
                            duration: totalDuration,
                            ease: [0.1, 0.85, 0.15, 1] // Bézier giảm tốc tuyệt đẹp thẳng tới người trúng
                        }
                    });

                    if (isCancelled) return;

                    // Hiệu ứng nảy (Bounce) khi dừng lại ở Winner
                    const halfBounce = SLOT_CONFIG.BOUNCE / 2;
                    await controls.start({
                        y: winnerY + 15,
                        transition: { duration: halfBounce }
                    });
                    await controls.start({
                        y: winnerY,
                        transition: { duration: halfBounce, type: "spring", stiffness: 220, damping: 12 }
                    });

                    if (isCancelled) return;
                    setIsFinished(true);
                }
            }

            // CASE 2: ĐANG QUAY NHƯNG CHƯA CÓ WINNER (FALLBACK)
            else if (isSpinning && !winner) {
                activeWinnerIdRef.current = null;
                setTeaseIndex(null);
                setWinnerIndex(null);
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
                setWinnerIndex(null);
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
    }, [isSpinning, winner?.id, spinDuration, itemHeight, index, enableTease, candidates.length]);

    return (
        <div className="relative h-full overflow-hidden bg-gradient-to-b from-[#001d1b] via-[#002a28] to-[#001413] border-r-2 border-amber-500/30 last:border-r-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <motion.div 
                animate={controls}
                className="flex flex-col items-center w-full"
            >
                {displayList.map((emp, i) => {
                    const isTease = i === teaseIndex;
                    const isRealWinner = isFinished && i === winnerIndex;
                    
                    return (
                        <div 
                            key={`${emp.id}-${i}`} 
                            className={`w-full flex flex-col items-center justify-center relative px-3 transition-all duration-300 border-b border-white/5
                                ${isTease ? 'bg-amber-400/20 animate-pulse' : ''}
                                ${isRealWinner 
                                    ? 'bg-gradient-to-r from-[#00302c] via-[#005a54] to-[#00302c] border-2 border-[#FFE885] ring-4 ring-amber-400/50 shadow-[0_0_60px_rgba(255,215,0,0.9),inset_0_0_30px_rgba(255,235,120,0.5)] rounded-2xl my-1 py-2 z-30 scale-105' 
                                    : ''}
                            `}
                            style={{ height: itemHeight - (isRealWinner ? 8 : 0) }}
                        >
                            {/* Radial Light Aura radiating outward for Winner (Behind container) */}
                            {isRealWinner && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden rounded-2xl">
                                    <div className="w-[120%] h-[140%] bg-[radial-gradient(ellipse_at_center,_rgba(255,215,0,0.25)_0%,_rgba(0,40,36,0.8)_70%,_transparent_100%)] animate-pulse" />
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-2 w-full px-2 relative z-20">
                                {isRealWinner && <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-amber-300 animate-spin flex-shrink-0 drop-shadow-[0_0_8px_rgba(255,215,0,1)]" />}
                                <span 
                                    className={`font-display font-black text-center leading-tight break-words transition-all duration-300 tracking-wider
                                        ${totalReels === 1 ? 'text-4xl md:text-6xl' : totalReels <= 3 ? 'text-2xl md:text-4xl' : totalReels <= 5 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}
                                        
                                        ${isRealWinner 
                                            ? 'text-[#FFE875] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)] scale-110' 
                                            : isTease 
                                                ? 'text-yellow-200 scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                                : 'text-white/45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'}
                                    `}
                                    style={isRealWinner ? {
                                        textShadow: '0 0 10px rgba(255, 220, 80, 0.7), 0 2px 5px rgba(0, 0, 0, 0.9)'
                                    } : undefined}
                                >
                                    {emp.name}
                                </span>
                                {isRealWinner && <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-amber-300 animate-spin flex-shrink-0 drop-shadow-[0_0_8px_rgba(255,215,0,1)]" />}
                            </div>
                            
                            <span className={`mt-1 font-mono uppercase tracking-widest truncate max-w-full font-bold transition-all duration-300 px-3.5 py-0.5 rounded-full relative z-20
                                ${totalReels === 1 ? 'text-base' : totalReels <= 3 ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'}
                                ${isRealWinner 
                                    ? 'text-yellow-100 font-black bg-gradient-to-r from-amber-600/80 via-yellow-500/70 to-amber-600/80 border border-yellow-200 shadow-[0_0_20px_rgba(255,215,0,0.9)] opacity-100' 
                                    : 'text-teal-200/60 bg-black/30 opacity-50'}
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
    spinDuration,
    enableTease = false
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
    <div className="relative w-full flex justify-center items-center py-6 perspective-[1200px]">
       
       <div className={`relative ${getMachineWidth()} w-full transition-all duration-500`}>
            
            {/* Outer Metallic Golden Bezel Container */}
            <div className="relative z-10 p-2 md:p-3 rounded-[44px] bg-gradient-to-b from-[#FFEFA6] via-[#FFC62F] via-[#B88100] to-[#593d00] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(255,198,47,0.35),inset_0_2px_6px_rgba(255,255,255,0.8)] border-2 border-yellow-200">
                
                {/* Inner Emerald Metallic Chassis */}
                <div className="relative bg-gradient-to-b from-[#004845] via-[#002e2c] to-[#001716] rounded-[36px] p-4 md:p-7 border-4 border-[#855B00] shadow-[inset_0_0_40px_rgba(0,0,0,0.9),0_10px_20px_rgba(0,0,0,0.5)]">
                    
                    {/* Top Marquee Crown Lights */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-gradient-to-r from-[#002220] via-[#003835] to-[#002220] px-6 py-1.5 rounded-full border-2 border-[#FFC62F] shadow-[0_6px_15px_rgba(0,0,0,0.7),0_0_20px_rgba(255,198,47,0.4)]">
                        {Array.from({length: 5}).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3.5 h-3.5 rounded-full border border-yellow-200 transition-all duration-300 ${
                                isSpinning 
                                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-ping' 
                                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                              }`} 
                            />
                        ))}
                    </div>

                    {/* Outer Bezel Corner Rivets */}
                    <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-100 to-amber-700 border border-black/40 shadow-sm" />
                    <div className="absolute top-3 right-4 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-100 to-amber-700 border border-black/40 shadow-sm" />
                    <div className="absolute bottom-3 left-4 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-100 to-amber-700 border border-black/40 shadow-sm" />
                    <div className="absolute bottom-3 right-4 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-100 to-amber-700 border border-black/40 shadow-sm" />

                    {/* Slot Window Vessel */}
                    <div className="relative bg-[#001211] rounded-2xl overflow-hidden border-[4px] border-[#8a5700] shadow-[inset_0_20px_40px_rgba(0,0,0,0.95),inset_0_-20px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(0,0,0,0.8)]">
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
                                    enableTease={enableTease}
                                />
                            ))}
                        </div>

                        {/* Curved Glass Cylinder Shadow Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.4)_22%,transparent_40%,transparent_60%,rgba(0,0,0,0.4)_78%,rgba(0,0,0,0.95)_100%)]" />

                        {/* Glass Glare Highlight Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-25 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.03)_35%,transparent_50%,rgba(255,255,255,0.05)_100%)]" />

                        {/* Center Target Selection Row */}
                        <div 
                            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-30 pointer-events-none"
                            style={{ height: itemHeight }} 
                        >   
                            {/* Gold Framed Selection Lines with Dark High-Contrast Backdrop */}
                            <div className="absolute inset-0 border-y-[3px] border-[#FFC62F] bg-black/40 shadow-[0_0_30px_rgba(255,198,47,0.6),inset_0_0_20px_rgba(0,0,0,0.8)]"></div>
                            
                            {/* 3D Left Pointer Arrow */}
                            <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center filter drop-shadow-[0_2px_10px_rgba(255,198,47,0.9)]">
                              <div className="w-0 h-0 border-y-[20px] border-y-transparent border-l-[28px] border-l-[#FFC62F] transform rotate-180" />
                            </div>

                            {/* 3D Right Pointer Arrow */}
                            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center filter drop-shadow-[0_2px_10px_rgba(255,198,47,0.9)]">
                              <div className="w-0 h-0 border-y-[20px] border-y-transparent border-l-[28px] border-l-[#FFC62F]" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Machine Base Accent Line */}
                    <div className="mt-4 flex justify-center">
                        <div className="h-2 w-1/3 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* 3D Mechanical Pull Lever Side Mechanism */}
            <div className="absolute top-1/2 -right-16 md:-right-20 -translate-y-1/2 w-[70px] h-[220px] z-0 hidden md:block">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[38px] h-[75px] bg-gradient-to-r from-[#593d00] via-[#B88100] to-[#593d00] rounded-r-2xl border-y-[2.5px] border-r-[2.5px] border-yellow-200/50 shadow-2xl"></div>
                <div className="absolute top-1/2 left-[15px] -translate-y-1/2 w-[26px] h-[26px] bg-gradient-to-br from-gray-200 via-gray-400 to-gray-700 rounded-full z-10 border-2 border-gray-100 shadow-md"></div>
                <motion.div
                    className="absolute top-1/2 left-[27px] w-[16px] h-[155px] origin-[50%_100%] z-0"
                    style={{ marginTop: '-155px' }} 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: leverState === 'pulled' ? 160 : 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 12 }}
                >
                    <div className="w-full h-full bg-gradient-to-r from-gray-400 via-gray-100 to-gray-500 rounded-t-full shadow-lg border border-gray-300"></div>
                    <div className="absolute -top-8 -left-[22px] w-[60px] h-[60px] rounded-full bg-[radial-gradient(circle_at_35%_35%,_#ff6b6b,_#cc0000,_#800000)] shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_-4px_8px_rgba(0,0,0,0.4)] border-2 border-yellow-400"></div>
                </motion.div>
            </div>
       </div>
    </div>
  );
};

export default SlotMachine;
