import { useState } from 'react';
import Navigation from '../components/Navigation';

const Profile = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');

    // Passwords
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState({ text: '', type: '' });

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
                // Update navigation by triggering a storage event
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
            <div className="min-h-screen bg-[#333446]">
                <Navigation />
                <div className="flex justify-center items-center h-screen px-4">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-[#DFE6E6]">You are not logged in</h2>
                        <p className="text-[#DFE6E6]/60">Please sign in to view and edit your profile.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#333446]">
            <Navigation />

            <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#DFE6E6] drop-shadow-lg tracking-tight mb-4">
                        Account Settings
                    </h1>
                    <p className="text-lg text-[#DFE6E6]/60">
                        Manage your profile details and security preferences.
                    </p>
                </div>

                {message.text && (
                    <div className={`mb-8 p-4 rounded-xl text-center backdrop-blur-sm border ${message.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' :
                            message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-200' :
                                'bg-blue-500/20 border-blue-500/50 text-blue-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    {/* General Info Form */}
                    <div className="bg-[#2A2B3D] border border-white/5 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/10">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">General Info</h2>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:-translate-y-0.5 transition-all mt-4"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>

                    {/* Security Form */}
                    <div className="bg-[#2A2B3D] border border-white/5 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/10">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Security</h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-0.5 transition-all mt-4"
                            >
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
