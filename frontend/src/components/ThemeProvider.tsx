import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextProps {
    theme: Theme;
    toggleTheme: (x?: number, y?: number) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark');

    // Initialize theme from localStorage or default to dark
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const changeTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const toggleTheme = (x?: number, y?: number) => {
        const isDark = theme === 'dark';
        const newTheme = isDark ? 'light' : 'dark';

        // If View Transitions API is not supported, just switch and return
        if (!document.startViewTransition) {
            changeTheme(newTheme);
            return;
        }

        // Default origins if coordinates not provided
        const originX = x ?? window.innerWidth / 2;
        const originY = y ?? window.innerHeight / 2;

        // Calculate radius to far corner
        const endRadius = Math.hypot(
            Math.max(originX, window.innerWidth - originX),
            Math.max(originY, window.innerHeight - originY)
        );

        const transition = document.startViewTransition(() => {
            changeTheme(newTheme);
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${originX}px ${originY}px)`,
                `circle(${endRadius}px at ${originX}px ${originY}px)`
            ];

            document.documentElement.animate(
                {
                    clipPath: isDark ? [...clipPath].reverse() : clipPath
                },
                {
                    duration: 600,
                    easing: 'ease-in-out',
                    pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
                }
            );
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
