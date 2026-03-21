import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookItem } from './ProductCard';

interface BookDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: BookItem | null;
}

const BookDetailsModal = ({ isOpen, onClose, book }: BookDetailsModalProps) => {
    const [currency, setCurrency] = useState<'USD' | 'HUF'>('USD');
    const [prices, setPrices] = useState<any>(null);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [priceError, setPriceError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !book || !book.isbn) return;

        const fetchPrices = async () => {
            setLoadingPrices(true);
            setPriceError(null);
            try {
                // To fetch both buy and sell prices
                const [buyRes, sellRes] = await Promise.all([
                    fetch(`/api/book-prices/buy/${book.isbn}?currency=${currency}`),
                    fetch(`/api/book-prices/sell/${book.isbn}?currency=${currency}`)
                ]);

                if (!buyRes.ok && !sellRes.ok) throw new Error('Failed to fetch prices');

                const buyData = buyRes.ok ? await buyRes.json() : null;
                const sellData = sellRes.ok ? await sellRes.json() : null;

                setPrices({
                    buy: buyData,
                    sell: sellData
                });
            } catch (err) {
                console.error("Price fetch error:", err);
                setPriceError("Could not retrieve latest prices for this book.");
            } finally {
                setLoadingPrices(false);
            }
        };

        fetchPrices();
    }, [isOpen, book, currency]);

    if (!book) return null;

    const formatPrice = (priceVal: any) => {
        if (!priceVal) return 'N/A';
        const num = parseFloat(priceVal);
        if (isNaN(num)) return 'N/A';
        if (currency === 'HUF') {
            return `${Math.round(num).toLocaleString('hu-HU')} Ft`;
        }
        return `$${num.toFixed(2)}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#f8f5f0] dark:bg-[#1a1b26] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 transition-colors"
                    >
                        {/* Header Banner */}
                        <div className="h-32 bg-linear-to-r from-emerald-600/40 to-teal-600/40 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row px-8 pb-8 relative gap-8">
                            {/* Book Cover */}
                            <div className="w-48 shrink-0 -mt-16 relative z-10">
                                <div className="aspect-2/3 rounded-xl shadow-xl overflow-hidden border-4 border-[#f8f5f0] dark:border-[#1a1b26] bg-gray-200">
                                    {book.coverUrl ? (
                                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-800 text-gray-500">
                                            No Cover
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info & Prices */}
                            <div className="flex-1 pt-4 md:pt-6">
                                <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-[#DFE6E6] mb-2">{book.title}</h2>
                                <p className="text-lg text-gray-700 dark:text-[#DFE6E6]/70 mb-4">{book.author}</p>

                                <div className="flex flex-wrap gap-2 mb-6 text-sm">
                                    {book.isbn && (
                                        <span className="bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-gray-800 dark:text-[#DFE6E6]/80 font-mono">
                                            ISBN: {book.isbn}
                                        </span>
                                    )}
                                    {book.publishedDate && (
                                        <span className="bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-gray-800 dark:text-[#DFE6E6]/80">
                                            Published: {book.publishedDate}
                                        </span>
                                    )}
                                    {book.pageCount && (
                                        <span className="bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-gray-800 dark:text-[#DFE6E6]/80">
                                            Pages: {book.pageCount}
                                        </span>
                                    )}
                                </div>

                                {book.description && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] mb-2">Description</h3>
                                        <p className="text-gray-700 dark:text-[#DFE6E6]/70 text-sm leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {book.description}
                                        </p>
                                    </div>
                                )}

                                {/* Pricing Section */}
                                <div className="mt-8 bg-white dark:bg-[#242533] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] flex items-center gap-2">
                                            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Market Prices
                                            {prices?.buy?._usdToHufRate && currency === 'HUF' && (
                                                <span className="text-xs font-normal text-gray-500 ml-2">
                                                    (Rate: {prices.buy._usdToHufRate})
                                                </span>
                                            )}
                                        </h3>
                                        
                                        {/* Currency Toggle */}
                                        <div className="flex items-center bg-gray-100 dark:bg-black/30 p-1 rounded-lg">
                                            <button 
                                                onClick={() => setCurrency('USD')} 
                                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${currency === 'USD' ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                USD
                                            </button>
                                            <button 
                                                onClick={() => setCurrency('HUF')} 
                                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${currency === 'HUF' ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                HUF
                                            </button>
                                        </div>
                                    </div>

                                    {!book.isbn ? (
                                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20 rounded-xl">
                                            Prices unavailable: No ISBN found for this book.
                                        </div>
                                    ) : loadingPrices ? (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
                                            <p className="text-gray-500 text-sm animate-pulse">Fetching live prices from BooksRun...</p>
                                        </div>
                                    ) : priceError ? (
                                        <div className="text-center py-6 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                            {priceError}
                                        </div>
                                    ) : prices ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Buy Prices */}
                                            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-3 border-b border-emerald-200 dark:border-emerald-800/30 pb-2">Buy / Rent</h4>
                                                
                                                {prices.buy?.result?.offers?.booksrun?.new?.price || prices.buy?.result?.offers?.booksrun?.used?.price ? (
                                                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {prices.buy.result.offers.booksrun.new?.price && (
                                                            <div className="flex justify-between items-center text-lg">
                                                                <span>New:</span>
                                                                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                                                    {formatPrice(prices.buy.result.offers.booksrun.new.price)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {prices.buy.result.offers.booksrun.used?.price && (
                                                            <div className="flex justify-between items-center text-lg">
                                                                <span>Used:</span>
                                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {formatPrice(prices.buy.result.offers.booksrun.used.price)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic mt-2">
                                                        No buy offers currently available for this edition.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sell Prices */}
                                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                                                <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3 border-b border-blue-200 dark:border-blue-800/30 pb-2">Sell To BooksRun</h4>
                                                
                                                {prices.sell?.result?.booksrun?.price?.price ? (
                                                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="flex justify-between items-center text-lg">
                                                            <span>Buyback Price:</span>
                                                            <span className="font-bold text-blue-700 dark:text-blue-300">
                                                                {formatPrice(prices.sell.result.booksrun.price.price)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic mt-2">
                                                        No buyback offers available for this edition.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookDetailsModal;
