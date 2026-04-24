import { useState, useEffect, useRef } from "react";
import Navigation from "../components/Navigation";
import SplitText from "../components/SplitText";
import { usePageTitle } from "../utils/usePageTitle";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface Bookmark {
  id: number;
  konyv_id: string;
  cim: string;
  szerzo?: string;
  boritokep_url?: string;
  oldalszam: number;
  max_oldalszam?: number;
  idezet?: string;
}

interface SearchResult {
  googleId: string;
  title: string;
  authors?: string[];
  thumbnail?: string;
  pageCount?: number;
}

const Bookmarks = () => {
  usePageTitle('Bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookmarks();
    
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleClose = () => setActiveMenuId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  const fetchBookmarks = async () => {
    try {
      if (!token) return;
      const res = await fetch("/api/bookmarks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookmarks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/books/search?maxResults=5&q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.books || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addBookmark = async (book: SearchResult) => {
    if (bookmarks.length >= 20) {
      alert("You can only have up to 20 bookmarks.");
      return;
    }
    
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          konyv_id: book.googleId,
          cim: book.title,
          szerzo: book.authors ? book.authors.join(", ") : "Unknown Author",
          boritokep_url: book.thumbnail?.replace('http:', 'https:') || null,
          oldalszam: 0,
          max_oldalszam: book.pageCount || null,
          idezet: ""
        })
      });

      if (res.ok) {
        setSearchQuery("");
        setShowDropdown(false);
        fetchBookmarks();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add bookmark");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const removeBookmark = async (id: number) => {
    if (!confirm("Are you sure you want to remove this bookmark?")) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const finishBookmark = async (id: number) => {
    if (!confirm("Did you finish this book?")) return;

    // Fireworks effect!
    const duration = 2 * 500;
    const animationEnd = Date.now() + duration;
    const colors = ["#10b981", "#34d399", "#3b82f6", "#f59e0b", "#ef4444", "#ffffff", "#8b5cf6", "#ec4899"];

    const frame = () => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) return;

      const particleCount = 2;
      
      // Side cannons
      confetti({
        particleCount,
        angle: 60,
        spread: 40,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount,
        angle: 120,
        spread: 40,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();

    // Central "Big Firework" burst
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.6 },
      startVelocity: 50,
      gravity: 0.8,
      scalar: 1.3,
      colors: colors,
    });

    // Remove from state immediately to trigger exit animation
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    try {
      await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to delete finished bookmark", err);
    }
  };

  const updateBookmark = async (id: number, field: 'oldalszam' | 'idezet', value: string | number) => {
    // Optimistic UI update
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    
    try {
      await fetch(`/api/bookmarks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value })
      });
    } catch (err) {
      console.error("Update failed", err);
      // Optional: Revert on fail
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f2eadd] dark:bg-black transition-colors duration-500">
      <Navigation />

      <div className="pt-32 pb-12 px-4 max-w-7xl mx-auto flex flex-col items-center">
        <div className="w-full max-w-4xl mb-12 text-center">
          <SplitText
            text="Bookmarks"
            className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-[#DFE6E6] drop-shadow-lg tracking-tight mb-6"
            tag="h1"
            delay={50}
          />
          <p className="text-lg md:text-xl text-gray-700 dark:text-[#DFE6E6]/70 max-w-2xl mx-auto">
            Track your reading progress. Mark where you left off and drop a quick note. ({bookmarks.length}/20)
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mb-10 relative z-40" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a book to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all text-lg"
              disabled={bookmarks.length >= 20}
            />
            {isSearching && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute w-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
              {searchResults.map((book) => (
                <button
                  key={book.googleId}
                  onClick={() => addBookmark(book)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 text-left"
                >
                  {book.thumbnail ? (
                    <img 
                      src={book.thumbnail.replace('http:', 'https:')} 
                      alt={book.title} 
                      className="w-12 h-16 object-cover rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">No Cover</div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{book.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {book.authors?.join(", ") || "Unknown Author"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarks Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : bookmarks.length > 0 ? (
          <>
            {bookmarks.length >= 20 && (
              <div className="mb-12 flex flex-col items-center justify-center py-16 text-center w-full bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-sm">
                <img 
                  src="/TooManyBooks.gif" 
                  alt="Too many books" 
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-xl mb-6 opacity-90"
                />
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] mb-2">Whoa! That's a lot of books</h3>
                <p className="text-md text-gray-500 max-w-md mx-auto">You've reached the limit of 20 bookmarks. Time to dive into these stories before adding more!</p>
              </div>
            )}

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {bookmarks.map((bookmark) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.5, 
                      rotate: -10,
                      filter: "blur(10px)",
                      transition: { duration: 0.8, ease: "circIn" } 
                    }}
                    key={bookmark.id} 
                    className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative group transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4 z-50">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === bookmark.id ? null : bookmark.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {activeMenuId === bookmark.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden py-2"
                          >
                            <button
                              onClick={() => finishBookmark(bookmark.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Finish Book</span>
                            </button>
                            <button
                              onClick={() => removeBookmark(bookmark.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Remove</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-md">
                        {bookmark.boritokep_url ? (
                          <img src={bookmark.boritokep_url} alt={bookmark.cim} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs">No Cover</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">{bookmark.cim}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-3">{bookmark.szerzo}</p>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Page:</label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={bookmark.oldalszam || ""}
                              onChange={(e) => updateBookmark(bookmark.id, 'oldalszam', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 bg-white/50 dark:bg-black/30 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                              min="0"
                            />
                            <span className="text-gray-500 text-sm font-medium">
                              / {bookmark.max_oldalszam || '?'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Quote / Notes:</label>
                      <div className="relative group/quote">
                        <span className="absolute top-1 left-2 text-3xl text-emerald-500/30 font-serif leading-none select-none pointer-events-none group-focus-within/quote:text-emerald-500/60 transition-colors">"</span>
                        <textarea
                          value={bookmark.idezet || ""}
                          onChange={(e) => {
                            if (e.target.value.length <= 255) {
                              updateBookmark(bookmark.id, 'idezet', e.target.value);
                            }
                          }}
                          placeholder="Where did you leave off? (Max 255 chars)"
                          className="w-full h-24 pl-8 pr-8 py-3 bg-white/50 dark:bg-black/30 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                          maxLength={255}
                        />
                        <span className="absolute bottom-1 right-2 text-3xl text-emerald-500/30 font-serif leading-none select-none pointer-events-none group-focus-within/quote:text-emerald-500/60 transition-colors">"</span>
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {(bookmark.idezet?.length || 0)}/255
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center w-full bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-sm">
            <img 
              src="/images/LogoSadGlass.png" 
              alt="No bookmarks found" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl mb-4 opacity-80"
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] mb-2">No bookmarks yet</h3>
            <p className="text-md text-gray-500">Search for a book above to start tracking your reading journey.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
