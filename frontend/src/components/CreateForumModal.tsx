import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BookItem {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    isbn: string | null;
}

interface CreateForumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

const CreateForumModal = ({ isOpen, onClose, onPostCreated }: CreateForumModalProps) => {
    const [step, setStep] = useState<1 | 2>(1); // 1: Select Book, 2: Write Post
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<BookItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const searchTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setStep(1);
            setSearchQuery("");
            setSearchResults([]);
            setSelectedBook(null);
            setTitle("");
            setContent("");
            setRating(0);
            setError("");
        }
    }, [isOpen]);

    useEffect(() => {
        if (step !== 1) return;
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        
        searchTimerRef.current = window.setTimeout(async () => {
            setIsSearching(true);
            try {
                const url = `/api/books/search?maxResults=10&q=${encodeURIComponent(searchQuery)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults((data.books || []).map((b: any) => ({
                        id: b.googleId,
                        title: b.title,
                        author: b.authors ? b.authors.join(', ') : 'Unknown',
                        coverUrl: b.thumbnail ? b.thumbnail.replace('http:', 'https:') : null,
                        isbn: b.isbn || null
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch books", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchQuery, step]);

    const handleSubmit = async () => {
        if (!selectedBook) return setError("Please select a book.");
        if (!title.trim() || !content.trim()) return setError("Title and content are required.");
        if (rating < 1 || rating > 5) return setError("Please select a rating between 1 and 5.");

        setIsSubmitting(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/forums", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    konyv_id: selectedBook.id,
                    konyv_cim: selectedBook.title,
                    konyv_boritokep: selectedBook.coverUrl,
                    cim: title,
                    tartalom: content,
                    ertekeles: rating
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create post");
            }

            onPostCreated();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#f2eadd] dark:bg-[#232327] rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-white/30 dark:bg-black/20">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {step === 1 ? "Select a Book" : "Create Discussion"}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {step === 1 ? "Which book do you want to talk about?" : `Discussing: ${selectedBook?.title}`}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-500/30">
                                    {error}
                                </div>
                            )}

                            {step === 1 ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Search for a book by title or author..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/30 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-900 dark:text-white placeholder-gray-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />

                                    {isSearching && <div className="text-center py-4 text-gray-500">Searching...</div>}
                                    
                                    {!isSearching && searchResults.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                            {searchResults.map(book => (
                                                <div
                                                    key={book.id}
                                                    onClick={() => setSelectedBook(book)}
                                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${selectedBook?.id === book.id ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/20 dark:bg-white/5 border-transparent hover:bg-white/40 dark:hover:bg-white/10'}`}
                                                >
                                                    {book.coverUrl ? (
                                                        <img src={book.coverUrl} className="w-12 h-16 object-cover rounded shadow" alt={book.title} />
                                                    ) : (
                                                        <div className="w-12 h-16 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-center p-1">No Cover</div>
                                                    )}
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{book.title}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title your discussion</label>
                                        <input
                                            type="text"
                                            placeholder="What's on your mind?"
                                            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/30 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-900 dark:text-white transition-all"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Rate the book</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <svg 
                                                        className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-300 dark:text-gray-600'}`} 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Thoughts</label>
                                        <textarea
                                            placeholder="Write your discussion here..."
                                            rows={6}
                                            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/30 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-900 dark:text-white transition-all resize-none"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 bg-white/20 dark:bg-black/10">
                            {step === 1 ? (
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedBook}
                                    className={`px-6 py-2.5 rounded-xl font-bold transition-all ${selectedBook ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                >
                                    Next: Write Post
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all ${isSubmitting ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'}`}
                                    >
                                        {isSubmitting ? "Posting..." : "Post Discussion"}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateForumModal;
