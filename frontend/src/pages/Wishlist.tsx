import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import ProductCard, { type BookItem } from "../components/ProductCard";
import BookDetailsModal from "../components/BookDetailsModal";
import SplitText from "../components/SplitText";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // We fetch wishlist from the new backend route
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // map backend Wishlist to BookItem format
        const mapped: BookItem[] = data.map((item: { book_id: string; title: string; author?: string; coverUrl?: string; isbn?: string }) => ({
          id: item.book_id,
          title: item.title,
          author: item.author || 'Unknown Author',
          coverUrl: item.coverUrl,
          isLocal: item.book_id.startsWith('local_'),
          isbn: item.isbn,
        }));
        setWishlistItems(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleBookClick = (book: BookItem) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  // Callback to refresh or manually remove item if it was un-wishlisted from the card
  const handleWishlistChange = () => {
    fetchWishlist(); // refresh the list
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f2eadd] dark:bg-black transition-colors duration-500">
      <Navigation />

      <div className="pt-32 pb-12 px-4 max-w-7xl mx-auto flex flex-col items-center">
        <div className="w-full max-w-4xl mb-12 text-center">
          <SplitText
            text="Your Wishlist"
            className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-[#DFE6E6] drop-shadow-lg tracking-tight mb-6"
            tag="h1"
            delay={50}
          />
          <p className="text-lg md:text-xl text-gray-700 dark:text-[#DFE6E6]/70 max-w-2xl mx-auto">
            Books you've saved for later. Keep track of what you want to read next.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="w-full bg-black/5 dark:bg-white/5 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-inner">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={handleBookClick} 
                  onWishlistToggle={handleWishlistChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center w-full bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-sm">
            <svg className="h-16 w-16 text-gray-400 dark:text-[#DFE6E6]/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] mb-2">No books wishlisted yet</h3>
            <p className="text-md text-gray-500">Start exploring and saving books you love!</p>
          </div>
        )}
      </div>

      <BookDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        book={selectedBook} 
      />
    </div>
  );
};

export default Wishlist;
