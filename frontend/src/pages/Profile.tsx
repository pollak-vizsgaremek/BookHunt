import { useState, useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import { usePageTitle } from '../utils/usePageTitle';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    usePageTitle('Profile');
    
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState(() => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    });

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');

    // Passwords
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState({ text: '', type: '' });
    const [uploading, setUploading] = useState(false);
    
    // Confirmation settings
    const [showConfirmCheckbox, setShowConfirmCheckbox] = useState(() => {
        return localStorage.getItem('skipPfpConfirm') !== 'true';
    });
    const [skipNextTime, setSkipNextTime] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'upload-pfp') {
            setTimeout(() => {
                fileInputRef.current?.click();
            }, 100);
            navigate('/profile', { replace: true });
        }
    }, [location.search, navigate]);

    const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (showConfirmCheckbox) {
            setPendingFile(file);
            return;
        }

        await uploadPfp(file);
    };

    const uploadPfp = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/profile-picture', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const updatedUser = { ...user, profilkep: data.profilkep };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                window.dispatchEvent(new Event('storage'));
                setMessage({ text: 'Profile picture updated!', type: 'success' });
            } else {
                const data = await res.json();
                setMessage({ text: data.error || 'Upload failed', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Error uploading image', type: 'error' });
        } finally {
            setUploading(false);
            setPendingFile(null);
            if (skipNextTime) {
                localStorage.setItem('skipPfpConfirm', 'true');
                setShowConfirmCheckbox(false);
            }
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: 'Updating profile...', type: 'info' });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ username, email })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
                window.dispatchEvent(new Event('storage'));
                setMessage({ text: 'Profile updated successfully!', type: 'success' });
            } else {
                setMessage({ text: data.error || 'Failed to update profile.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'An error occurred during profile update.', type: 'error' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match.', type: 'error' });
            return;
        }

        setMessage({ text: 'Updating password...', type: 'info' });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ text: 'Password updated successfully!', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ text: data.error || 'Failed to update password.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'An error occurred during password update.', type: 'error' });
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#333446] transition-colors">
                <Navigation />
                <div className="flex justify-center items-center h-screen px-4">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#DFE6E6]">You are not logged in</h2>
                        <p className="text-gray-600 dark:text-[#DFE6E6]/60">Please sign in to view and edit your profile.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#333446] transition-colors">
            <Navigation />

            <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-[#DFE6E6] drop-shadow-lg tracking-tight mb-4">
                        Account Settings
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-[#DFE6E6]/60">
                        Manage your profile details and security preferences.
                    </p>
                </div>

                {message.text && (
                    <div className={`mb-8 p-4 rounded-xl text-center backdrop-blur-sm border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-200' :
                            message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-200' :
                                'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* PFP Sidebar Card */}
                    <div className="lg:col-span-4 bg-white dark:bg-[#2A2B3D] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl transition-colors flex flex-col items-center text-center lg:sticky lg:top-32">
                        <div className="relative group/pfp-main mb-6">
                            <div className="w-48 h-48 rounded-full border-8 border-gray-50 dark:border-[#333446] overflow-hidden shadow-2xl relative">
                                <img
                                    src={user.profilkep || "/images/profile_icon.png"}
                                    alt="Large Profile"
                                    className={`w-full h-full object-cover transition-all duration-500 ${uploading ? 'opacity-50 scale-110 blur-sm' : 'opacity-100'}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.username || user.felhasznalonev}&background=random`;
                                    }}
                                />
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-xl transform transition-all hover:scale-110 active:scale-95 group-hover/pfp-main:rotate-12"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handlePfpChange} className="hidden" accept="image/*" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user.username}</h2>
                        <span className="px-4 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest">
                            {user.szerepkor || 'Member'}
                        </span>
                        
                        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Represent yourself across BookHunt by uploading a custom profile picture.
                        </p>
                    </div>

                    {/* Main Forms */}
                    <div className="lg:col-span-8 grid grid-cols-1 gap-8">
                        {/* General Info Form */}
                        <div className="bg-white dark:bg-[#2A2B3D] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl transition-colors">
                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100 dark:border-white/10">
                                <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">General Info</h2>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-gray-700 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-gray-700 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/10 dark:shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:-translate-y-0.5 transition-all mt-4"
                                >
                                    Save Changes
                                </button>
                            </form>
                        </div>

                        {/* Security Form */}
                        <div className="bg-white dark:bg-[#2A2B3D] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl transition-colors">
                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100 dark:border-white/10">
                                <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h2>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-gray-700 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-gray-700 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-gray-700 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/10 dark:shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-0.5 transition-all mt-4"
                                >
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {pendingFile && (
                    <div className="fixed inset-0 flex items-center justify-center z-100 px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setPendingFile(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#1E1F2E] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Update Profile Picture?</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">Are you sure you want to change your profile picture to <span className="font-semibold text-emerald-500">{pendingFile.name}</span>?</p>
                            
                            <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <input 
                                    type="checkbox" 
                                    id="dont-show" 
                                    checked={skipNextTime}
                                    onChange={(e) => setSkipNextTime(e.target.checked)}
                                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                                />
                                <label htmlFor="dont-show" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                    Don't ask me again
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setPendingFile(null)}
                                    className="py-3 px-6 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => uploadPfp(pendingFile)}
                                    className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    Upload
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
