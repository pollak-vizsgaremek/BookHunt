import React from 'react';
import { motion } from 'framer-motion';

const Bat = ({ delay, duration, startY, size }: { delay: number; duration: number; startY: string; size: number }) => {
  return (
    <motion.div
      initial={{ x: "-10vw", y: startY, opacity: 0 }}
      animate={{ 
        x: "110vw",
        y: [startY, "20vh", "80vh", "10vh", startY],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ 
        duration, 
        delay, 
        repeat: Infinity, 
        ease: "linear" 
      }}
      className="fixed top-0 left-0 pointer-events-none z-1"
    >
      <motion.div
        animate={{ 
          scaleX: [1, 0.4, 1],
          rotate: [0, 15, -15, 0, 360],
          y: [0, -15, 15, 0]
        }}
        transition={{
          scaleX: { duration: 0.3, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ width: size }}
      >
        <img 
          src="/images/BatIcon.png" 
          alt="Bat" 
          className="w-full h-auto drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] dark:brightness-125"
        />
      </motion.div>
    </motion.div>
  );
};

const HalloweenTheme: React.FC = () => {
  return (
    <>
      {/* Vignette Effect - Moved behind components */}
      <div className="fixed inset-0 pointer-events-none z-1 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.6)_100%)]" />
      
      {/* Flying Bats */}
      <Bat delay={0} duration={15} startY="30vh" size={46} />
      <Bat delay={5} duration={12} startY="60vh" size={35} />
      <Bat delay={10} duration={18} startY="15vh" size={58} />
      <Bat delay={2} duration={20} startY="80vh" size={40} />
      <Bat delay={7} duration={14} startY="45vh" size={52} />
      <Bat delay={12} duration={16} startY="5vh" size={29} />
      <Bat delay={15} duration={13} startY="90vh" size={46} />
    </>
  );
};

export default HalloweenTheme;
