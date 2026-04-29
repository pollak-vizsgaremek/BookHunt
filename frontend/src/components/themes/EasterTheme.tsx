import React from 'react';
import { motion } from 'framer-motion';

const Petal = ({ delay, duration, startX, size, color }: { delay: number; duration: number; startX: number; size: number; color: string }) => {
  return (
    <motion.div
      initial={{ y: "-10vh", opacity: 0 }}
      animate={{ 
        y: "110vh",
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration, 
        delay, 
        repeat: Infinity, 
        ease: "linear" 
      }}
      style={{ left: `${startX}%` }}
      className="fixed top-0 pointer-events-none z-[-5]"
    >
      <motion.div
        animate={{ 
          x: [-20, 20, -20],
          rotate: [0, 360],
          rotateY: [0, 180, 360]
        }}
        transition={{ 
          duration: duration * 0.4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div 
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: color,
            borderRadius: '0 50% 50% 50%',
            boxShadow: `0 0 10px ${color}66`,
            filter: 'blur(0.5px)'
          }} 
        />
      </motion.div>
    </motion.div>
  );
};

const EasterTheme: React.FC = () => {
  const petals = [
    { delay: 0, duration: 15, startX: 10, size: 15, color: "#fbcfe8" }, // pink-200
    { delay: 4, duration: 18, startX: 25, size: 20, color: "#f9a8d4" }, // pink-300
    { delay: 2, duration: 14, startX: 40, size: 12, color: "#fdf2f8" }, // pink-50
    { delay: 8, duration: 16, startX: 55, size: 18, color: "#fbcfe8" },
    { delay: 1, duration: 20, startX: 70, size: 22, color: "#f9a8d4" },
    { delay: 5, duration: 15, startX: 85, size: 16, color: "#fbcfe8" },
    { delay: 10, duration: 17, startX: 5, size: 14, color: "#f9a8d4" },
    { delay: 7, duration: 19, startX: 95, size: 19, color: "#fdf2f8" },
    { delay: 12, duration: 13, startX: 35, size: 15, color: "#fbcfe8" },
    { delay: 9, duration: 22, startX: 65, size: 17, color: "#f9a8d4" },
    { delay: 14, duration: 15, startX: 80, size: 12, color: "#fbcfe8" },
    { delay: 11, duration: 18, startX: 20, size: 21, color: "#fdf2f8" },
    { delay: 16, duration: 16, startX: 50, size: 16, color: "#f9a8d4" },
    { delay: 3, duration: 21, startX: 15, size: 18, color: "#fbcfe8" },
    { delay: 15, duration: 14, startX: 90, size: 13, color: "#f9a8d4" },
  ];

  return (
    <>
      {/* Light soft background tint for Easter */}
      <div className="fixed inset-0 pointer-events-none z-[-6] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(253,242,248,0.2)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(236,72,153,0.05)_100%)]" />
      
      {/* Falling Petals */}
      {petals.map((petal, i) => (
        <Petal key={i} {...petal} />
      ))}
    </>
  );
};

export default EasterTheme;
