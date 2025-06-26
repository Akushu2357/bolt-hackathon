import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
const AuthContext = createContext(undefined);
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const initialAuthHandled = useRef(false);
    useEffect(() => {
        let isMounted = true;
        // On mount, restore session and user
        const restoreSession = async () => {
            console.log('[AuthContext] Restoring session...');
            const { data, error } = await supabase.auth.getSession();
            if (isMounted) {
                setSession(data.session);
                setUser(data.session?.user ?? null);
                setLoading(false);
            }
            if (error) {
                console.error('Error restoring session:', error);
            }
        };
        restoreSession();
        // Add onAuthStateChange listener
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AuthContext] onAuthStateChange:', event, session);
            setSession(session);
            setUser(session?.user ?? null);
        });
        return () => {
            isMounted = false;
            listener?.subscription.unsubscribe();
        };
    }, []);
    useEffect(() => {
        console.log('[AuthContext] State changed:', { user, session, loading });
    }, [user, session, loading]);
    const createProfile = async (user) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
            });
            if (error)
                throw error;
        }
        catch (error) {
            console.error('Error creating profile:', error);
        }
    };
    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (data?.user) {
            await createProfile(data.user);
        }
        return { error };
    };
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };
    const signOut = async () => {
        console.log('Signing out');
        let signOutCompleted = false;
        // Set a timeout to force-clear session if signOut hangs
        const timeout = setTimeout(() => {
            if (!signOutCompleted) {
                console.warn('Supabase signOut timed out, force clearing session.');
                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('sb-'))
                        localStorage.removeItem(key);
                });
                window.location.reload();
            }
        }, 3000); // 3 seconds
        try {
            const { error } = await supabase.auth.signOut();
            signOutCompleted = true;
            clearTimeout(timeout);
            if (error) {
                console.error('Supabase signOut error:', error);
            }
            else {
                console.log('Supabase signOut success');
            }
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith('sb-'))
                    localStorage.removeItem(key);
            });
            window.location.reload();
        }
        catch (err) {
            signOutCompleted = true;
            clearTimeout(timeout);
            console.error('Exception during signOut:', err);
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith('sb-'))
                    localStorage.removeItem(key);
            });
            window.location.reload();
        }
    };
    const value = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
