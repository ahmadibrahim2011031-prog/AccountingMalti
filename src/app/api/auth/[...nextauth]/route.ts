// src/app/api/auth/[...nextauth]/route.ts - FIXED WITH CORRECT PRISMA TYPES
import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/utils/prisma'
import { DefaultSession } from "next-auth"
import { UserRole } from '@prisma/client' // ✅ IMPORT FROM PRISMA INSTEAD

// ❌ REMOVE THIS CUSTOM TYPE - USE PRISMA'S INSTEAD
// type UserRole = 'ADMIN' | 'HR' | 'LEGAL' | 'ACCOUNTING' | 'HOUSING' | 'OPERATIONS' | 'VIEWER'

// ✅ NEXTAUTH TYPE AUGMENTATION WITH CORRECT PRISMA TYPES
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole // ✅ NOW USES PRISMA'S UserRole
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole // ✅ NOW USES PRISMA'S UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole // ✅ NOW USES PRISMA'S UserRole
  }
}

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ [Auth] Missing credentials')
          throw new Error('Missing credentials')
        }

        try {
          console.log(`🔍 [Auth] Looking for user: ${credentials.email}`)

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim()
            }
          })

          if (!user) {
            console.warn(`❌ [Auth] User not found: ${credentials.email}`)
            return null
          }

          console.log(`✅ [Auth] User found: ${user.email}`)

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.warn(`❌ [Auth] Invalid password for: ${credentials.email}`)
            return null
          }

          console.log(`✅ [Auth] Login successful for: ${user.email}`)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role, // ✅ NOW MATCHES PRISMA'S UserRole TYPE
          }
        } catch (error) {
          console.error('❌ [Auth] Database error during authorization:', error)
          throw new Error('An internal error occurred during authentication.')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/pages/login',
    error: '/pages/login',
    signOut: '/pages/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }