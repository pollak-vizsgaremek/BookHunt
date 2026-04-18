import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any; // Using any for now based on existing user object structure
}

const ProfileModal = ({ isOpen, onClose, user }: ProfileModalProps) => {
    const navigate = useNavigate();
    const [bookmarksCount, setBookmarksCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!isOpen || !user) return;

            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/favorites', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setBookmarksCount(data.length);
                }
            } catch (error) {
                console.error("Failed to fetch bookmarks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, [isOpen, user]);

    // Handle logout directly from modal for convenience
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onClose();
        navigate('/login');
    };

    const handleEditProfile = () => {
        onClose();
        navigate('/profile');
    };

    if (!user) return null;

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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed top-24 right-6 w-80 bg-white dark:bg-[#2A2B3D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden transition-colors"
                    >
                        {/* Header Banner */}
                        <div className="h-24 bg-linear-to-r from-blue-600/40 to-purple-600/40 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="px-6 pb-6 relative">
                            {/* Avatar pushing up into banner */}
                            <div className="absolute -top-12 left-6">
                                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#2A2B3D] overflow-hidden bg-gray-100 dark:bg-[#333446] transition-colors">
                                    <img
                                        src={user.profilkep || "/images/profile_icon.png"}
                                        alt="Profile Avatar"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            // Fallback if image fails
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.username || user.felhasznalonev}&background=random`;
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="pt-14 space-y-1">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide transition-colors">{user.username}</h3>
                                <p className="text-sm text-gray-600 dark:text-white/50 transition-colors">{user.email}</p>
                            </div>

                            {/* Stats */}
                            <div className="mt-6 flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-white/50 uppercase tracking-wider transition-colors">Bookmarks</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white flex items-baseline gap-2 transition-colors">
                                        {loading ? (
                                            <span className="w-6 h-6 border-2 border-gray-400 dark:border-white/20 border-t-gray-900 dark:border-t-white/80 rounded-full animate-spin"></span>
                                        ) : (
                                            bookmarksCount
                                        )}
                                        <span className="text-sm font-normal text-gray-500 dark:text-white/40 transition-colors">books</span>
                                    </span>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={handleEditProfile}
                                    className="w-full py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-900 dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Edit Profile
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
