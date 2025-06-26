import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bot } from 'lucide-react';
export default function TypingIndicator() {
    return (_jsx("div", { className: "flex justify-start mb-4", children: _jsxs("div", { className: "flex max-w-3xl", children: [_jsx("div", { className: "flex-shrink-0 mr-3", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center", children: _jsx(Bot, { className: "w-4 h-4 text-gray-600" }) }) }), _jsx("div", { className: "px-4 py-3 rounded-lg bg-gray-100", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) })] }) }));
}
