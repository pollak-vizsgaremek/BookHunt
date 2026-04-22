import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "../components/Navigation";
import ProductCard, { type BookItem } from "../components/ProductCard";
import ScrollFloat from "../components/ScrollFloat";
import Carousel from "../components/Carousel";
import LightRays from "../components/LightRays";
import SplitText from "../components/SplitText";
import BookDetailsModal from "../components/BookDetailsModal";
import FilterModal, { type FilterOptions } from "../components/FilterModal";
import CountUp from "../components/CountUp";
import DailyFeaturedBooks from "../components/DailyFeaturedBooks";

const Home = () => {
  const [localProducts, setLocalProducts] = useState<BookItem[]>([]);
  const [searchResults, setSearchResults] = useState<BookItem[]>([]);
  const [wishlistedBookIds, setWishlistedBookIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    genre: 'All',
    type: 'All',
    year: '',
    sortBy: 'Popularity'
  });
  const [startIndex, setStartIndex] = useState(0);
  
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [isExitingAlert, setIsExitingAlert] = useState(false);

  // Keep track of previous query params to know if we are appending or resetting
  const lastFetchRef = useRef({ q: '', filters: filters });

  // Fetch local products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          const mapped: BookItem[] = data.map((p: { termek_id: number; cim: string; szerzok: string[]; tipus: string; isbn_issn: string; boritokep: string }) => ({
            id: `local_${p.termek_id}`,
            title: p.cim,
            author: p.szerzok && p.szerzok.length > 0 ? p.szerzok.join(', ') : 'Unknown Author',
            type: p.tipus,
            isbn: p.isbn_issn,
            coverUrl: p.boritokep,
            isLocal: true,
          }));
          setLocalProducts(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWishlistIds = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        const dismissed = sessionStorage.getItem('loginAlertDismissed');
        if (!dismissed) setShowLoginAlert(true);
        return;
      }
      try {
        const res = await fetch('/api/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>(data.map((item: { konyv_id: string }) => item.konyv_id));
          setWishlistedBookIds(ids);
        }
      } catch (err) {
        console.error("Failed to fetch wishlist ids", err);
      }
    };

    fetchProducts();
    fetchWishlistIds();
  }, []);

  // Effect to handle search logic
  useEffect(() => {
    let ignore = false;
    
    if (!searchQuery.trim() && filters.genre === 'All') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const isNewQuery = 
          lastFetchRef.current.q !== searchQuery || 
          JSON.stringify(lastFetchRef.current.filters) !== JSON.stringify(filters);

      setIsSearching(true);
      if (!ignore) setSearchError(null);
      try {
        let qParams = searchQuery.trim() || "";
        if (filters.year) qParams += ` ${filters.year}`;
        // Append type-specific keywords to improve relevance
        if (filters.type === 'Manga') qParams += ` manga comics`;
        if (filters.type === 'Graphic Novel') qParams += ` graphic novel comics`;
        if (filters.type === 'Audiobook') qParams += ` audiobook`;
        
        // At least one valid query string or subject needed
        if (!qParams && filters.genre === 'All') {
            if (!ignore) setSearchResults([]);
            if (!ignore) setIsSearching(false);
            return;
        }

        // Fetch a few extra results so we have enough after ISBN filtering
        let url = `/api/books/search?maxResults=40&startIndex=${startIndex}`
        
        if (qParams) url += `&q=${encodeURIComponent(qParams)}`;
        if (filters.genre !== 'All') url += `&subject=${encodeURIComponent(filters.genre)}`;
        if (filters.type === 'Book') url += `&printType=books`;
        if (filters.type === 'E-book') url += `&filter=ebooks`;
        if (filters.sortBy === 'Newest') url += `&orderBy=newest`;
        else if (filters.sortBy === 'Popularity') url += `&orderBy=relevance`;

        const response = await fetch(url);
        if (ignore) return;
        
        if (response.ok) {
          const data = await response.json();
          const allMapped: BookItem[] = (data.books || []).map((b: { googleId: string; title: string; authors?: string[]; thumbnail?: string; isbn?: string; description?: string; pageCount?: number; publishedDate?: string; categories?: string[]; language?: string; ratingsCount?: number; averageRating?: number }) => ({
            id: b.googleId,
            title: b.title,
            author: b.authors && b.authors.length > 0 ? b.authors.join(', ') : 'Unknown Author',
            coverUrl: b.thumbnail 
                ? b.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=3').replace('&edge=curl', '') 
                : null,
            isbn: b.isbn || null,
            description: b.description,
            pageCount: b.pageCount,
            publishedDate: b.publishedDate,
            categories: b.categories,
            language: b.language,
            isLocal: false,
            ratingsCount: b.ratingsCount || 0,
            averageRating: b.averageRating || 0,
          }));

          // Only show books that have an ISBN — required for price lookup
          const mapped = allMapped.filter(b => !!b.isbn);
          
          if (allMapped.length < 40) setHasMore(false);
          else setHasMore(true);

          if (isNewQuery) {
              setSearchResults(mapped);
          } else {
              // Appending, filter out duplicates just in case
              setSearchResults(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const newItems = mapped.filter(p => !existingIds.has(p.id));
                  return [...prev, ...newItems];
              });
          }

          lastFetchRef.current = { q: searchQuery, filters };
        } else {
            if (!ignore) {
                try {
                    const errData = await response.json();
                    setSearchError(errData.error || "Failed to search books.");
                } catch (e) {
                    setSearchError("Service temporarily unavailable.");
                }
                if (isNewQuery) setSearchResults([]);
            }
        }
      } catch (error) {
        if (!ignore) {
            console.error("Failed to fetch search results", error);
            setSearchError("Network error occurred.");
            if (isNewQuery) setSearchResults([]);
        }
      } finally {
        if (!ignore) setIsSearching(false);
      }
    }, isNewQuery() ? 600 : 0); // debounce only on typing, not on load more

    function isNewQuery() {
        return lastFetchRef.current.q !== searchQuery || 
               JSON.stringify(lastFetchRef.current.filters) !== JSON.stringify(filters);
    }

    return () => {
        clearTimeout(timer);
        ignore = true;
    };
  }, [searchQuery, filters, startIndex]);

  const handleBookClick = useCallback((book: BookItem) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  }, []);

  // Map filter display names to DB Prisma enum values
  const TYPE_TO_DB: Record<string, string> = {
    'Book': 'konyv',
    'E-book': 'e_konyv',
    'Manga': 'manga',
    'Graphic Novel': 'kepregeny',
    'Audiobook': 'hangoskonyv',
  };

  const localMatches = localProducts.filter((product) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || product.title.toLowerCase().includes(query) ||
        (product.author && product.author.toLowerCase().includes(query)) ||
        (product.isbn && product.isbn.toLowerCase().includes(query));
    
    const matchesGenre = filters.genre === 'All' || (product.categories && product.categories.includes(filters.genre));

    // Filter by type: compare the DB enum value to the product's type field
    const dbType = filters.type !== 'All' ? TYPE_TO_DB[filters.type] : null;
    const matchesType = !dbType || product.type === dbType;
    
    return matchesQuery && matchesGenre && matchesType;
  });

  // Apply custom client-side sorting before rendering
  const getSortedResults = (items: BookItem[]) => {
      const sorted = [...items];
      if (filters.sortBy === 'Popularity') {
          // Google Books API is fetched using &orderBy=relevance.
          // This allows Google's natural underlying Engine to dictate the "popularity" order.
          // Client-side sorting using meta fields destroys their natural keyword/author matching relevance.
          return sorted;
      } else if (filters.sortBy === 'A-Z') {
          sorted.sort((a,b) => a.title.localeCompare(b.title));
      } else if (filters.sortBy === 'Z-A') {
          sorted.sort((a,b) => b.title.localeCompare(a.title));
      } else if (filters.sortBy === 'Year (Desc)') {
          sorted.sort((a,b) => parseInt(b.publishedDate || '0') - parseInt(a.publishedDate || '0'));
      } else if (filters.sortBy === 'Year (Asc)') {
          sorted.sort((a,b) => parseInt(a.publishedDate || '9999') - parseInt(b.publishedDate || '9999'));
      }
      return sorted;
  };

  const displayedSearchResults = getSortedResults(searchResults);
  const displayedLocalMatches = getSortedResults(localMatches);
  const showResults = searchQuery.trim() || filters.genre !== 'All';

  // Grouping for ISBN Validation
  const isValidISBN = (isbn: string | null) => {
    if (!isbn) return false;
    const clean = isbn.replace(/-/g, '');
    return /^(?:\d{9}[\dX]|\d{13})$/i.test(clean);
  };

  const validISBNResults = displayedSearchResults.filter(r => isValidISBN(r.isbn));
  const invalidISBNResults = displayedSearchResults.filter(r => !isValidISBN(r.isbn));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Absolute Background LightRays */}
      <div className="fixed inset-0 w-full h-full -z-10 bg-[#f2eadd] dark:bg-[#1a1a1c] transition-colors duration-500">
        <div className="w-full h-full">
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
      </div>

      <Navigation />

      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto flex flex-col items-center">
        {showLoginAlert && (
          <div className={`w-full max-w-4xl mb-8 relative transition-all duration-500 transform ${
            isExitingAlert 
              ? "opacity-0 -translate-y-8 pointer-events-none scale-95" 
              : "animate-in fade-in slide-in-from-top-4"
          }`}>
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/40 backdrop-blur-md rounded-2xl p-6 pr-14 shadow-lg shadow-emerald-500/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="bg-emerald-500/20 dark:bg-emerald-500/40 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-1">Join the Hunt!</h3>
                  <p className="text-emerald-700/80 dark:text-emerald-100/70 leading-relaxed font-medium">
                    Unlock every feature on BookHunt by simply logging in! Gain access to wishlists, price tracker notifications, forum discussions and more!
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsExitingAlert(true);
                    sessionStorage.setItem('loginAlertDismissed', 'true');
                    setTimeout(() => setShowLoginAlert(false), 500);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-xl text-emerald-800/40 dark:text-emerald-300/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Hero Section */}
        <div className="w-full max-w-4xl mb-20 text-center space-y-20 mt-16">
          <div>
            <SplitText
              text="Welcome to BookHunt"
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-[#DFE6E6] drop-shadow-lg tracking-tight mb-6"
              tag="h1"
              delay={50}
            />
            <p className="text-lg md:text-xl text-gray-700 dark:text-[#DFE6E6]/70 max-w-2xl mx-auto">
              Your gateway to new experiences and stories.
            </p>
          </div>

          <div className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-[#DFE6E6]/90 mt-8 mb-4">
            With BookHunt you can search over
            <br />
            <CountUp
              from={0}
              to={40000000}
              separator=","
              direction="up"
              duration={1.5}
              className="text-5xl md:text-6xl font-extrabold text-emerald-500 drop-shadow-md inline-block my-4"
            />
            <br />
            Books!
          </div>

          <Carousel />

          {/* Premium Search Bar */}
          <div className="relative mt-20 group w-full flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl focus-within:ring-2 focus-within:ring-black/30 dark:focus-within:ring-white/30 focus-within:bg-black/10 dark:focus-within:bg-white/10 backdrop-blur-md transition-all duration-300">
            <div className="pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-gray-500 dark:text-[#DFE6E6]/50 group-focus-within:text-gray-900 group-focus-within:dark:text-[#DFE6E6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setStartIndex(0); }}
              placeholder="Search by title, author, or ISBN in Google Books..."
              className="block flex-1 pl-4 pr-12 py-4 bg-transparent text-lg text-gray-900 dark:text-[#DFE6E6] placeholder-gray-500 dark:placeholder-[#DFE6E6]/40 focus:outline-none"
            />
            
            {/* Action Buttons */}
            <div className="absolute right-2 flex items-center gap-1">
                {searchQuery && (
                <button
                    onClick={() => { setSearchQuery(""); setFilters({ ...filters, genre: 'All' }); setStartIndex(0); }}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-[#DFE6E6]/50 dark:hover:text-white transition-colors focus:outline-none"
                    title="Clear search"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                )}
                
                <div className="h-6 w-px bg-black/10 dark:bg-white/20 mx-1"></div>
                
                <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors focus:outline-none flex items-center gap-1"
                    title="Filters"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>
            </div>
          </div>
        </div>

        {/* Product Grid or Custom Content */}
        {loading || (isSearching && startIndex === 0) ? (
          <div className="w-full flex flex-col items-center">
            <div className="flex justify-center items-center py-20 w-full flex-col gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black/50 dark:border-white/50"></div>
              <p className="text-gray-500">
                  {isSearching ? "Searching Google Books library..." : "Loading collections..."}
              </p>
            </div>
            <DailyFeaturedBooks onBookClick={handleBookClick} />
          </div>
        ) : showResults ? (
          <div className="w-full flex flex-col gap-12">
            
            {/* Google Books Results in Constrained Height Container */}
            <div className="flex flex-col">
              <div className="w-full flex justify-between items-center mb-6 pl-2">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-[#DFE6E6]">
                  Global Results
                </h2>
                <span className="text-gray-600 dark:text-[#DFE6E6]/60 text-sm">
                  {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'} loaded
                </span>
              </div>

              {searchResults.length > 0 ? (
                <div className="w-full pb-12 pt-2">
                    {validISBNResults.length > 0 && (
                        <div className="w-full justify-center grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
                            {validISBNResults.map((product) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onClick={handleBookClick} 
                                    initialIsWishlisted={wishlistedBookIds.has(product.id.toString())}
                                />
                            ))}
                        </div>
                    )}

                    {invalidISBNResults.length > 0 && (
                        <div className="w-full mt-10 border-t border-black/10 dark:border-white/10 pt-8 flex flex-col items-start bg-black/5 dark:bg-white/5 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-[#DFE6E6]">
                                    Digital & Unpriced Varieties
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-3xl leading-relaxed">
                                These matching items (often comic books, mangas, or digital prints) do not possess an international physical ISBN standard barcode. They cannot be routed through our automated retail web scraper engines, but you can still view them and track them in your wishlist collections!
                            </p>
                            <div className="w-full justify-center grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
                                {invalidISBNResults.map((product) => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        onClick={handleBookClick} 
                                        initialIsWishlisted={wishlistedBookIds.has(product.id.toString())}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {searchError && (
                        <div className="mt-8 flex justify-center w-full">
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-xl flex items-center gap-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-medium text-sm">{searchError}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Load More Button */}
                    {!searchError && hasMore && (
                        <div className="mt-12 flex justify-center pb-4">
                            <button 
                                onClick={() => setStartIndex(prev => prev + 40)}
                                disabled={isSearching}
                                className="group relative px-8 py-3 bg-white dark:bg-[#1a1b26] border border-black/10 dark:border-white/20 hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-900 dark:text-white rounded-xl font-bold font-serif tracking-wide shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isSearching && startIndex > 0 ? (
                                        <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <svg className="w-5 h-5 text-emerald-500 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                    Load more results
                                </span>
                            </button>
                        </div>
                    )}
                </div>
              ) : searchError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center w-full bg-red-500/5 dark:bg-red-500/10 rounded-3xl border border-red-500/20 backdrop-blur-sm mb-8">
                  <svg className="h-12 w-12 text-red-500/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-bold text-red-500 mb-1">Search Unavailable</h3>
                  <p className="text-sm text-red-400/80">{searchError}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center w-full bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-sm transition-colors">
                  <svg className="h-12 w-12 text-gray-400 dark:text-[#DFE6E6]/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-[#DFE6E6] mb-1">No global matches</h3>
                  <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>

            {/* Local Matches */}
            {displayedLocalMatches.length > 0 && (
              <div>
                <div className="w-full flex justify-between items-center mb-6 pl-2">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-[#DFE6E6]">
                    Local Collection Matches
                  </h2>
                  <span className="text-gray-600 dark:text-[#DFE6E6]/60 text-sm">
                    {displayedLocalMatches.length} {displayedLocalMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                <div className="w-full pt-2">
                    <div className="w-full justify-center grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedLocalMatches.map((product) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onClick={handleBookClick} 
                                initialIsWishlisted={wishlistedBookIds.has(product.id.toString())}
                            />
                        ))}
                    </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 w-full">
                <DailyFeaturedBooks onBookClick={handleBookClick} />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-full mb-8 mt-4">
                <DailyFeaturedBooks onBookClick={handleBookClick} />
            </div>
            <div className="w-full py-16 flex flex-col items-center justify-center space-y-32">
            <ScrollFloat text="Join the BookHunt" textClassName="text-6xl md:text-8xl font-black text-gray-900 dark:text-[#DFE6E6] tracking-tighter drop-shadow-2xl" />

            {/* Display default local products if any exist since we removed the direct rendering of all local products above. Let's just show a few */}
            {localProducts.length > 0 && (
                <div className="w-full">
                    <h2 className="text-3xl  font-bold text-gray-900 dark:text-[#DFE6E6] mb-8 text-center">Featured Collection</h2>
                    <div className="w-full justify-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4">
                        {localProducts.slice(0, 5).map((product) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onClick={handleBookClick} 
                                initialIsWishlisted={wishlistedBookIds.has(product.id.toString())}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-4xl text-center space-y-6 text-gray-800 dark:text-[#DFE6E6]/80 text-xl  leading-relaxed">
              <p></p>
              <p></p>
            </div>
            <ScrollFloat text="Search for any book in our massive library above, or browse our curated collections. Browse by genre, author, or ISBN number." textClassName="text-2xl md:text-2xl font-bold text-gray-600 dark:text-[#DFE6E6]/50" />
            <ScrollFloat text="Or perhaps you'd want to keep track of your book progress in a fun modern way? We've got you covered with our state of the art progress tracking system that will make you want to read more and compete with others in a gameified system." textClassName="text-2xl md:text-2xl font-bold text-gray-600 dark:text-[#DFE6E6]/50" />

            <div className="mt-32 pb-40">
              <ScrollFloat text="Keep exploring, keep hunting" textClassName="text-4xl md:text-5xl font-bold text-gray-600 dark:text-[#DFE6E6]/50" />
            </div>
          </div>
          </div>
        )}

      </div>

      <BookDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        book={selectedBook} 
      />

      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => { setFilters(newFilters); setStartIndex(0); }}
      />
    </div>
  );
};

export default Home;
