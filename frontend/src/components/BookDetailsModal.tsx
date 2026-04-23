import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookItem } from './ProductCard';

interface BookDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: BookItem | null;
}

interface Offer {
    store: string;
    condition?: string;
    price?: number;
    currency?: string;
    buyUrl?: string;
    /** Status emitted by the scraper orchestrator */
    status?: 'Found' | 'Not Found' | 'Error' | 'Loading';
}

interface PricesState {
    compare: {
        offers: Offer[];       // valid price-sorted offers
        allRows?: Offer[];     // all scraper rows (Found + Not Found + Error + Loading)
    } | null;
}

interface BooklineOffer {
    title: string;
    author: string;
    cover: string;
    link: string;
    priceText: string;
}

const BookDetailsModal = ({ isOpen, onClose, book }: BookDetailsModalProps) => {
    const [currency, setCurrency] = useState<'USD' | 'HUF'>('HUF');
    const [prices, setPrices] = useState<PricesState | null>(null);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [priceError, setPriceError] = useState<string | null>(null);
    const [booklineResults, setBooklineResults] = useState<BooklineOffer[]>([]);
    const [loadingBookline, setLoadingBookline] = useState(false);

    const fetchPrices = useCallback((isManualRefresh = false) => {
        if (!book?.isbn) return () => {};
        
        setLoadingPrices(true);
        setPriceError(null);
        setPrices({ compare: { offers: [], allRows: [] } });

        const categoriesParam = book.categories ? `&categories=${encodeURIComponent(book.categories.join(','))}` : '';
        const languageParam = book.language ? `&language=${encodeURIComponent(book.language)}` : '';
        const url = `/api/compare/${book.isbn}?currency=${currency}${categoriesParam}${languageParam}${isManualRefresh ? '&refresh=true' : ''}&stream=true`;

        const eventSource = new EventSource(url);

        eventSource.addEventListener('INIT', (event) => {
            const expectedStores = JSON.parse(event.data);
            setPrices(prev => ({
                compare: {
                    offers: prev?.compare?.offers || [],
                    allRows: expectedStores,
                }
            }));
        });

        eventSource.addEventListener('UPDATE', (event) => {
            const newOffer = JSON.parse(event.data);
            setPrices(prev => {
                const prevCompare = prev?.compare;
                if (!prevCompare || !prevCompare.allRows) return prev;
                
                let updatedRows = [...prevCompare.allRows];
                
                if (newOffer.store === 'BooksRun') {
                    if (updatedRows.some((r: Offer) => r.store === 'BooksRun' && r.status === 'Loading')) {
                        const idx = updatedRows.findIndex((r: Offer) => r.store === 'BooksRun' && r.status === 'Loading');
                        updatedRows[idx] = newOffer;
                    } else if (updatedRows.some((r: Offer) => r.store === 'BooksRun' && r.status === 'Not Found' && newOffer.status !== 'Not Found')) {
                        const idx = updatedRows.findIndex((r: Offer) => r.store === 'BooksRun' && r.status === 'Not Found');
                        updatedRows[idx] = newOffer;
                    } else if (newOffer.status === 'Found') {
                         const idx = updatedRows.findLastIndex((r: Offer) => r.store === 'BooksRun');
                         updatedRows.splice(idx + 1, 0, newOffer);
                    }
                } else {
                    const idx = updatedRows.findIndex((r: Offer) => r.store === newOffer.store);
                    if (idx !== -1) {
                        updatedRows[idx] = newOffer;
                    } else {
                        updatedRows.push(newOffer);
                    }
                }
                
                return {
                    compare: {
                        offers: prevCompare.offers,
                        allRows: updatedRows,
                    }
                };
            });
        });

        eventSource.addEventListener('DONE', (event) => {
            const finalData = JSON.parse(event.data);
            setPrices({ compare: finalData });
            setLoadingPrices(false);
            eventSource.close();
        });

        eventSource.addEventListener('ERROR', (event) => {
            const errorData = JSON.parse(event.data);
            setPriceError(errorData.error || "An error occurred fetching prices.");
            setLoadingPrices(false);
            eventSource.close();
        });

        eventSource.onerror = (error) => {
            console.error("SSE Error:", error);
            setLoadingPrices(false);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [book?.isbn, book?.categories, currency]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        // Only fetch prices if ISBN is a real ISBN-10/13 (non-standard IDs like PKEY:, OCLC: will fail)
        const isbn = book?.isbn;
        const isStandard = isbn && (
            isbn.startsWith('LIBRI-') ||
            /^\d{10}$/.test(isbn.replace(/[\s-]/g, '')) ||
            /^\d{13}$/.test(isbn.replace(/[\s-]/g, ''))
        );
        if (isOpen && isStandard) {
            cleanup = fetchPrices(false);
        } else if (isOpen && isbn && !isStandard) {
            // Non-standard: immediately set error so the search links panel shows
            setPriceError('no-standard-isbn');
            setLoadingPrices(false);
        }
        return () => {
            if (cleanup) cleanup();
        };
    }, [isOpen, book?.isbn, fetchPrices]);

    // Fetch Bookline prices when modal opens for a LIBRI book
    useEffect(() => {
        if (!isOpen || !book?.isbn?.startsWith('LIBRI-')) {
            setBooklineResults([]);
            return;
        }
        setLoadingBookline(true);
        const query = `${book.title} ${book.author}`;
        fetch(`/api/books/bookline-search?q=${encodeURIComponent(query)}`)
            .then(r => r.ok ? r.json() : { books: [] })
            .then(data => setBooklineResults(data.books || []))
            .catch(() => setBooklineResults([]))
            .finally(() => setLoadingBookline(false));
    }, [isOpen, book?.isbn, book?.title, book?.author]);

    if (!book) return null;


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#f8f5f0] dark:bg-[#1a1b26] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 transition-colors"
                    >
                        <div className="h-32 bg-linear-to-r from-emerald-600/40 to-teal-600/40 relative">
                            <button
                                onClick={() => onClose()}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row px-8 pb-8 relative gap-8">
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

                            <div className="flex-1 pt-4 md:pt-6">
                                <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-[#DFE6E6] mb-2">{book.title}</h2>
                                <p className="text-lg text-gray-700 dark:text-[#DFE6E6]/70 mb-4">{book.author}</p>

                                <div className="flex flex-wrap gap-2 mb-6 text-sm">
                                    {book.isbn && !book.isbn.startsWith('LIBRI-') && (
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

                                {book.isbn?.startsWith('LIBRI-') ? (
                                    <div className="mt-8 bg-white dark:bg-[#242533] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] flex items-center gap-2 mb-6">
                                            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Hungarian Prices
                                        </h3>

                                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 overflow-hidden">
                                            <div className="flex items-center justify-between mb-3 border-b border-emerald-200 dark:border-emerald-800/30 pb-2">
                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Prices per store</h4>
                                                {loadingBookline && (
                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"/>
                                                        Fetching Bookline...
                                                    </span>
                                                )}
                                            </div>

                                            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-emerald-100/50 dark:bg-emerald-900/20">
                                                    <tr>
                                                        <th className="px-4 py-3 rounded-tl-lg">Store</th>
                                                        <th className="px-4 py-3">Book</th>
                                                        <th className="px-4 py-3">Price</th>
                                                        <th className="px-4 py-3 text-right rounded-tr-lg">Link</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Libri row */}
                                                    <tr className="border-b border-emerald-100 dark:border-emerald-800/30">
                                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">Libri.hu</td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[140px] truncate">{book.title}</td>
                                                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{book.price || '—'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            {book.previewLink ? (
                                                                <a href={book.previewLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-black hover:bg-gray-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-1 px-4 rounded-lg text-xs font-bold transition-all shadow-sm">
                                                                    buy
                                                                </a>
                                                            ) : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                                                        </td>
                                                    </tr>

                                                    {/* Bookline rows (skeleton or real) */}
                                                    {loadingBookline ? (
                                                        Array.from({ length: 2 }).map((_, i) => (
                                                            <tr key={`bl-skel-${i}`} className="border-b border-emerald-100 dark:border-emerald-800/30 last:border-0">
                                                                <td className="px-4 py-3"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/></td>
                                                                <td className="px-4 py-3"><div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/></td>
                                                                <td className="px-4 py-3"><div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/></td>
                                                                <td className="px-4 py-3 flex justify-end"><div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"/></td>
                                                            </tr>
                                                        ))
                                                    ) : booklineResults.filter(b => b.priceText).map((b, i) => (
                                                        <tr key={`bl-${i}`} className="border-b border-emerald-100 dark:border-emerald-800/30 last:border-0 hover:bg-white dark:hover:bg-emerald-900/40 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">Bookline</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[140px] truncate" title={b.title}>{b.title}</td>
                                                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{b.priceText}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <a href={b.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-black hover:bg-gray-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-1 px-4 rounded-lg text-xs font-bold transition-all shadow-sm">
                                                                    buy
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-8 bg-white dark:bg-[#242533] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] flex items-center gap-2">
                                                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Market Prices
                                                <button 
                                                    onClick={() => fetchPrices(true)} 
                                                    disabled={loadingPrices} 
                                                    className="text-gray-400 hover:text-emerald-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-black/30 disabled:opacity-50"
                                                    title="Refresh prices"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loadingPrices && (!prices?.compare?.allRows || prices.compare.allRows.length === 0) ? 'animate-spin text-emerald-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m13 13v-5h-.581m0 0a8.003 8.003 0 01-15.356-2m0 0H15" />
                                                    </svg>
                                                </button>
                                            </h3>
                                            
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
                                        ) : loadingPrices && (!prices?.compare?.allRows || prices.compare.allRows.length === 0) ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-emerald-100/50 dark:bg-emerald-900/20">
                                                        <tr>
                                                            <th className="px-4 py-3 rounded-tl-lg">Store</th>
                                                            <th className="px-4 py-3">Condition</th>
                                                            <th className="px-4 py-3">Price</th>
                                                            <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <tr key={i} className="border-b border-emerald-100 dark:border-emerald-800/30 last:border-0">
                                                                <td className="px-4 py-3">
                                                                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}px` }} />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${70 + (i % 2) * 15}px` }} />
                                                                </td>
                                                                <td className="px-4 py-3 flex justify-end">
                                                                    <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 animate-pulse">
                                                    Connecting to pricing service...
                                                </p>
                                            </div>
                                        ) : priceError && (!prices?.compare?.allRows || prices.compare.allRows.length === 0) ? (
                                            // Non-standard ISBN or scraping error — show search links instead
                                            <div className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-5">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                                        This book does not have a standard ISBN, so automatic price comparison is unavailable. You can search for it in these stores using the links below:
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[  
                                                        { label: 'Amazon', url: `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}&i=stripbooks`, color: 'bg-orange-500 hover:bg-orange-400' },
                                                        { label: 'eBay', url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(book.title + ' ' + book.author)}`, color: 'bg-blue-500 hover:bg-blue-400' },
                                                        { label: 'Bookline', url: `https://bookline.hu/search/search.action?searchfield=${encodeURIComponent(book.title)}`, color: 'bg-green-600 hover:bg-green-500' },
                                                        { label: 'Libri.hu', url: `https://www.libri.hu/talalati_lista/?text=${encodeURIComponent(book.title)}`, color: 'bg-emerald-600 hover:bg-emerald-500' },
                                                    ].map(s => (
                                                        <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                                                            className={`${s.color} text-white text-sm font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md`}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                                            {s.label}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : prices?.compare?.allRows && prices.compare.allRows.length > 0 ? (
                                            <div className="space-y-6">
                                                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 overflow-hidden">
                                                    <div className="flex items-center justify-between mb-3 border-b border-emerald-200 dark:border-emerald-800/30 pb-2">
                                                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Compare Prices</h4>
                                                        {loadingPrices && (
                                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"/>
                                                                Gathering results...
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-emerald-100/50 dark:bg-emerald-900/20">
                                                                <tr>
                                                                    <th scope="col" className="px-4 py-3 rounded-tl-lg">Store</th>
                                                                    <th scope="col" className="px-4 py-3">Condition</th>
                                                                    <th scope="col" className="px-4 py-3">Price</th>
                                                                    <th scope="col" className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="relative">
                                                                <AnimatePresence>
                                                                    {[...(prices.compare.allRows)]
                                                                        .sort((a: Offer, b: Offer) => {
                                                                            const orderMap: Record<string, number> = { 'Found': 1, 'Loading': 2, 'Not Found': 3, 'Error': 4 };
                                                                            const aStatus = orderMap[a.status || 'Found'] || 5;
                                                                            const bStatus = orderMap[b.status || 'Found'] || 5;
                                                                            
                                                                            if (aStatus !== bStatus) return aStatus - bStatus;
                                                                            if ((a.status === 'Found' || !a.status) && (b.status === 'Found' || !b.status)) {
                                                                                return (a.price ?? 0) - (b.price ?? 0);
                                                                            }
                                                                            return 0;
                                                                        })
                                                                        .map((offer: Offer, idx: number) => {
                                                                            const isLoading = offer.status === 'Loading';
                                                                            const isFound  = offer.status === 'Found' || !offer.status;
                                                                            const isNotFound = offer.status === 'Not Found';
                                                                            const isError  = offer.status === 'Error';

                                                                            if (isLoading) {
                                                                                return (
                                                                                    <motion.tr 
                                                                                        key={`loading-${offer.store}-${idx}`}
                                                                                        layout
                                                                                        initial={{ opacity: 0 }}
                                                                                        animate={{ opacity: 1 }}
                                                                                        exit={{ opacity: 0 }}
                                                                                        className="border-b border-emerald-100 dark:border-emerald-800/30 last:border-0"
                                                                                    >
                                                                                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                                                            {offer.store}
                                                                                        </td>
                                                                                        <td className="px-4 py-3">
                                                                                            <div className="h-6 w-12 bg-emerald-200/50 dark:bg-emerald-800/30 rounded-full animate-pulse object-contain" />
                                                                                        </td>
                                                                                        <td className="px-4 py-3">
                                                                                            <div className="h-4 w-16 bg-emerald-200/50 dark:bg-emerald-800/30 rounded animate-pulse" />
                                                                                        </td>
                                                                                        <td className="px-4 py-3 flex justify-end">
                                                                                            <div className="h-7 w-14 bg-emerald-200/50 dark:bg-emerald-800/30 rounded-lg animate-pulse" />
                                                                                        </td>
                                                                                    </motion.tr>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <motion.tr 
                                                                                    key={`resolved-${offer.store}-${isFound ? offer.condition : offer.status}-${idx}`}
                                                                                    layout
                                                                                    initial={{ opacity: 0, backgroundColor: 'rgba(16, 185, 129, 0.4)' }}
                                                                                    animate={{ opacity: 1, backgroundColor: 'rgba(16, 185, 129, 0.0)' }}
                                                                                    transition={{ duration: 0.8 }}
                                                                                    className={`border-b border-emerald-100 dark:border-emerald-800/30 last:border-0 transition-colors ${isFound ? 'hover:bg-white dark:hover:bg-emerald-900/40' : 'opacity-70'}`}
                                                                                >
                                                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{offer.store}</td>
                                                                                    <td className="px-4 py-3">
                                                                                        {offer.condition ? (
                                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${offer.condition === 'New' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                                                                                                {offer.condition}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-4 py-3">
                                                                                        {isNotFound ? (
                                                                                            <span
                                                                                                className="flex flex-col cursor-help"
                                                                                                title="Scraper operational, item missing"
                                                                                            >
                                                                                                <span className="font-medium text-gray-400 dark:text-gray-500">Not Found</span>
                                                                                                <span className="text-xs text-gray-400 dark:text-gray-600 font-normal">Scraper operational, item missing</span>
                                                                                            </span>
                                                                                        ) : isError ? (
                                                                                            <span className="font-medium text-amber-500 dark:text-amber-400">
                                                                                                Webshop Server Error
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                                                {offer.price ? offer.price.toLocaleString('en-US') : '---'} {offer.currency}
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-right">
                                                                                        {offer.buyUrl ? (
                                                                                            <a href={offer.buyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-black hover:bg-gray-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-1 px-4 rounded-lg text-xs font-bold transition-all shadow-sm">
                                                                                                buy
                                                                                            </a>
                                                                                        ) : (
                                                                                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                                                                                        )}
                                                                                    </td>
                                                                                </motion.tr>
                                                                            );
                                                                        })}
                                                                </AnimatePresence>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}

                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookDetailsModal;
