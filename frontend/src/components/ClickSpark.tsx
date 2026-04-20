import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  extraScale?: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
}

const ClickSpark = ({
  sparkColor = "#a3e635",
  sparkSize = 2,
  sparkRadius = 3,
  sparkCount = 8,
  duration = 400,
  extraScale = 1,
}: ClickSparkProps) => {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const id = Date.now();
      setSparks((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, duration + 100);
    },
    [duration]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      {sparks.map((spark) => (
        <SparkInstance
          key={spark.id}
          x={spark.x}
          y={spark.y}
          color={sparkColor}
          size={sparkSize}
          radius={sparkRadius}
          count={sparkCount}
          duration={duration}
          extraScale={extraScale}
        />
      ))}
    </div>
  );
};

interface SparkInstanceProps {
  x: number;
  y: number;
  color: string;
  size: number;
  radius: number;
  count: number;
  duration: number;
  extraScale: number;
}

const SparkInstance = ({
  x,
  y,
  color,
  size,
  radius,
  count,
  duration,
  extraScale,
}: SparkInstanceProps) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: duration / 1000, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x,
        top: y,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i * 360) / count;
        const rad = (angle * Math.PI) / 180;
        const distance = radius * 4; // Travel distance based on radius
        // The endpoint of the spark
        const targetX = Math.cos(rad) * distance * extraScale;
        const targetY = Math.sin(rad) * distance * extraScale;

        return (
          <motion.div
            key={i}
            initial={{ scaleX: 1, x: 0, y: 0, opacity: 1 }}
            animate={{
              x: targetX,
              y: targetY,
              scaleX: 0,
            }}
            transition={{
              duration: duration / 1000,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: size,
              height: 3, // Thicker line for more rounded appearance
              backgroundColor: color,
              transformOrigin: "left center",
              rotate: angle,
              borderRadius: "999px",
            }}
          />
        );
      })}
    </motion.div>
  );
};

export default ClickSpark;
