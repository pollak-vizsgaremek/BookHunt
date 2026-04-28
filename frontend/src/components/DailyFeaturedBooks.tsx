import React, { useState, useEffect, useCallback } from 'react';
import CircularGallery from './CircularGallery';
import type { BookItem } from './ProductCard'; // if needed, we define our own type interface or fetch directly

interface DailyFeaturedBooksProps {
    onBookClick?: (book: BookItem) => void;
}

const DailyFeaturedBooks: React.FC<DailyFeaturedBooksProps> = ({ onBookClick }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [featuredBooks, setFeaturedBooks] = useState<{ image: string; text: string; book: BookItem }[]>([]);
    const [loading, setLoading] = useState(true);
    const [dayOffset, setDayOffset] = useState(0);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.szerepkor === 'ADMIN';

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0); // Next midnight
            
            const diff = midnight.getTime() - now.getTime();
            
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchFeatured = async () => {
            setLoading(true);
            try {
                // Fetch beautifully curated daily featured books via Google Books categories
                const subjects = ['fiction', 'fantasy', 'mystery', 'romance', 'thriller', 'history'];
                const dayIndex = (new Date().getDate() + dayOffset) % subjects.length;
                const querySubject = subjects[dayIndex];
                
                const url = `/api/books/search?maxResults=40&subject=${querySubject}&orderBy=relevance`;
                
                const [googleResponse, libriResponse] = await Promise.all([
                    fetch(url),
                    fetch(`/api/books/libri-search?q=${querySubject}`).catch(() => null)
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
                                categories: [querySubject],
                                language: 'hu',
                                isLibri: true,
                                price: b.price,
                                previewLink: b.previewLink
                            }));
                        } catch(e) {}
                    }

                    // Filter unique books by ID and similar titles to prevent clustering (e.g. 5 'BBC History' issues)
                    const seenIds = new Set();
                    const seenTitles = new Set();
                    
                    const combinedBooks = [...libriBooks, ...(data.books || [])];
                    // Randomize the results to make the "trending" gallery feel fresh
                    const shuffledBooks = combinedBooks.sort(() => Math.random() - 0.5);
                    
                    const uniqueBooks = shuffledBooks
                        .filter((b: any) => {
                            // Stricter filtering: must have a thumbnail and it shouldn't be a generic placeholder
                            if (!b.googleId || !b.thumbnail || !b.title || seenIds.has(b.googleId)) return false;
                            
                            // Prevent similar books from dominating the gallery (e.g. magazine issues)
                            const titlePrefix = b.title.substring(0, 15).toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (seenTitles.has(titlePrefix)) return false;
                            
                            if (b.isLibri) {
                                seenIds.add(b.googleId);
                                seenTitles.add(titlePrefix);
                                return true;
                            }
                            
                            // Google Books "no image" pattern
                            if (b.thumbnail.includes('content-type=image') || b.thumbnail.includes('noimage')) return false;
                            
                            // Heuristic: Obscure editions without descriptions usually have auto-generated white covers
                            if (!b.description || b.description.length < 20) return false;

                            // Advanced Heuristic: Auto-generated text-only covers lack both the 'edge=curl' rendering artifact and high-res variants
                            const hasEdgeCurl = b.thumbnail.includes('edge=curl');
                            const hasHighRes = !!(b.imageLinks?.small || b.imageLinks?.medium || b.imageLinks?.large || b.thumbnail.includes('imgtk'));
                            if (!hasEdgeCurl && !hasHighRes) return false;
                            
                            seenIds.add(b.googleId);
                            seenTitles.add(titlePrefix);
                            return true;
                        }).slice(0, 12);

                    const mapped = uniqueBooks.map((b: any) => {
                            // Prefer the highest resolution image available — same strategy as search results
                            let bestImg = b.imageLinks?.extraLarge || b.imageLinks?.large || b.imageLinks?.medium || b.thumbnail;
                            
                            if (bestImg) {
                                // Only upgrade standard Google Books thumbnail URLs to higher resolution zoom=3
                                if (bestImg.includes('books.google.com/books/') && bestImg.includes('zoom=')) {
                                    bestImg = bestImg
                                        .replace('http:', 'https:')
                                        .replace('&edge=curl', '')
                                        .replace(/zoom=\d+/, 'zoom=3');
                                } else {
                                    bestImg = bestImg.replace('http:', 'https:').replace('&edge=curl', '');
                                }
                                
                                // Upgrade fife resolution if present (Google Content CDN)
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
                                image: bestImg, // Use the high-res Google Books URL directly
                                text: b.title.length > 25 ? b.title.substring(0, 25).trim() + '...' : b.title,
                                book: bookItem
                            };
                        });
                    
                    setFeaturedBooks(mapped.length > 0 ? mapped : getDefaultBooks());
                } else {
                    setFeaturedBooks(getDefaultBooks());
                }
            } catch (err) {
                console.error("Failed to fetch featured books", err);
                setFeaturedBooks(getDefaultBooks());
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, [dayOffset]);

    const getDefaultBooks = (): { image: string; text: string; book: BookItem }[] => [
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/vH3LDwAAQBAJ?fife=w800-h1200', 
            text: 'Milk and Honey',
            book: { id: 'default1', title: 'Milk and Honey', author: 'Rupi Kaur', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/vH3LDwAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/F2NWnQEACAAJ?fife=w800-h1200', 
            text: 'The Alchemist',
            book: { id: 'default2', title: 'The Alchemist', author: 'Paulo Coelho', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/F2NWnQEACAAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/content?id=jZ91EAAAQBAJ&printsec=frontcover&img=1&zoom=3', 
            text: 'Modern Architecture',
            book: { id: 'default3', title: 'Modern Architecture', author: 'Archi Design', coverUrl: 'https://books.google.com/books/content?id=jZ91EAAAQBAJ&printsec=frontcover&img=1&zoom=3', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/1d-XDwAAQBAJ?fife=w800-h1200', 
            text: 'Great Gatsby',
            book: { id: 'default4', title: 'Great Gatsby', author: 'F. Scott Fitzgerald', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/1d-XDwAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/NlcPAgAAQBAJ?fife=w800-h1200', 
            text: 'Library Secrets',
            book: { id: 'default5', title: 'Library Secrets', author: 'Bibliophile', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/NlcPAgAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/sXh4EAAAQBAJ?fife=w800-h1200', 
            text: 'Dune',
            book: { id: 'default6', title: 'Dune', author: 'Frank Herbert', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/sXh4EAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/6H-oEAAAQBAJ?fife=w800-h1200', 
            text: 'Zen Design',
            book: { id: 'default7', title: 'Zen Design', author: 'Zen Master', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/6H-oEAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/Ld79EAAAQBAJ?fife=w800-h1200', 
            text: 'Atomic Habits',
            book: { id: 'default8', title: 'Atomic Habits', author: 'James Clear', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/Ld79EAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/5NomkK4XV68C?fife=w800-h1200', 
            text: 'Bookstore Tales',
            book: { id: 'default9', title: 'Bookstore Tales', author: 'Clerk Jones', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/5NomkK4XV68C?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: 'https://books.google.com/books/publisher/content/images/frontcover/E1bWEAAAQBAJ?fife=w800-h1200', 
            text: 'Adventure Peaks',
            book: { id: 'default10', title: 'Adventure Peaks', author: 'Sky Walker', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/E1bWEAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
    ];

    const handleGalleryClick = useCallback((item: any) => {
        if (onBookClick) onBookClick(item.book);
    }, [onBookClick]);

    if (loading) {
        return (
            <div className="w-full h-80 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (featuredBooks.length === 0) return null;

    return (
        <div className="w-full mt-24 mb-16 px-4 py-8 relative flex flex-col items-center">

            <div className="w-full max-w-6xl flex justify-between items-end mb-8 relative z-10 px-4 md:px-8">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-[#DFE6E6] tracking-tighter drop-shadow-md">
                        Daily Featured
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                        Based on trending popularity
                    </p>
                </div>
                <div className="text-right pb-1 flex flex-col items-end">
                    <div className="flex items-center space-x-3 mb-1">
                        {isAdmin && (
                            <button 
                                onClick={() => setDayOffset(prev => prev + 1)}
                                className="text-xs px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md transition-colors"
                                title="Cycle to next day's featured books"
                            >
                                Refresh
                            </button>
                        )}
                        <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            Resets In
                        </span>
                    </div>
                    <span className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-[#DFE6E6] bg-black/5 dark:bg-black/40 px-4 py-1.5 rounded-lg border border-black/10 dark:border-white/10 backdrop-blur-sm">
                        {timeLeft}
                    </span>
                </div>
            </div>

            <div 
                className="w-full h-[500px] relative overflow-hidden"
                style={{ 
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
                }}
            >
                <CircularGallery 
                    items={featuredBooks} 
                    bend={0} 
                    textColor="#ffffff" 
                    borderRadius={0.05}
                    onItemClick={handleGalleryClick}
                />
            </div>
        </div>
    );
};

export default DailyFeaturedBooks;
