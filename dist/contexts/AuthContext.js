import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
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
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(async (error) => {
            console.error('Error getting session:', error);
            // Clear any invalid session data
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setLoading(false);
        });
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            // Create profile on sign up (event SIGNED_IN)
            if (event === 'SIGNED_IN' && session?.user) {
                // Check if profile exists
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();
                if (error && error.code !== 'PGRST116') {
                    console.error('Error checking profile:', error);
                }
                else if (!profile) {
                    // Profile doesn't exist, create it
                    await createProfile(session.user);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);
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
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
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
        await supabase.auth.signOut();
        console.log('Signed out');
        setUser(null);
        setSession(null);
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
