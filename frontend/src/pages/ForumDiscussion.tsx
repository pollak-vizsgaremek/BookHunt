import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import Navigation from '../components/Navigation';
import LightRays from '../components/LightRays';
import ConfirmModal from '../components/ConfirmModal';
import MeatballsMenu from '../components/MeatballsMenu';
import ReportModal from '../components/ReportModal';

interface UserInfo {
    felhasznalonev: string;
    profilkep: string | null;
}

interface ForumComment {
    id: number;
    letrehozva: string;
    tartalom: string;
    felhasznalo_id: number;
    Felhasznalo: UserInfo;
    Reakciok: ForumReakcio[];
}

interface ForumSzavazat {
    felhasznalo_id: number;
    ertek: number;
}

interface ForumReakcio {
    felhasznalo_id: number;
    emoji: string;
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
    Hozzaszolasok: ForumComment[];
    Szavazatok: ForumSzavazat[];
    Reakciok: ForumReakcio[];
}

const ALLOWED_EMOJIS = ["❤️", "👍", "🤣", "😭", "😠", "😊"];

const ForumDiscussion = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<ForumPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [commentContent, setCommentContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Deletion Modal State
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'post' | 'comment', id: number } | null>(null);
    const [deleteStep, setDeleteStep] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reporting State
    const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment', id: number } | null>(null);

    const [userStr] = useState(localStorage.getItem('user'));
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        const fetchPost = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/forums/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPost(data);
                } else if (res.status === 404) {
                    navigate('/forums', { replace: true });
                }
            } catch (err) {
                console.error("Failed to load forum post", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchPost();
    }, [id, navigate]);

    const handleVote = async (ertek: number) => {
        if (!user) return navigate('/login');
        
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/forums/${id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ertek })
            });
            if (res.ok) {
                const updated = await res.json();
                setPost(prev => prev ? { 
                    ...prev, 
                    up_szavazatok: updated.up_szavazatok, 
                    down_szavazatok: updated.down_szavazatok,
                    Szavazatok: prev.Szavazatok.filter(s => s.felhasznalo_id !== user.id).concat(
                        (prev.Szavazatok.find(s => s.felhasznalo_id === user.id)?.ertek === ertek) ? [] : [{ felhasznalo_id: user.id, ertek }]
                    )
                } : null);
            }
        } catch (err) { console.error("Vote failed", err); }
    };

    const handleReact = async (emoji: string) => {
        if (!user) return navigate('/login');
        
        const myReactions = post?.Reakciok.filter(r => r.felhasznalo_id === user.id) || [];
        const alreadyHasEmoji = myReactions.some(r => r.emoji === emoji);
        if (!alreadyHasEmoji && myReactions.length >= 3) {
            setActionError("You can only have up to 3 different reactions per post.");
            setTimeout(() => setActionError(""), 3000);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/forums/${id}/react`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ emoji })
            });
            if (res.ok) {
                const updatedReactions = await res.json();
                setPost(prev => prev ? { ...prev, Reakciok: updatedReactions } : null);
            } else {
                const data = await res.json();
                setActionError(data.error);
                setTimeout(() => setActionError(""), 3000);
            }
        } catch (err) { console.error("Reaction failed", err); }
    };

    const handleCommentReact = async (commentId: number, emoji: string) => {
        if (!user) return navigate('/login');
        
        const comment = post?.Hozzaszolasok.find(c => c.id === commentId);
        if (!comment) return;

        const myCommentReactions = comment.Reakciok.filter(r => r.felhasznalo_id === user.id) || [];
        const alreadyHasEmoji = myCommentReactions.some(r => r.emoji === emoji);
        
        if (!alreadyHasEmoji && myCommentReactions.length >= 3) {
            setActionError("Up to 3 reactions per comment.");
            setTimeout(() => setActionError(""), 3000);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/forums/comments/${commentId}/react`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ emoji })
            });
            if (res.ok) {
                const updatedReactions = await res.json();
                setPost(prev => prev ? {
                    ...prev,
                    Hozzaszolasok: prev.Hozzaszolasok.map(c => 
                        c.id === commentId ? { ...c, Reakciok: updatedReactions } : c
                    )
                } : null);
            }
        } catch (err) { console.error("Comment reaction failed", err); }
    };

    const handleCommentSubmit = async () => {
        if (!user) return navigate('/login');
        if (!commentContent.trim()) { setActionError("Comment cannot be empty."); return; }

        setIsSubmitting(true);
        setActionError("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/forums/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ tartalom: commentContent })
            });
            if (res.ok) {
                const newComment = await res.json();
                setPost(prev => prev ? { ...prev, Hozzaszolasok: [...prev.Hozzaszolasok, newComment] } : null);
                setCommentContent("");
                setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (err: any) { setActionError(err.message); } finally { setIsSubmitting(false); }
    };

    const handleDeleteAction = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/forums/${deleteTarget.type}s/${deleteTarget.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (res.ok) {
                if (deleteTarget.type === 'post') {
                    navigate('/forums');
                } else {
                    setPost(prev => prev ? {
                        ...prev,
                        Hozzaszolasok: prev.Hozzaszolasok.filter(c => c.id !== deleteTarget.id)
                    } : null);
                    setDeleteTarget(null);
                }
            } else {
                const data = await res.json();
                alert(data.error || "Deletion failed");
            }
        } catch (err) {
            console.error("Delete error", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f2eadd] dark:bg-[#1a1a1c] flex flex-col pt-32 items-center">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) return null;

    const myVote = post.Szavazatok.find(s => s.felhasznalo_id === user?.id)?.ertek;
    const myReactions = post.Reakciok.filter(r => r.felhasznalo_id === user?.id).map(r => r.emoji);
    
    const reactionTotals = post.Reakciok.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="relative min-h-screen bg-[#f2eadd] dark:bg-[#1a1a1c] transition-colors duration-500">
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
                    className="absolute inset-0 z-0 opacity-20 dark:opacity-30"
                />
            </div>
            
            <Navigation />

            <main className="relative z-10 max-w-4xl mx-auto px-4 pt-32 pb-32">
                <button
                    onClick={() => navigate('/forums')}
                    className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Forums
                </button>

                {/* Original Post */}
                <article className="p-4 sm:p-8 rounded-4xl bg-white/40 dark:bg-[#2A2B3D]/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] mb-8">
                    <div className="flex gap-4 sm:gap-8">
                        {/* Vote Sidebar */}
                        <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                            <button 
                                onClick={() => handleVote(1)}
                                className={`p-1.5 rounded-lg transition-all ${myVote === 1 ? 'text-emerald-500 bg-emerald-500/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5'}`}
                            >
                                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            </button>
                            <span className={`font-black text-lg sm:text-xl ${post.up_szavazatok - post.down_szavazatok >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {post.up_szavazatok - post.down_szavazatok}
                            </span>
                            <button 
                                onClick={() => handleVote(-1)}
                                className={`p-1.5 rounded-lg transition-all ${myVote === -1 ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/5'}`}
                            >
                                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row gap-6 mb-6">
                                <div className="sm:w-24 shrink-0 flex justify-center sm:justify-start">
                                    {post.konyv_boritokep ? (
                                        <img src={post.konyv_boritokep} alt={post.konyv_cim} className="w-24 h-36 object-cover rounded-xl shadow-lg ring-1 ring-black/5" />
                                    ) : (
                                        <div className="w-24 h-36 bg-gray-300 dark:bg-gray-700 rounded-xl shadow-lg flex items-center justify-center text-gray-500 text-sm">No Cover</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={post.Felhasznalo.profilkep || '/images/profile_icon.png'} className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20" alt={post.Felhasznalo.felhasznalonev} referrerPolicy="no-referrer" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{post.Felhasznalo.felhasznalonev}</div>
                                                <div className="flex items-center gap-1">
                                                    {user?.szerepkor === 'ADMIN' && (
                                                        <button 
                                                            onClick={() => { setDeleteTarget({ type: 'post', id: post.id }); setDeleteStep(1); }}
                                                            className="p-1.5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                                            title="Delete Post (Admin)"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                    <MeatballsMenu 
                                                        items={[
                                                            {
                                                                label: "Report Post",
                                                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
                                                                onClick: () => setReportTarget({ type: 'post', id: post.id }),
                                                                variant: "danger"
                                                            }
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{formatDate(post.letrehozva)}</div>
                                        </div>
                                    </div>
                                    <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 leading-tight">{post.cim}</h1>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-3 text-xs sm:text-sm">Discussing: {post.konyv_cim}</p>
                                    <div className="flex text-yellow-400 mb-4 drop-shadow-sm">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-5 h-5 ${i < post.ertekeles ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                    <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
                                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.tartalom}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Reaction Board */}
                            <div className="border-t border-black/5 dark:border-white/5 pt-6 mt-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Reactions:</span>
                                    {ALLOWED_EMOJIS.map(emoji => {
                                        const count = reactionTotals[emoji] || 0;
                                        const isActive = myReactions.includes(emoji);
                                        return (
                                            <button 
                                                key={emoji}
                                                onClick={() => handleReact(emoji)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-500/20' : 'bg-white/20 dark:bg-white/5 border-transparent hover:border-white/30'}`}
                                            >
                                                <span className="text-xl">{emoji}</span>
                                                {count > 0 && <span className={`text-sm font-black ${isActive ? 'text-emerald-500' : 'text-gray-600 dark:text-gray-400'}`}>{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {actionError && <p className="text-red-500 text-xs font-bold mt-3 animate-pulse">⚠️ {actionError}</p>}
                            </div>
                        </div>
                    </div>
                </article>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider pl-2 border-l-4 border-emerald-500">
                    Comments ({post.Hozzaszolasok.length})
                </h3>

                <div className="space-y-4 mb-10 text-sm sm:text-base">
                    {post.Hozzaszolasok.length === 0 ? (
                        <div className="text-center py-10 opacity-70 text-gray-600 dark:text-gray-400 italic font-medium">Be the first to share your thoughts!</div>
                    ) : (
                        post.Hozzaszolasok.map(comment => (
                            <div key={comment.id} className="p-5 rounded-2xl bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-black/5 dark:border-white/5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <img src={comment.Felhasznalo.profilkep || '/images/profile_icon.png'} className="w-8 h-8 rounded-full object-cover" alt={comment.Felhasznalo.felhasznalonev} referrerPolicy="no-referrer" />
                                        <span className="font-bold text-gray-900 dark:text-gray-100">{comment.Felhasznalo.felhasznalonev}</span>
                                        <div className="flex items-center gap-1 ml-1">
                                            {(user?.id === comment.felhasznalo_id || user?.szerepkor === 'ADMIN') && (
                                                <button 
                                                    onClick={() => { setDeleteTarget({ type: 'comment', id: comment.id }); setDeleteStep(1); }}
                                                    className="p-1.5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                                    title="Delete Comment"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                            <MeatballsMenu 
                                                items={[
                                                    ...ALLOWED_EMOJIS.map(emoji => ({
                                                        label: `React ${emoji}`,
                                                        icon: <span className="text-lg">{emoji}</span>,
                                                        onClick: () => handleCommentReact(comment.id, emoji)
                                                    })),
                                                    {
                                                        label: "Report Comment",
                                                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
                                                        onClick: () => setReportTarget({ type: 'comment', id: comment.id }),
                                                        variant: "danger" as const
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-500/80 dark:text-gray-500">{formatDate(comment.letrehozva)}</span>
                                </div>
                                <p className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pl-11 mb-3">{comment.tartalom}</p>
                                
                                {/* Comment Reactions Display */}
                                {comment.Reakciok && comment.Reakciok.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pl-11 mb-2">
                                        {Object.entries(
                                            comment.Reakciok.reduce((acc, r) => {
                                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([emoji, count]) => {
                                            const isActive = comment.Reakciok.some(r => r.felhasznalo_id === user?.id && r.emoji === emoji);
                                            return (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleCommentReact(comment.id, emoji)}
                                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-black transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-500'}`}
                                                >
                                                    <span>{emoji}</span>
                                                    <span>{count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                <div className="p-6 rounded-4xl bg-white/60 dark:bg-[#2A2B3D]/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add a Comment</h3>
                    {!user ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">You must be logged in to participate in the discussion.</p>
                            <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95">Login to Comment</button>
                        </div>
                    ) : (
                        <div>
                            <textarea
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="What are your thoughts on this?"
                                rows={4}
                                className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-900 dark:text-white placeholder-gray-500 transition-all resize-none mb-4"
                            />
                            <div className="flex justify-end">
                                <button onClick={handleCommentSubmit} disabled={isSubmitting || !commentContent.trim()} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white rounded-full font-bold shadow-lg shadow-emerald-500/30 disabled:shadow-none transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed">
                                    {isSubmitting ? "Posting..." : "Post Comment"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal 
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteAction}
                title={deleteTarget?.type === 'post' ? "Delete Discussion" : "Delete Comment"}
                message={
                    user?.szerepkor === 'ADMIN' && deleteStep === 1
                    ? `Are you sure you want to remove this ${deleteTarget?.type}? This action is permanent.`
                    : user?.szerepkor === 'ADMIN' && deleteStep === 2
                    ? `Final warning: This cannot be undone. All data associated with this ${deleteTarget?.type} will be lost.`
                    : `Are you sure you want to delete your comment?`
                }
                type="danger"
                steps={user?.szerepkor === 'ADMIN' ? 2 : 1}
                currentStep={deleteStep}
                onStepConfirm={() => setDeleteStep(2)}
                confirmText={isDeleting ? "Deleting..." : "Delete Permanently"}
            />

            <ReportModal 
                isOpen={!!reportTarget} 
                onClose={() => setReportTarget(null)} 
                targetId={reportTarget?.id || 0}
                targetType={reportTarget?.type || 'post'}
            />
        </div>
    );
};

export default ForumDiscussion;
