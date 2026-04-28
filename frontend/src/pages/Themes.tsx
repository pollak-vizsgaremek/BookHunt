import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import ThemeGallery from '../components/ThemeGallery';
import BookDetailsModal from '../components/BookDetailsModal';
import { type BookItem } from '../components/ProductCard';
import { usePageTitle } from '../utils/usePageTitle';
import LightRays from '../components/LightRays';

const Themes = () => {
    usePageTitle('Themes');
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [globalTheme, setGlobalTheme] = useState("default");

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const res = await fetch("/api/settings/theme");
                if (res.ok) {
                    const data = await res.json();
                    setGlobalTheme(data.theme);
                }
            } catch (err) {}
        };
        fetchTheme();
    }, []);

    const handleBookClick = (book: BookItem) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedBook(null), 300);
    };

    return (
        <div className="relative min-h-screen bg-[#f2eadd] dark:bg-[#232327] transition-colors duration-500 overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LightRays
                    raysOrigin="top-center"
                    raysColor="#ffffff"
                    raysSpeed={1}
                    lightSpread={1.4}
                    rayLength={3}
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0}
                    distortion={0}
                    className="absolute inset-0 z-0 pointer-events-none"
                />
            </div>
            
            <Navigation />
            
            <div className="relative z-10 pt-32 pb-20 px-4 flex flex-col items-center">
                <div className="w-full max-w-6xl text-center mb-8 px-4">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-[#DFE6E6] drop-shadow-lg tracking-tight">
                        Explore by Theme
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-[#DFE6E6]/80 max-w-2xl mx-auto font-medium">
                        Dive into curated collections of our best books across different genres and themes.
                    </p>
                </div>

                <div className="w-full flex flex-col space-y-12">
                    {globalTheme === "christmas" && (
                        <ThemeGallery title="Christmas Collection" subject="christmas" onBookClick={handleBookClick} />
                    )}
                    <ThemeGallery title="Thrilling Mysteries" subject="thriller" onBookClick={handleBookClick} />
                    <ThemeGallery title="Classic Mystery" subject="mystery" onBookClick={handleBookClick} />
                    <ThemeGallery title="Fantasy Worlds" subject="fantasy" onBookClick={handleBookClick} />
                    <ThemeGallery title="Science Fiction" subject="science fiction" onBookClick={handleBookClick} />
                    <ThemeGallery title="World Literature" subject="literature" onBookClick={handleBookClick} />
                    <ThemeGallery title="Historical Records" subject="history" onBookClick={handleBookClick} />
                    <ThemeGallery title="Modern History" subject="modern history" onBookClick={handleBookClick} />
                    <ThemeGallery title="Mangas & Graphic Novels" subject="manga" onBookClick={handleBookClick} />
                    <ThemeGallery title="Comic Books" subject="comics" onBookClick={handleBookClick} />
                </div>
            </div>

            <BookDetailsModal
                book={selectedBook}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default Themes;
