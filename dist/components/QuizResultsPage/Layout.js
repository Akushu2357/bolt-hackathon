import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, MessageCircle, FileQuestion, User, LogOut, Brain, Menu, X, LogIn } from 'lucide-react';
export default function Layout({ children }) {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);
    const handleSignOut = async () => {
        await signOut();
        navigate('/home'); // Redirect to home instead of auth after logout
    };
    const navigation = [
        { name: 'Home', href: '/home', icon: Home },
        { name: 'Chat', href: '/chat', icon: MessageCircle },
        { name: 'Quiz', href: '/quiz', icon: FileQuestion },
    ];
    const isActive = (path) => location.pathname === path;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("header", { className: "bg-white shadow-sm border-b border-gray-200", children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center", children: _jsxs(Link, { to: "/home", className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 gradient-bg rounded-lg flex items-center justify-center", children: _jsx(Brain, { className: "w-5 h-5 text-white" }) }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: "TutorAI" })] }) }), _jsx("nav", { className: "hidden md:flex space-x-8", children: navigation.map((item) => {
                                        const Icon = item.icon;
                                        return (_jsxs(Link, { to: item.href, className: `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive(item.href)
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { children: item.name })] }, item.name));
                                    }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [user ? (
                                        // Authenticated user menu
                                        _jsx("div", { className: "hidden md:flex items-center space-x-3", children: _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowProfileMenu(!showProfileMenu), className: "w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors duration-200", children: _jsx(User, { className: "w-4 h-4 text-primary-600" }) }), showProfileMenu && (_jsxs("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50", children: [_jsx("div", { className: "px-4 py-2 border-b border-gray-100", children: _jsx("p", { className: "text-sm text-gray-600 truncate", children: user?.email }) }), _jsxs(Link, { to: "/profile", onClick: () => setShowProfileMenu(false), className: "flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: "Profile" })] }), _jsxs("button", { onClick: handleSignOut, className: "flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left", children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { children: "Sign Out" })] })] }))] }) })) : (
                                        // Guest user menu
                                        _jsx("div", { className: "hidden md:flex items-center space-x-3", children: _jsxs("button", { onClick: () => navigate('/auth'), className: "flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200", children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { children: "Login" })] }) })), _jsx("button", { onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), className: "md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50", children: isMobileMenuOpen ? (_jsx(X, { className: "w-5 h-5" })) : (_jsx(Menu, { className: "w-5 h-5" })) })] })] }) }), isMobileMenuOpen && (_jsx("div", { className: "md:hidden border-t border-gray-200 bg-white", children: _jsxs("div", { className: "px-4 py-3 space-y-1", children: [navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (_jsxs(Link, { to: item.href, onClick: () => setIsMobileMenuOpen(false), className: `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive(item.href)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { children: item.name })] }, item.name));
                                }), _jsx("div", { className: "border-t border-gray-200 pt-3 mt-3", children: user ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "px-3 py-2 text-sm text-gray-600", children: user?.email }), _jsxs(Link, { to: "/profile", onClick: () => setIsMobileMenuOpen(false), className: "flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: "Profile" })] }), _jsxs("button", { onClick: () => {
                                                    handleSignOut();
                                                    setIsMobileMenuOpen(false);
                                                }, className: "flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full", children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { children: "Sign Out" })] })] })) : (_jsxs("button", { onClick: () => {
                                            navigate('/auth');
                                            setIsMobileMenuOpen(false);
                                        }, className: "flex items-center space-x-3 px-3 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 w-full", children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { children: "Login" })] })) })] }) }))] }), showProfileMenu && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setShowProfileMenu(false) })), _jsx("main", { className: "flex-1", children: children })] }));
}
