import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/QuizResultsPage/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import QuizPage from './pages/QuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import ProfilePage from './pages/ProfilePage';
import LearningDashboardPage from './pages/LearningDashboardPage';
import LoadingSpinner from './components/QuizResultsPage/LoadingSpinner';
import NonDirectionPage from './pages/NonDirectionPage';
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return _jsx(LoadingSpinner, {});
    }
    if (!user) {
        return _jsx(Navigate, { to: "/auth", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return _jsx(LoadingSpinner, {});
    }
    if (user) {
        return _jsx(Navigate, { to: "/home", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
// New component for routes that work for both guest and authenticated users
function GuestOrAuthRoute({ children }) {
    const { loading } = useAuth();
    if (loading) {
        return _jsx(LoadingSpinner, {});
    }
    return _jsx(_Fragment, { children: children });
}
function AppRoutes() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/auth", element: _jsx(PublicRoute, { children: _jsx(AuthPage, {}) }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/home", replace: true }) }), _jsx(Route, { path: "/home", element: _jsx(GuestOrAuthRoute, { children: _jsx(Layout, { children: _jsx(HomePage, {}) }) }) }), _jsx(Route, { path: "/chat", element: _jsx(GuestOrAuthRoute, { children: _jsx(Layout, { children: _jsx(ChatPage, {}) }) }) }), _jsx(Route, { path: "/chat/:sessionId", element: _jsx(GuestOrAuthRoute, { children: _jsx(Layout, { children: _jsx(ChatPage, {}) }) }) }), _jsx(Route, { path: "/quiz", element: _jsx(GuestOrAuthRoute, { children: _jsx(Layout, { children: _jsx(QuizPage, {}) }) }) }), _jsx(Route, { path: "/quiz-results", element: _jsx(GuestOrAuthRoute, { children: _jsx(Layout, { children: _jsx(QuizResultsPage, {}) }) }) }), _jsx(Route, { path: "/learning", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(LearningDashboardPage, {}) }) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(Layout, { children: _jsx(ProfilePage, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(NonDirectionPage, {}) })] }));
}
function App() {
    return (_jsx(Router, { children: _jsx(AuthProvider, { children: _jsx("div", { className: "min-h-screen bg-gray-50", children: _jsx(AppRoutes, {}) }) }) }));
}
export default App;
