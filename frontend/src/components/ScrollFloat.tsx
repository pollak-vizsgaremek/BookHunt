import { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollFloatProps {
    text: string;
    containerClassName?: string;
    textClassName?: string;
}

const ScrollFloat = ({
    text,
    containerClassName = "",
    textClassName = ""
}: ScrollFloatProps) => {
    const characters = useMemo(() => text.split(''), [text]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress of this specific component
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 0.9", "end 0.9"]
    });

    return (
        <div ref={containerRef} className={`overflow-hidden py-4 ${containerClassName}`}>
            <h2 className={`flex flex-wrap justify-center ${textClassName}`}>
                {characters.map((char, index) => {
                    // Stagger the animation across characters based on scroll position
                    const staggerStep = 0.5 / characters.length;
                    const start = index * staggerStep;
                    const end = start + 0.5; // length of individual animation

                    const MathClamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

                    // We use framer-motion's useTransform to map scroll progress to y/opacity
                    const y = useTransform(scrollYProgress,
                        [MathClamp(start, 0, 1), MathClamp(end, 0, 1)],
                        [80, 0]
                    );
                    const opacity = useTransform(scrollYProgress,
                        [MathClamp(start, 0, 1), MathClamp(end, 0, 1)],
                        [0, 1]
                    );

                    // Add subtle rotation for extra "float" feel
                    const rotate = useTransform(scrollYProgress,
                        [MathClamp(start, 0, 1), MathClamp(end, 0, 1)],
                        [10, 0]
                    );

                    // Add a pronounced blur radius that clears as it floats in
                    const blur = useTransform(scrollYProgress,
                        [MathClamp(start, 0, 1), MathClamp(end, 0, 1)],
                        ["blur(12px)", "blur(0px)"]
                    );

                    return (
                        <motion.span
                            key={index}
                            style={{ y, opacity, rotateX: rotate, filter: blur }}
                            className="inline-block"
                        >
                            {char === " " ? "\u00A0" : char}
                        </motion.span>
                    );
                })}
            </h2>
        </div>
    );
};

export default ScrollFloat;
