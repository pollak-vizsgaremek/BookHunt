import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for our questions and book result
type Genre = 'Fantasy' | 'Science Fiction' | 'Mystery' | 'Romance' | 'Non-Fiction' | 'Historical';
type Length = 'Short (<300 pages)' | 'Medium (300-500 pages)' | 'Epic (>500 pages)' | 'Any';
type Format = 'Traditional Book' | 'Graphic Novel / Comic';

interface Answers {
  genre: Genre | null;
  length: Length | null;
  format: Format | null;
}

interface BookResult {
  googleId: string;
  title: string;
  authors?: string[];
  thumbnail?: string;
  pageCount?: number;
  description?: string;
}

const GuideHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    genre: null,
    length: null,
    format: null,
  });
  const [loading, setLoading] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [recommendation, setRecommendation] = useState<BookResult | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const resetGuide = () => {
    setStep(0);
    setAnswers({ genre: null, length: null, format: null });
    setRecommendation(null);
  };

  const toggleModal = () => {
    if (!isOpen) {
      resetGuide();
    }
    setIsOpen(!isOpen);
  };

  const handleAnswer = (field: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setStep((prev) => prev + 1);

    // If it's the last question (format), trigger the search
    if (field === 'format') {
      fetchRecommendation({ ...answers, format: value as Format });
    }
  };

  const fetchRecommendation = async (finalAnswers: Answers) => {
    setLoading(true);
    try {
      // Build the query
      let query = `subject:${finalAnswers.genre}`;
      if (finalAnswers.format === 'Graphic Novel / Comic') {
        query += `+comic`;
      }

      // Generate a random start index to fetch different batches of books each time
      const randomStartIndex = Math.floor(Math.random() * 40);

      // Fetch more results to have a large pool to filter from
      const res = await fetch(`/api/books/search?maxResults=40&startIndex=${randomStartIndex}&q=${encodeURIComponent(query)}`);
      
      if (res.ok) {
        const data = await res.json();
        const books: BookResult[] = data.books || [];

        // Filter by length if possible
        let filteredBooks = books;
        if (finalAnswers.length !== 'Any') {
          filteredBooks = books.filter(b => {
            const pages = b.pageCount || 0;
            if (pages === 0) return false; // skip books with unknown page count if length matters
            if (finalAnswers.length === 'Short (<300 pages)' && pages < 300) return true;
            if (finalAnswers.length === 'Medium (300-500 pages)' && pages >= 300 && pages <= 500) return true;
            if (finalAnswers.length === 'Epic (>500 pages)' && pages > 500) return true;
            return false;
          });
        }

        // Fallback to all fetched books if filtering removed everything
        const finalPool = filteredBooks.length > 0 ? filteredBooks : books;

        if (finalPool.length > 0) {
          // Pick a completely random book from the pool to ensure variety every time
          const randomIndex = Math.floor(Math.random() * finalPool.length);
          setRecommendation(finalPool[randomIndex]);
        } else {
          setRecommendation(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch recommendation:", err);
      setRecommendation(null);
    } finally {
      setLoading(false);
      setStep(4); // Result step
    }
  };

  const addToWishlist = async () => {
    if (!recommendation) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add to wishlist.");
      return;
    }

    setIsAddingToWishlist(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          konyv_id: recommendation.googleId,
          cim: recommendation.title,
          szerzo: recommendation.authors ? recommendation.authors.join(", ") : "Unknown Author",
          boritokep_url: recommendation.thumbnail?.replace('http:', 'https:') || null,
        })
      });

      if (res.ok) {
        alert("✨ Added to wishlist!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add to wishlist");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const recalculate = () => {
    if (answers.genre && answers.format) {
      fetchRecommendation(answers);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full space-y-4"
        >
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Consulting the ancient archives...</p>
        </motion.div>
      );
    }

    switch (step) {
      case 0:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full justify-between"
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hello there!</h3>
              <p className="text-gray-600 dark:text-gray-300">
                I'm the BookHunt Guide. Having trouble deciding what to read next? Let me help you find the perfect book!
              </p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition-colors"
            >
              Let's Go!
            </button>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What kind of world do you want to explore?</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {['Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Non-Fiction', 'Historical'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleAnswer('genre', genre)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How long of a journey are you up for?</h3>
            <div className="flex-1 space-y-2">
              {['Short (<300 pages)', 'Medium (300-500 pages)', 'Epic (>500 pages)', 'Any'].map((len) => (
                <button
                  key={len}
                  onClick={() => handleAnswer('length', len)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
                >
                  {len}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Traditional reading or visual storytelling?</h3>
            <div className="flex-1 space-y-2">
              {['Traditional Book', 'Graphic Novel / Comic'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleAnswer('format', fmt)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
                >
                  {fmt}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-full overflow-y-auto custom-scrollbar"
          >
            {recommendation ? (
              <div className="flex flex-col items-center text-center space-y-4 pb-4">
                <h3 className="text-lg font-bold text-emerald-500">I found a match!</h3>
                <div className="w-32 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden shrink-0">
                  {recommendation.thumbnail ? (
                    <img src={recommendation.thumbnail.replace('http:', 'https:')} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Cover</div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white line-clamp-2">{recommendation.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{recommendation.authors?.join(", ") || "Unknown Author"}</p>
                  {recommendation.pageCount && (
                    <span className="inline-block mt-2 px-2 py-1 bg-black/5 dark:bg-white/10 rounded text-xs text-gray-600 dark:text-gray-300">
                      {recommendation.pageCount} pages
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 w-full gap-2 mt-4">
                  <button 
                    onClick={recalculate}
                    className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-1 text-sm"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recalculate
                  </button>
                  <button 
                    onClick={addToWishlist}
                    disabled={isAddingToWishlist}
                    className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-1 text-sm shadow-md disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isAddingToWishlist ? 'Saving...' : 'Wishlist'}
                  </button>
                </div>
                <button 
                  onClick={resetGuide}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                >
                  Start Over
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <img src="/images/LogoSadGlass.png" alt="Sad" className="w-24 h-24 opacity-70" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nothing found...</h3>
                <p className="text-gray-600 dark:text-gray-400">I couldn't find a book matching all those criteria.</p>
                <button 
                  onClick={resetGuide}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleModal}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-white dark:bg-[#2A2B3D] border border-gray-200 dark:border-white/10 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300 transform hover:-translate-y-1 focus:outline-none flex items-center justify-center group"
        title="Ask the Guide"
      >
        <img 
          src="/images/LogoHappy.png" 
          alt="Guide" 
          className="w-10 h-10 object-contain transform group-hover:scale-110 transition-transform" 
        />
        {/* Unread badge or indicator could go here */}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-28 right-6 z-50 w-80 h-[500px] bg-white/90 dark:bg-[#1a1b26]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            ref={modalRef}
          >
            {/* Header */}
            <div className="h-16 bg-emerald-500/10 flex items-center justify-between px-5 border-b border-gray-200/50 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <img src="/images/LogoHappy.png" alt="Guide" className="w-8 h-8" />
                <span className="font-bold text-gray-900 dark:text-white">Book Guide</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <div key={step} className="h-full">
                  {renderContent()}
                </div>
              </AnimatePresence>
            </div>
            
            {/* Progress Bar (only show during questions) */}
            {step > 0 && step < 4 && (
              <div className="h-1 w-full bg-gray-200 dark:bg-white/5 shrink-0">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: `${((step - 1) / 3) * 100}%` }}
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GuideHelper;
