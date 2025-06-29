import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { Session } from 'next-auth';

/**
 * Get the current session from the server
 * @returns Promise<Session | null>
 */
export async function getSession(): Promise<Session | null> {
    return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 * @returns Promise<Session['user'] | null>
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Check if the current user is authenticated
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
}

/**
 * Check if the current user is an admin
 * @returns Promise<boolean>
 */
export async function isAdmin(): Promise<boolean> {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}

/**
 * Get user's role from session
 * @returns Promise<string | null>
 */
export async function getUserRole(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.role ?? null;
}

/**
 * Validate if user has required role
 * @param requiredRole - The role to check for
 * @returns Promise<boolean>
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
    const userRole = await getUserRole();
    return userRole === requiredRole;
}

/**
 * Get user's email from session
 * @returns Promise<string | null>
 */
export async function getUserEmail(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.email ?? null;
}

/**
 * Get user's ID from session
 * @returns Promise<string | null>
 */
export async function getUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.id ?? null;
} 