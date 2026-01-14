
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FallingIconsProps {
  icons: string[];
  count?: number;
}

const FallingIcons: React.FC<FallingIconsProps> = ({ icons, count = 24 }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (icons.length === 0) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: count }).map((_, i) => {
      const isLeft = i % 2 === 0; // Chia đều 2 bên trái/phải
      return {
        id: i,
        isLeft,
        // Vị trí bắt đầu Y ngẫu nhiên từ 10% đến 90% chiều cao màn hình
        startY: 10 + Math.random() * 80, 
        // Vị trí kết thúc Y có thể lệch đi một chút để tạo độ bay tự nhiên, không quá thẳng
        endY: 10 + Math.random() * 80, 
        // Vị trí kết thúc X ngẫu nhiên quanh khu vực giữa (30% - 70%)
        endX: 30 + Math.random() * 40,
        delay: Math.random() * 5, 
        duration: 5 + Math.random() * 5, // Tốc độ bay chậm rãi (5-10s)
        size: 30 + Math.random() * 50, // Kích thước ngẫu nhiên
        rotation: Math.random() * 360,
        iconIndex: Math.floor(Math.random() * icons.length),
      };
    });
    setParticles(newParticles);
  }, [icons, count]);

  if (icons.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.img
          key={p.id}
          src={icons[p.iconIndex]}
          initial={{ 
            x: p.isLeft ? '-15vw' : '115vw', // Bắt đầu từ ngoài màn hình 2 bên
            y: `${p.startY}vh`,
            opacity: 0, 
            rotate: 0, 
            scale: 0.5 
          }}
          animate={{ 
            x: `${p.endX}vw`, // Bay vào khu vực giữa
            y: `${p.endY}vh`,
            rotate: p.isLeft ? 360 : -360, // Xoay vòng
            opacity: [0, 1, 1, 0], // Hiện dần rồi biến mất khi đến giữa
            scale: [0.5, 1, 1.1, 0] // Phóng to dần rồi thu nhỏ biến mất
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "easeInOut", // Chuyển động mượt mà
          }}
          style={{ 
            position: 'absolute', 
            width: p.size,
            height: 'auto',
            // Hiệu ứng phát sáng nhẹ (Glow) để nổi bật trên nền tối
            filter: 'drop-shadow(0 0 15px rgba(255, 198, 47, 0.5))'
          }}
        />
      ))}
    </div>
  );
};

export default FallingIcons;
