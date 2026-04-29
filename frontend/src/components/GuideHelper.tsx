import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';

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
  isbn?: string;
}

interface HelpItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  action?: () => void;
  actionText?: string;
}

const Stepper = ({ current, total }: { current: number; total: number }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div 
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current 
              ? "w-8 bg-emerald-500" 
              : i === current 
                ? "w-8 bg-emerald-500/30 animate-pulse" 
                : "w-4 bg-gray-200 dark:bg-white/10"
          }`}
        />
      ))}
    </div>
  );
};

const GuideHelper = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); // 0: Hub, 1-5: Bookfinder, 10: Page Guide List, 11: Detail
  const [selectedHelp, setSelectedHelp] = useState<HelpItem | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    genre: null,
    length: null,
    format: null,
  });
  const [genreAnswers, setGenreAnswers] = useState<{ mood: string | null; setting: string | null }>({
    mood: null,
    setting: null
  });
  const [loading, setLoading] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [recommendation, setRecommendation] = useState<BookResult | null>(null);

  const HELP_ITEMS: HelpItem[] = [
    {
      id: 'password',
      title: 'Password Change',
      icon: '🔐',
      description: 'You can change your password in your Profile settings under the Security section.',
      action: () => { navigate('/profile'); setIsOpen(false); },
      actionText: 'Go to Profile'
    },
    {
      id: 'wishlist',
      title: 'Wishlist not working',
      icon: '❤️',
      description: 'Make sure you are logged in first. To save a book, click the heart icon on any book card. You can view your saved books in your Wishlist page.'
    },
    {
      id: 'darkmode',
      title: 'Dark / Light Mode',
      icon: '🌗',
      description: 'You can toggle between dark and light themes using the moon/sun icon located at the top right of the navigation bar.'
    },
    {
      id: 'search',
      title: 'Search Tips',
      icon: '🔍',
      description: 'For best results, try searching by ISBN or the exact book title. You can also use the filter icon in the search bar to narrow down results.'
    },
    {
      id: 'pfp',
      title: 'Profile Picture',
      icon: '🖼️',
      description: 'Click your avatar in the top right, then go to Profile to update your image. You can change it once every 24 hours.',
      action: () => { navigate('/profile?action=upload-pfp'); setIsOpen(false); },
      actionText: 'Update Picture'
    }
  ];
  
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
      setStep(0); // Always start at Hub
    }
    setIsOpen(!isOpen);
  };

  const startBookfinder = () => {
    resetGuide();
    setStep(1); // Intro
  };

  const startGenrefinder = () => {
    resetGuide();
    setStep(20);
  };

  const openPageGuide = () => {
    setStep(10);
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
      setStep(5); // Result step (shifted)
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
          isbn: recommendation.isbn || null,
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
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col h-full items-center justify-center space-y-12"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How can I help?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select an option to get started</p>
            </div>
            
            <div className="flex flex-col items-center w-full space-y-4">
              <div className="grid grid-cols-2 gap-5 w-full px-4">
                <div className="flex flex-col items-center space-y-3">
                  <button 
                    onClick={startBookfinder}
                    className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transform group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </button>
                  <span className="font-bold text-gray-900 dark:text-white text-xs text-center">Bookfinder</span>
                </div>

                <div className="flex flex-col items-center space-y-3">
                  <button 
                    onClick={openPageGuide}
                    className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transform group-hover:-rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <span className="font-bold text-gray-900 dark:text-white text-xs text-center">Page Guide</span>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <button 
                  onClick={startGenrefinder}
                  className="w-20 h-20 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </button>
                <span className="font-bold text-gray-900 dark:text-white text-xs text-center">Genrefinder</span>
              </div>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full justify-between"
          >
            <div>
              <button onClick={() => setStep(0)} className="mb-4 text-emerald-500 flex items-center gap-1 text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Menu
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hello there!</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                I'm the BookHunt Guide. Having trouble deciding what to read next? Let me help you find the perfect book!
              </p>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition-colors"
            >
              Let's Go!
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <Stepper current={0} total={3} />
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
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <Stepper current={1} total={3} />
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
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <Stepper current={2} total={3} />
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
      case 20:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full justify-between"
          >
            <div>
              <button onClick={() => setStep(0)} className="mb-4 text-purple-500 flex items-center gap-1 text-sm font-bold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Menu
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Genrefinder</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Not sure what genre fits your current vibe? Let me analyze your mood and pick the perfect category for you!
              </p>
            </div>
            <button 
              onClick={() => setStep(21)}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold shadow-md transition-colors"
            >
              Start Analysis
            </button>
          </motion.div>
        );
      case 21:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <Stepper current={0} total={2} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What's your current mood?</h3>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Excited & Adventurous', val: 'adventure' },
                { label: 'Curious & Thoughtful', val: 'thoughtful' },
                { label: 'Romantic & Soft', val: 'romantic' },
                { label: 'Fearful & Thrilled', val: 'fear' },
                { label: 'Nostalgic', val: 'nostalgic' }
              ].map((mood) => (
                <button
                  key={mood.val}
                  onClick={() => { setGenreAnswers({...genreAnswers, mood: mood.val}); setStep(22); }}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 22:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <Stepper current={1} total={2} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What kind of setting sounds best?</h3>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Distant Future / Space', val: 'space' },
                { label: 'Ancient Past / Magic', val: 'past' },
                { label: 'Modern Day Realism', val: 'modern' },
                { label: 'Imaginary / Surreal', val: 'surreal' }
              ].map((setting) => (
                <button
                  key={setting.val}
                  onClick={() => { 
                    setGenreAnswers({...genreAnswers, setting: setting.val}); 
                    setStep(23); 
                  }}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
                >
                  {setting.label}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 23:
        const getRecommendedGenre = () => {
          const { mood, setting } = genreAnswers;
          if (mood === 'adventure' && setting === 'past') return { name: 'Fantasy Worlds', slug: 'fantasy' };
          if (mood === 'adventure' && setting === 'space') return { name: 'Science Fiction', slug: 'science fiction' };
          if (mood === 'thoughtful' && setting === 'modern') return { name: 'World Literature', slug: 'literature' };
          if (mood === 'fear') return { name: 'Horror & Halloween', slug: 'horror' };
          if (mood === 'romantic') return { name: 'Romance', slug: 'romance' };
          if (setting === 'past') return { name: 'Historical Records', slug: 'history' };
          return { name: 'Thrilling Mysteries', slug: 'thriller' };
        };
        const rec = getRecommendedGenre();
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-full items-center text-center justify-center space-y-6"
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center text-4xl shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Complete!</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Based on your mood, I think you'll love:</p>
              <h4 className="text-2xl font-black text-purple-500 mt-2 uppercase tracking-tight">{rec.name}</h4>
            </div>
            <button 
              onClick={() => { navigate('/genres'); setIsOpen(false); }}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-1 active:scale-95"
            >
              Take me there!
            </button>
            <button 
              onClick={resetGuide}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-medium transition-colors"
            >
              Try another mood
            </button>
          </motion.div>
        );
      case 5:
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
      case 10:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setStep(0)} className="text-blue-500 hover:text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Page Guide</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
              {HELP_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedHelp(item); setStep(11); }}
                  className="w-full flex items-center gap-4 px-4 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-2xl border border-gray-200 dark:border-white/10 transition-all text-left group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 11:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setStep(10)} className="text-blue-500 hover:text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Guide Details</h3>
            </div>
            
            {selectedHelp && (
              <div className="flex flex-col bg-blue-500/5 dark:bg-blue-500/10 rounded-3xl p-6 pb-10 border border-blue-500/20 mb-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <span className="text-4xl mb-3">{selectedHelp.icon}</span>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedHelp.title}</h4>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-center mb-8">
                  {selectedHelp.description}
                </p>
                
                <div className="mt-auto space-y-3">
                  {selectedHelp.action && (
                    <button 
                      onClick={selectedHelp.action}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-md transition-colors"
                    >
                      {selectedHelp.actionText || 'Take Action'}
                    </button>
                  )}
                  <button 
                    onClick={() => setStep(10)}
                    className="w-full py-3 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors"
                  >
                    Back to List
                  </button>
                </div>
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
                <span className="font-bold text-gray-900 dark:text-white">Book Guide Bob</span>
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
            <div className="p-6 pb-20 flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <div key={step}>
                  {renderContent()}
                </div>
              </AnimatePresence>
            </div>
            
            {/* Progress Bar (only show during questions) */}
            {step > 1 && step < 5 && (
              <div className="h-1 w-full bg-gray-200 dark:bg-white/5 shrink-0">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: `${((step - 2) / 3) * 100}%` }}
                  animate={{ width: `${((step - 1) / 3) * 100}%` }}
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
