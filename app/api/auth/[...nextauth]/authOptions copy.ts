import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from '@/lib/supabaseClient';
import { compare } from 'bcryptjs';
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

export const authOptions: AuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        CredentialsProvider({
            name: "Sign in",
            credentials: {
                email: { 
                    label: "Email",
                    type: "email",
                    placeholder: "test@example.com",
                },
                password: { 
                    label: 'Password', 
                    type: 'password' 
                }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;  
                }
                
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (!user || error) {
                    return null;
                }
                const isPasswordValid = await compare(credentials.password, user.hashed_password);
                
                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    role: user.role || 'user',
                    name: user.name || null
                };
            } 
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.role = user.role;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.id,
                    email: token.email,
                    role: token.role,
                    name: token.name
                };
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
};
