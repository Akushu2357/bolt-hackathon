import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Brain } from 'lucide-react';
export default function LoadingSpinner() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow", children: _jsx(Brain, { className: "w-8 h-8 text-white" }) }), _jsx("p", { className: "text-gray-600 font-medium", children: "Loading..." })] }) }));
}
