import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';

import Navigation from '../components/Navigation';
import { usePageTitle } from '../utils/usePageTitle';
import SpotlightCard from '../components/SpotlightCard';
import StarBorder from '../components/StarBorder';
import SplitText from '../components/SplitText';
import LightRays from '../components/LightRays';

const RegisterPage = () => {
    usePageTitle('Register');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Successfully registered, navigate to login without auto-login
            navigate('/login');
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setError('Unable to connect to the server. Please try again later.');
            } else {
                setError(err.message);
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Google signup failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setError('Unable to connect to the server. Please try again later.');
            } else {
                setError(err.message);
            }
        }
    };

    const handleGoogleError = () => {
        setError('Google sign up failed. Please try again.');
    };

    return (
        <div className="relative min-h-screen bg-[#f2eadd] dark:bg-[#232327] transition-colors duration-500 overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LightRays
                    raysOrigin="top-center"
                    raysColor="#ffffff"
                    raysSpeed={1}
                    lightSpread={1.4}
                    rayLength={3}
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0}
                    distortion={0}
                    className="absolute inset-0 z-0 pointer-events-none"
                />
            </div>
            <Navigation />
            <div className="relative z-10 flex min-h-screen items-center justify-center pt-20 p-4">
                <SpotlightCard
                    className="w-full max-w-lg aspect-3/4 bg-cover bg-center bg-no-repeat rounded-r-3xl shadow-2xl flex flex-col items-center justify-center py-12 pl-12 pr-20 sm:py-20 sm:pl-20 sm:pr-32"
                    style={{ backgroundImage: "url('/images/book_cover.png')" }}
                >
                    <div className="w-full max-w-xs space-y-4 relative z-10">
                        <SplitText
                            text="Register"
                            className="text-3xl font-bold text-center text-gray-900 dark:text-[#DFE6E6] mb-4 tracking-wider drop-shadow-md transition-colors"
                            tag="h2"
                            delay={100}
                        />

                        {user ? (
                            <div className="text-center space-y-8 bg-white/40 dark:bg-black/40 p-8 rounded-2xl backdrop-blur-md border border-black/10 dark:border-white/10 shadow-xl mt-6 transition-colors">
                                <div>
                                    <p className="text-gray-600 dark:text-[#DFE6E6]/60 text-sm uppercase tracking-widest mb-2 transition-colors">Welcome Back</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{user.username}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-gray-800 dark:text-[#DFE6E6]/80 text-sm leading-relaxed transition-colors">
                                        You are already logged into BookHunt. Ready to discover your next adventure?
                                    </p>
                                    <StarBorder as="button" type="button" onClick={handleLogout} className="w-full mt-4 font-bold tracking-wide">
                                        Sign Out
                                    </StarBorder>
                                </div>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded backdrop-blur-sm text-sm text-center" role="alert">
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4 relative z-30">
                                    <div className="space-y-1">
                                        <label className="block text-gray-800 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1 transition-colors" htmlFor="username">
                                            Username
                                        </label>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-[#DFE6E6]/10 border border-gray-300 dark:border-[#DFE6E6]/20 rounded-lg text-gray-900 dark:text-[#DFE6E6] placeholder-gray-500 dark:placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-[#DFE6E6]/50 focus:border-transparent transition-all backdrop-blur-sm"
                                            placeholder="Choose a username"
                                            value={formData.username}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-gray-800 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1 transition-colors" htmlFor="email">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-[#DFE6E6]/10 border border-gray-300 dark:border-[#DFE6E6]/20 rounded-lg text-gray-900 dark:text-[#DFE6E6] placeholder-gray-500 dark:placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-[#DFE6E6]/50 focus:border-transparent transition-all backdrop-blur-sm"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-gray-800 dark:text-[#DFE6E6]/80 text-sm font-medium ml-1 transition-colors" htmlFor="password">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-[#DFE6E6]/10 border border-gray-300 dark:border-[#DFE6E6]/20 rounded-lg text-gray-900 dark:text-[#DFE6E6] placeholder-gray-500 dark:placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-[#DFE6E6]/50 focus:border-transparent transition-all backdrop-blur-sm"
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-center">
                                        <StarBorder
                                            as="button"
                                            type="submit"
                                            color="#60a5fa"
                                            className="w-full font-bold tracking-wide"
                                        >
                                            Register
                                        </StarBorder>
                                    </div>

                                    <div className="flex items-center justify-center space-x-2 my-4">
                                        <hr className="w-full border-gray-300 dark:border-[#DFE6E6]/20" />
                                        <span className="text-gray-500 dark:text-[#DFE6E6]/60 text-sm px-2">or</span>
                                        <hr className="w-full border-gray-300 dark:border-[#DFE6E6]/20" />
                                    </div>

                                    <div className="flex justify-center mt-4 pb-4">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={handleGoogleError}
                                            theme="filled_black"
                                            text="signup_with"
                                            shape="circle"
                                        />
                                    </div>
                                </form>

                                <p className="mt-4 text-center text-sm text-gray-600 dark:text-[#DFE6E6]/60 relative z-30 transition-colors">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-gray-900 dark:text-[#DFE6E6] hover:text-blue-600 dark:hover:text-white font-semibold hover:underline decoration-2 underline-offset-4 transition-colors">
                                        Login here
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </SpotlightCard>
            </div>
        </div>
    );
};

export default RegisterPage;
