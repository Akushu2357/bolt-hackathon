import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const NonDirectionPage = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate]);
    return (_jsx("div", { style: { textAlign: 'center', marginTop: '20vh', fontSize: '1.5rem' }, children: _jsx("p", { children: "This is a non direction page. Redirecting to homepage..." }) }));
};
export default NonDirectionPage;
