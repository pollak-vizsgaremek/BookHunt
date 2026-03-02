import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import ProductCard, { type Product } from "../components/ProductCard";
import ScrollFloat from "../components/ScrollFloat.tsx";
import Carousel from "../components/Carousel";
import Grainient from "../components/Grainient";
import SplitText from "../components/SplitText";

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Absolute Background Grainient */}
      <div className="absolute inset-0 w-full h-full -z-10 bg-[#f2eadd] dark:bg-black transition-colors duration-500">
        <div className="hidden dark:block w-full h-full">
          <Grainient
            color1="#312f31"
            color2="#4d4a59"
            color3="#7a797c"
            grainAmount={0}
            noiseScale={3.7}
            blendAngle={86}
            timeSpeed={0.55}
            colorBalance={0.37}
            warpStrength={2.65}
            zoom={0.7}
            rotationAmount={1080}
          />
        </div>
      </div>

      <Navigation />

      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto flex flex-col items-center">

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

          <Carousel />

          {/* Premium Search Bar */}
          <div className="relative mt-20 group w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-gray-500 dark:text-[#DFE6E6]/50 group-focus-within:text-gray-900 group-focus-within:dark:text-[#DFE6E6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="block w-full pl-12 pr-4 py-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-lg text-gray-900 dark:text-[#DFE6E6] placeholder-gray-500 dark:placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:bg-black/10 dark:focus:bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-[#DFE6E6]/50 hover:text-gray-900 dark:hover:text-[#DFE6E6] transition-colors focus:outline-none"
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
              <h2 className="text-xl font-medium text-gray-900 dark:text-[#DFE6E6]">
                Search Results for "{searchQuery}"
              </h2>
              <span className="text-gray-600 dark:text-[#DFE6E6]/60 text-sm">
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
              <div className="flex flex-col items-center justify-center py-20 text-center w-full bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-sm mt-4 transition-colors">
                <svg className="h-16 w-16 text-gray-400 dark:text-[#DFE6E6]/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] mb-2">No matching books found</h3>
                <p className="text-gray-600 dark:text-[#DFE6E6]/70">
                  Try adjusting your search terms or exploring different titles.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full py-32 flex flex-col items-center justify-center space-y-32">
            <ScrollFloat text="Join the BookHunt" textClassName="text-6xl md:text-8xl font-black text-gray-900 dark:text-[#DFE6E6] tracking-tighter drop-shadow-2xl" />

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
        )}

      </div>
    </div>
  );
};

export default Home;
