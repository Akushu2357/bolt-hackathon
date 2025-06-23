import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, signUp } = useAuth();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName);
                if (error)
                    throw error;
            }
            else {
                const { error } = await signIn(email, password);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            setError(error.message || 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Brain, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900", children: isSignUp ? 'Create your account' : 'Welcome back' }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: isSignUp
                                ? 'Start your personalized learning journey'
                                : 'Sign in to continue your learning' })] }), _jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit, children: [_jsxs("div", { className: "space-y-4", children: [isSignUp && (_jsxs("div", { children: [_jsx("label", { htmlFor: "fullName", className: "sr-only", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(User, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { id: "fullName", name: "fullName", type: "text", required: isSignUp, value: fullName, onChange: (e) => setFullName(e.target.value), className: "input-field pl-10", placeholder: "Full Name" })] })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "sr-only", children: "Email address" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Mail, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "input-field pl-10", placeholder: "Email address" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "sr-only", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { id: "password", name: "password", type: showPassword ? 'text' : 'password', autoComplete: isSignUp ? 'new-password' : 'current-password', required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "input-field pl-10 pr-10", placeholder: "Password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] })] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm", children: error })), _jsx("div", { children: _jsx("button", { type: "submit", disabled: loading, className: "w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), isSignUp ? 'Creating account...' : 'Signing in...'] })) : (isSignUp ? 'Create Account' : 'Sign In') }) }), _jsx("div", { className: "text-center", children: _jsx("button", { type: "button", onClick: () => {
                                    setIsSignUp(!isSignUp);
                                    setError('');
                                }, className: "text-primary-600 hover:text-primary-500 text-sm font-medium", children: isSignUp
                                    ? 'Already have an account? Sign in'
                                    : "Don't have an account? Sign up" }) })] })] }) }));
}
