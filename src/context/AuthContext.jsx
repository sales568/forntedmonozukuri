import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user data from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = response.data;

            // Extraer el nombre del rol para facilitar el filtrado en el frontend
            const userData = {
                ...user,
                role: user.role?.name || user.role || 'user'
            };

            localStorage.setItem('auth_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user_data', JSON.stringify(userData));

            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.message || 'Credenciales incorrectas');
        }
    };

    const register = async (userData) => {
        try {
            const response = await apiClient.post('/admin/users', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error en el registro');
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                await apiClient.post('/auth/logout', { refreshToken }).catch(console.error);
            }
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use Auth Context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
