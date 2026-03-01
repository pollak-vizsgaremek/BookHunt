import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import ProductCard, { type Product } from "../components/ProductCard";
import ScrollFloat from "../components/ScrollFloat.tsx";
import Carousel from "../components/Carousel";

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.cim.toLowerCase().includes(query) ||
      (product.szerzo && product.szerzo.toLowerCase().includes(query)) ||
      (product.isbn_issn && product.isbn_issn.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-[#232327]">
      <Navigation />

      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto flex flex-col items-center">

        {/* Header Hero Section */}
        <div className="w-full max-w-4xl mb-20 text-center space-y-20 mt-16">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#DFE6E6] drop-shadow-lg tracking-tight mb-6">
              Welcome to BookHunt
            </h1>
            <p className="text-lg md:text-xl text-[#DFE6E6]/70 max-w-2xl mx-auto">
              Your gateway to new experiences and stories.
            </p>
          </div>

          <Carousel />

          {/* Premium Search Bar */}
          <div className="relative mt-20 group w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-[#DFE6E6]/50 group-focus-within:text-[#DFE6E6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg text-[#DFE6E6] placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#DFE6E6]/50 hover:text-[#DFE6E6] transition-colors focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid or Custom Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50"></div>
          </div>
        ) : searchQuery ? (
          <>
            {/* Results Info */}
            <div className="w-full flex justify-between items-center mb-6 pl-2">
              <h2 className="text-xl font-medium text-[#DFE6E6]">
                Search Results for "{searchQuery}"
              </h2>
              <span className="text-[#DFE6E6]/60 text-sm">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="w-full justify-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.termek_id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center w-full bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm mt-4">
                <svg className="h-16 w-16 text-[#DFE6E6]/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-[#DFE6E6] mb-2">No matching books found</h3>
                <p className="text-[#DFE6E6]/70">
                  Try adjusting your search terms or exploring different titles.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full py-32 flex flex-col items-center justify-center space-y-32">
            <ScrollFloat text="Scroll Down" textClassName="text-6xl md:text-8xl font-black text-[#DFE6E6] tracking-tighter drop-shadow-2xl" />

            <div className="max-w-4xl text-center space-y-6 text-[#DFE6E6]/80 text-xl font-serif leading-relaxed">
              <p>Search for any book in our massive library above, or browse our curated collections.</p>
              <p>Type in a title, an author, or an ISBN number to get started.</p>
            </div>

            <div className="mt-32 pb-40">
              <ScrollFloat text="Keep exploring" textClassName="text-4xl md:text-5xl font-bold text-[#DFE6E6]/50" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
