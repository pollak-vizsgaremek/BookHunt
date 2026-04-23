import React, { useState } from 'react';
import SpotlightCard from './SpotlightCard';

export interface BookItem {
    id: string | number;
    title: string;
    author: string;
    type?: string;
    isbn?: string;
    coverUrl?: string;
    description?: string;
    pageCount?: number;
    publishedDate?: string;
    categories?: string[];
    language?: string;
    isLocal?: boolean;
    ratingsCount?: number;
    averageRating?: number;
    price?: string;
    previewLink?: string;
}

/** Derive a display type + badge style from the book's categories */
function getBookTypeBadge(product: BookItem): { label: string; className: string } {
    const cats = (product.categories ?? []).map(c => c.toLowerCase()).join(' ');
    const isLibri = product.isbn?.startsWith('LIBRI-');

    if (cats.includes('manga')) {
        return {
            label: 'Manga',
            className: 'bg-pink-500/20 dark:bg-pink-500/30 border-pink-400/40 text-pink-700 dark:text-pink-300',
        };
    }
    if (cats.includes('comic') || cats.includes('graphic novel')) {
        return {
            label: 'Comic',
            className: 'bg-yellow-400/20 dark:bg-yellow-400/20 border-yellow-400/40 text-yellow-700 dark:text-yellow-300',
        };
    }
    if (isLibri) {
        return {
            label: 'Libri',
            className: 'bg-emerald-500/20 dark:bg-emerald-500/30 border-emerald-400/40 text-emerald-700 dark:text-emerald-300',
        };
    }
    return {
        label: product.type || 'Book',
        className: 'bg-black/10 dark:bg-black/60 border-black/10 dark:border-white/10 text-gray-900 dark:text-[#DFE6E6]',
    };
}

interface ProductCardProps {
    product: BookItem;
    onClick?: (book: BookItem) => void;
    onWishlistToggle?: () => void;
    initialIsWishlisted?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onWishlistToggle, initialIsWishlisted = false }) => {
    const [showLoginToast, setShowLoginToast] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [isAdding, setIsAdding] = useState(false);

    React.useEffect(() => {
        setIsWishlisted(initialIsWishlisted);
    }, [initialIsWishlisted]);

    const handleWishlistClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // prevent clicking the card

        const token = localStorage.getItem('token');
        if (!token) {
            setShowLoginToast(true);
            setTimeout(() => setShowLoginToast(false), 3000);
            return;
        }

        if (isAdding) return;
        setIsAdding(true);

        try {
            if (onWishlistToggle || isWishlisted) {
                // Delete explicitly
                const res = await fetch(`/api/wishlist/${product.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setIsWishlisted(false);
                    if (onWishlistToggle) onWishlistToggle();
                }
            } else {
                // Add to wishlist
                const res = await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        konyv_id: product.id.toString(),
                        cim: product.title,
                        szerzo: product.author,
                        boritokep_url: product.coverUrl,
                        isbn: product.isbn || null
                    })
                });
                
                if (res.ok) {
                    setIsWishlisted(true);
                } else {
                    const errorData = await res.json();
                    if (errorData?.error === "Book is already in wishlist") {
                        setIsWishlisted(true); 
                    } else if (errorData?.error === "Token expired" || errorData?.error === "Invalid token" || res.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setShowLoginToast(true);
                        setTimeout(() => setShowLoginToast(false), 3000);
                    } else {
                        alert(`Could not save book: ${errorData?.details || errorData?.error || 'Unknown error'}`);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <SpotlightCard 
            className="group bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full min-h-[360px] cursor-pointer" 
            spotlightColor="rgba(255, 255, 255, 0.15)"
        >
            <div className="flex flex-col w-full h-full" onClick={() => onClick && onClick(product)}>
                {/* Cover Image */}
                <div className="relative aspect-2/3 w-full overflow-hidden bg-[#e0d6c8] dark:bg-[#242533] transition-colors">
                    {product.coverUrl ? (
                        <img
                            src={product.coverUrl}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).src = '/images/book_cover.png';
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-[#DFE6E6]/30">
                            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    )}

                    {/* Type Badge */}
                    {(() => {
                        const { label, className } = getBookTypeBadge(product);
                        return (
                            <div className={`absolute top-3 right-3 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider transition-colors z-10 ${className}`}>
                                {label}
                            </div>
                        );
                    })()}

                    {/* Wishlist Button */}
                    <button 
                        type="button"
                        onClick={handleWishlistClick}
                        disabled={isAdding}
                        className="absolute top-3 left-3 bg-black/30 dark:bg-black/60 hover:bg-black/50 dark:hover:bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full border border-white/20 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all z-20 flex items-center justify-center group/btn active:scale-90"
                        title={onWishlistToggle || isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        {isAdding ? (
                            <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : onWishlistToggle || isWishlisted ? (
                            <svg className="w-5 h-5 text-red-500 fill-current drop-shadow-md transition-transform group-hover/btn:scale-110" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                {/* Minus sign overlay for remove */}
                                <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" />
                            </svg>
                        ) : (
                            <div className="relative">
                                <svg className="w-5 h-5 transition-transform group-hover/btn:scale-110 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full text-white w-3.5 h-3.5 flex items-center justify-center shadow-sm">
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                                </div>
                            </div>
                        )}
                    </button>

                    {/* Unauthenticated Login Toast */}
                    <div className={`absolute top-16 left-3 right-3 bg-red-500/90 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm text-center font-medium shadow-xl transition-all duration-300 z-20 pointer-events-none origin-top ${showLoginToast ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}>
                        Log in to save books
                    </div>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col grow relative z-10 w-full transition-colors">
                    <h3 className="text-gray-900 dark:text-[#DFE6E6] font-serif font-bold text-xl leading-tight line-clamp-2 mb-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {product.title}
                    </h3>

                    <p className="text-gray-700 dark:text-[#DFE6E6]/70 font-medium text-sm mb-4 line-clamp-1">
                        {product.author || 'Unknown Author'}
                    </p>

                    <div className="mt-auto pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between transition-colors">
                        {product.price ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg max-w-[140px] truncate">
                                {product.price}
                            </span>
                        ) : (
                            <span className="text-gray-600 dark:text-[#DFE6E6]/50 text-xs font-mono bg-black/5 dark:bg-black/30 px-2 py-1 rounded max-w-[140px] truncate">
                                {product.isbn || 'N/A'}
                            </span>
                        )}
                        <div className="text-gray-800 dark:text-[#DFE6E6]/80 group-hover:text-black dark:group-hover:text-white bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </SpotlightCard>
    );
};

export default ProductCard;
