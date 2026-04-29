import { useState, useEffect, useCallback } from 'react';
import CircularGallery from './CircularGallery';
import type { BookItem } from './ProductCard';
import ElectricBorder from './ElectricBorder';

interface ThemeGalleryProps {
    title: string;
    subject: string;
    onBookClick?: (book: BookItem) => void;
    isChristmas?: boolean;
    isHalloween?: boolean;
    isEaster?: boolean;
}

const ThemeGallery: React.FC<ThemeGalleryProps> = ({ title, subject, onBookClick, isChristmas = false, isHalloween = false, isEaster = false }) => {
    const [books, setBooks] = useState<{ image: string; text: string; book: BookItem }[]>([]);
    const [loading, setLoading] = useState(true);
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

    const effectiveIsChristmas = isChristmas || (globalTheme === "christmas" && subject.toLowerCase().includes("christmas"));
    const effectiveIsHalloween = isHalloween || (globalTheme === "halloween" && (subject.toLowerCase().includes("horror") || subject.toLowerCase().includes("halloween")));
    const effectiveIsEaster = isEaster || (globalTheme === "easter" && (subject.toLowerCase().includes("easter") || subject.toLowerCase().includes("spring") || subject.toLowerCase().includes("religion")));

    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const url = `/api/books/search?maxResults=40&subject=${encodeURIComponent(subject)}&orderBy=relevance`;
                
                const [googleResponse, libriResponse] = await Promise.all([
                    fetch(url),
                    fetch(`/api/books/libri-search?q=${encodeURIComponent(subject)}`).catch(() => null)
                ]);

                if (googleResponse.ok) {
                    const data = await googleResponse.json();
                    
                    let libriBooks: any[] = [];
                    if (libriResponse && libriResponse.ok) {
                        try {
                            const libriData = await libriResponse.json();
                            libriBooks = (libriData.books || []).map((b: any) => ({
                                googleId: b.googleId,
                                title: b.title,
                                authors: b.authors,
                                thumbnail: b.thumbnail?.startsWith('//') ? `https:${b.thumbnail}` : b.thumbnail,
                                imageLinks: b.thumbnail ? { thumbnail: b.thumbnail?.startsWith('//') ? `https:${b.thumbnail}` : b.thumbnail } : null,
                                isbn: b.googleId.toUpperCase().replace('_', '-'),
                                description: b.description || 'A trending book from Libri.',
                                pageCount: null,
                                publishedDate: null,
                                categories: [subject],
                                language: 'hu',
                                isLibri: true,
                                price: b.price,
                                previewLink: b.previewLink
                            }));
                        } catch(e) {}
                    }

                    const seenIds = new Set();
                    const seenTitles = new Set();
                    
                    const combinedBooks = [...libriBooks, ...(data.books || [])];
                    const shuffledBooks = combinedBooks.sort(() => Math.random() - 0.5);
                    
                    const uniqueBooks = shuffledBooks
                        .filter((b: any) => {
                            if (!b.googleId || !b.thumbnail || !b.title || seenIds.has(b.googleId)) return false;
                            
                            const titlePrefix = b.title.substring(0, 15).toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (seenTitles.has(titlePrefix)) return false;
                            
                            if (b.isLibri) {
                                seenIds.add(b.googleId);
                                seenTitles.add(titlePrefix);
                                return true;
                            }
                            
                            if (b.thumbnail.includes('content-type=image') || b.thumbnail.includes('noimage')) return false;
                            if (!b.description || b.description.length < 20) return false;

                            const hasEdgeCurl = b.thumbnail.includes('edge=curl');
                            const hasHighRes = !!(b.imageLinks?.small || b.imageLinks?.medium || b.imageLinks?.large || b.thumbnail.includes('imgtk'));
                            if (!hasEdgeCurl && !hasHighRes) return false;
                            
                            seenIds.add(b.googleId);
                            seenTitles.add(titlePrefix);
                            return true;
                        }).slice(0, 12);

                    const mapped = uniqueBooks.map((b: any) => {
                            let bestImg = b.imageLinks?.extraLarge || b.imageLinks?.large || b.imageLinks?.medium || b.thumbnail;
                            
                            if (bestImg) {
                                if (bestImg.includes('books.google.com/books/') && bestImg.includes('zoom=')) {
                                    bestImg = bestImg
                                        .replace('http:', 'https:')
                                        .replace('&edge=curl', '')
                                        .replace(/zoom=\d+/, 'zoom=3');
                                } else {
                                    bestImg = bestImg.replace('http:', 'https:').replace('&edge=curl', '');
                                }
                                if (bestImg.includes('fife=w')) {
                                    bestImg = bestImg.replace(/fife=w\d+-h\d+/, 'fife=w800-h1200');
                                }
                            }

                            const bookItem: BookItem = {
                                id: b.googleId,
                                title: b.title,
                                author: b.authors && b.authors.length > 0 ? b.authors.join(', ') : 'Unknown Author',
                                coverUrl: bestImg,
                                isbn: b.isbn || null,
                                description: b.description,
                                pageCount: b.pageCount,
                                publishedDate: b.publishedDate,
                                categories: b.categories,
                                language: b.language,
                                isLocal: false,
                                ratingsCount: b.ratingsCount || 0,
                                averageRating: b.averageRating || 0,
                                price: b.price,
                                previewLink: b.previewLink
                            };

                            return {
                                image: bestImg,
                                text: b.title.length > 25 ? b.title.substring(0, 25).trim() + '...' : b.title,
                                book: bookItem
                            };
                        });
                    
                    setBooks(mapped);
                }
            } catch (err) {
                console.error(`Failed to fetch books for theme ${subject}`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, [subject]);

    const handleGalleryClick = useCallback((item: any) => {
        if (onBookClick) onBookClick(item.book);
    }, [onBookClick]);

    if (loading) {
        return (
            <div className="w-full h-80 flex flex-col justify-center items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading {title}...</p>
            </div>
        );
    }

    if (books.length === 0) return null;

    return (
        <div className={`w-full my-12 relative flex flex-col items-center transition-all duration-700 ${effectiveIsChristmas ? 'py-12' : ''}`}>
            <div className="w-full max-w-7xl px-4 md:px-8 mb-6 relative z-10">
                <h2 className={`text-3xl md:text-4xl font-black tracking-tighter transition-colors duration-500 ${
                    effectiveIsChristmas 
                        ? 'bg-linear-to-r from-green-400 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                        : effectiveIsHalloween
                        ? 'bg-linear-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                        : effectiveIsEaster
                        ? 'bg-linear-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]'
                        : 'text-gray-900 dark:text-[#DFE6E6] drop-shadow-md'
                }`}>
                    {title}
                </h2>
                <p className={`mt-2 font-medium capitalize transition-colors duration-500 ${
                    effectiveIsChristmas ? 'text-red-500/80 dark:text-red-400/80' : 
                    effectiveIsHalloween ? 'text-orange-500/80 dark:text-orange-400/80' :
                    effectiveIsEaster ? 'text-green-500/80 dark:text-green-400/80' :
                    'text-gray-600 dark:text-gray-400'
                }`}>
                    {effectiveIsChristmas ? '✨ Seasonal Magic Awaits ✨' : 
                     effectiveIsHalloween ? '🎃 Spooky Tales Await 🎃' :
                     effectiveIsEaster ? '🐰 Spring Discoveries 🐰' :
                     `Explore top picks in ${subject}`}
                </p>
            </div>

            {effectiveIsChristmas ? (
                <ElectricBorder 
                    color="#22c55e" 
                    speed={1} 
                    chaos={0} 
                    borderRadius={32}
                    className="w-full max-w-7xl"
                >
                    <div 
                        className="w-full h-[400px] md:h-[500px] relative overflow-hidden transition-all duration-500 rounded-3xl bg-green-950/5"
                        style={{ 
                            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
                        }}
                    >
                        <CircularGallery 
                            items={books} 
                            bend={0} 
                            textColor="#ffffff" 
                            borderRadius={0.05}
                            onItemClick={handleGalleryClick}
                        />
                    </div>
                </ElectricBorder>
            ) : effectiveIsHalloween ? (
                <ElectricBorder 
                    color="#f97316" 
                    speed={1} 
                    chaos={0.1} 
                    borderRadius={32}
                    className="w-full max-w-7xl"
                >
                    <div 
                        className="w-full h-[400px] md:h-[500px] relative overflow-hidden transition-all duration-500 rounded-3xl bg-orange-950/5"
                        style={{ 
                            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
                        }}
                    >
                        <CircularGallery 
                            items={books} 
                            bend={0} 
                            textColor="#ffffff" 
                            borderRadius={0.05}
                            onItemClick={handleGalleryClick}
                        />
                    </div>
                </ElectricBorder>
            ) : effectiveIsEaster ? (
                <ElectricBorder 
                    color="#86efac" 
                    speed={1} 
                    chaos={0.0} 
                    borderRadius={32}
                    className="w-full max-w-7xl"
                >
                    <div 
                        className="w-full h-[400px] md:h-[500px] relative overflow-hidden transition-all duration-500 rounded-3xl bg-green-950/5"
                        style={{ 
                            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
                        }}
                    >
                        <CircularGallery 
                            items={books} 
                            bend={0} 
                            textColor="#ffffff" 
                            borderRadius={0.05}
                            onItemClick={handleGalleryClick}
                        />
                    </div>
                </ElectricBorder>
            ) : (
                <div 
                    className="w-full max-w-7xl h-[400px] md:h-[500px] relative overflow-hidden transition-all duration-500"
                    style={{ 
                        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
                    }}
                >
                    <CircularGallery 
                        items={books} 
                        bend={0} 
                        textColor="#ffffff" 
                        borderRadius={0.05}
                        onItemClick={handleGalleryClick}
                    />
                </div>
            )}
        </div>
    );
};

export default ThemeGallery;
