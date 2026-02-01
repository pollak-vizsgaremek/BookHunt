import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import Navigation from '../components/Navigation';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="flex min-h-screen items-center justify-center pt-20 p-4">
                {/* might look a bit off center but who chairs */}
                <div
                    className="relative w-full max-w-lg aspect-3/4 bg-cover bg-center bg-no-repeat rounded-r-3xl shadow-2xl flex flex-col items-center justify-center py-12 pl-12 pr-20 sm:py-20 sm:pl-20 sm:pr-32"
                    style={{ backgroundImage: "url('/images/book_cover.png')" }}
                >
                    <div className="w-full max-w-xs space-y-4">
                        <h2 className="text-3xl font-serif font-bold text-center text-[#DFE6E6] mb-4 tracking-wider drop-shadow-md">
                            Register
                        </h2>

                        {error && (
                            <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded backdrop-blur-sm text-sm text-center" role="alert">
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#DFE6E6]/10 border border-[#DFE6E6]/20 rounded-lg text-[#DFE6E6] placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-[#DFE6E6]/50 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="Choose a username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#DFE6E6]/10 border border-[#DFE6E6]/20 rounded-lg text-[#DFE6E6] placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-[#DFE6E6]/50 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[#DFE6E6]/80 text-sm font-medium ml-1" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full px-4 py-2.5 bg-[#DFE6E6]/10 border border-[#DFE6E6]/20 rounded-lg text-[#DFE6E6] placeholder-[#DFE6E6]/40 focus:outline-none focus:ring-2 focus:ring-[#DFE6E6]/50 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-[#DFE6E6] hover:bg-white text-[#333446] font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    Register
                                </button>
                            </div>
                        </form>

                        <p className="mt-4 text-center text-sm text-[#DFE6E6]/60">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#DFE6E6] hover:text-white font-semibold hover:underline decoration-2 underline-offset-4 transition-colors">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
