import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NonDirectionPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '20vh', fontSize: '1.5rem' }}>
            <p>This is a non direction page. Redirecting to homepage...</p>
        </div>
    );
};

export default NonDirectionPage;