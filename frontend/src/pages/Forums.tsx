import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Navigation from '../components/Navigation';
import LightRays from '../components/LightRays';
import CreateForumModal from '../components/CreateForumModal';
import ConfirmModal from '../components/ConfirmModal';

interface UserInfo {
    felhasznalonev: string;
    profilkep: string | null;
}

interface ForumPost {
    id: number;
    konyv_id: string;
    konyv_cim: string;
    konyv_boritokep: string | null;
    cim: string;
    tartalom: string;
    ertekeles: number;
    up_szavazatok: number;
    down_szavazatok: number;
    letrehozva: string;
    Felhasznalo: UserInfo;
    _count: {
        Hozzaszolasok: number;
    };
    reactionSummary?: Record<string, number>;
}

const Forums = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Deletion State
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteStep, setDeleteStep] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);
    const [userStr] = useState(localStorage.getItem('user'));
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/forums?search=${encodeURIComponent(search)}&skip=${skip}&take=10&sortBy=${sortBy}`);
                if (res.ok) {
                    const data = await res.json();
                    if (skip === 0) {
                        setPosts(data.posts);
                    } else {
                        setPosts(prev => [...prev, ...data.posts]);
                    }
                    setHasMore(data.hasMore);
                }
            } catch (err) {
                console.error("Failed to load forums", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchPosts();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, skip, sortBy, refreshTrigger]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setSkip(0);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value);
        setSkip(0);
    };

    const handleCreateClick = () => {
        if (!user) { navigate('/login'); } else { setIsCreateModalOpen(true); }
    };

    const handlePostCreated = () => {
        setSkip(0);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDeletePost = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/forums/posts/${deleteId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== deleteId));
                setDeleteId(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete post");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    return (
        <div className="relative min-h-screen bg-[#f2eadd] dark:bg-[#1a1a1c] transition-colors duration-500 overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LightRays
                    raysOrigin="top-center"
                    raysColor="#ffffff"
                    raysSpeed={1.5}
                    lightSpread={1.4}
                    rayLength={3}
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0}
                    distortion={0}
                    className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-40"
                />
            </div>
            
            <Navigation />

            <div className="relative z-10 max-w-5xl mx-auto px-4 pt-40 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight drop-shadow-md">Book Forums</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-base sm:text-lg">Join the discussion about your favorite books.</p>
                    </div>

                    <button 
                        onClick={handleCreateClick}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Start a Discussion
                    </button>
                </div>

                <div className="mb-10 w-full flex flex-col md:flex-row gap-4 items-center max-w-4xl mx-auto">
                    <div className="relative group flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-4 rounded-full bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all"
                            placeholder="Search discussions..."
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    
                    <div className="relative w-full md:w-auto shrink-0">
                        <select 
                            value={sortBy} 
                            onChange={handleSortChange}
                            className="w-full md:w-auto px-6 py-4 rounded-full bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/10 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all cursor-pointer appearance-none pr-12"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="popular">Most Upvoted</option>
                            <option value="downvoted">Most Downvoted</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {posts.length === 0 && !isLoading ? (
                        <div className="text-center py-20 bg-white/20 dark:bg-black/20 rounded-3xl backdrop-blur-sm border border-white/20 dark:border-white/5">
                            <p className="text-xl text-gray-600 dark:text-gray-400">No discussions found.</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div 
                                key={post.id}
                                onClick={() => navigate(`/forums/${post.id}`)}
                                className="group p-6 rounded-3xl bg-white/40 dark:bg-[#2A2B3D]/60 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all cursor-pointer hover:-translate-y-1 block"
                            >
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="sm:w-24 shrink-0 flex flex-col items-center gap-2">
                                        {post.konyv_boritokep ? (
                                            <img src={post.konyv_boritokep} alt={post.konyv_cim} className="w-24 h-36 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow" />
                                        ) : (
                                            <div className="w-24 h-36 bg-gray-300 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xs text-center p-2 text-gray-500">No Cover</div>
                                        )}
                                        
                                        {/* Score Indicator */}
                                        <div className={`mt-1 font-black text-lg ${post.up_szavazatok - post.down_szavazatok >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                           {post.up_szavazatok - post.down_szavazatok > 0 && "+"}
                                           {post.up_szavazatok - post.down_szavazatok}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate flex items-center gap-4">
                                                {post.cim}
                                                {user?.szerepkor === 'ADMIN' && (
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setDeleteId(post.id); 
                                                            setDeleteStep(1); 
                                                        }}
                                                        className="p-1 px-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
                                                        title="Admin Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </h2>
                                            <div className="flex text-yellow-400 shrink-0">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < post.ertekeles ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 mb-3">Discussing: {post.konyv_cim}</p>
                                        <p className="text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed text-sm sm:text-base">
                                            {post.tartalom}
                                        </p>
                                        
                                        {/* Reactions Summary */}
                                        {post.reactionSummary && Object.keys(post.reactionSummary).length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {Object.entries(post.reactionSummary).slice(0, 3).map(([emoji, count]) => (
                                                    <span key={emoji} className="px-2 py-1 rounded-full bg-white/50 dark:bg-black/20 text-xs font-bold flex items-center gap-1 border border-white/20">
                                                        <span>{emoji}</span>
                                                        <span className="text-gray-600 dark:text-gray-400">{count}</span>
                                                    </span>
                                                ))}
                                                {Object.keys(post.reactionSummary).length > 3 && (
                                                    <span className="text-[10px] text-gray-500 flex items-center">+{Object.keys(post.reactionSummary).length - 3} more</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-between text-[10px] sm:text-xs">
                                            <div className="flex items-center gap-2">
                                                <img src={post.Felhasznalo.profilkep || '/images/profile_icon.png'} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover" alt={post.Felhasznalo.felhasznalonev} referrerPolicy="no-referrer" />
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{post.Felhasznalo.felhasznalonev}</span>
                                                <span className="text-gray-500 dark:text-gray-500 mx-1">•</span>
                                                <span className="text-gray-500 dark:text-gray-400">{formatDate(post.letrehozva)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full shrink-0">
                                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                {post._count.Hozzaszolasok}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {hasMore && (
                    <div className="mt-10 flex justify-center">
                        <button
                            onClick={() => setSkip(prev => prev + 10)}
                            disabled={isLoading}
                            className="px-8 py-3 rounded-full bg-white/40 dark:bg-[#2A2B3D] border border-black/10 dark:border-white/10 font-bold text-gray-900 dark:text-white hover:bg-white/60 dark:hover:bg-[#333446] transition-colors flex items-center justify-center gap-2 backdrop-blur-md shadow-lg"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-gray-400 dark:border-white/20 border-t-gray-900 dark:border-t-white/80 rounded-full animate-spin"></span>
                            ) : "Load More Discussions"}
                        </button>
                    </div>
                )}
            </div>

            <CreateForumModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPostCreated={handlePostCreated}
            />

            <ConfirmModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeletePost}
                title="Delete Discussion"
                message={deleteStep === 1 
                    ? "Are you sure you want to delete this discussion? This action is permanent." 
                    : "Final warning: This cannot be undone. All comments and votes will be lost."}
                type="danger"
                steps={2}
                currentStep={deleteStep}
                onStepConfirm={() => setDeleteStep(2)}
                confirmText={isDeleting ? "Deleting..." : "Delete Permanently"}
            />
        </div>
    );
};

export default Forums;
