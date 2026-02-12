'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export type SignupState = {
    error?: string
    success?: boolean
    message?: string
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    if (!username) return { available: false, error: 'Nom d\'utilisateur requis' }
    if (username.length < 3) return { available: false, error: 'Trop court (3 min)' }
    if (!USERNAME_REGEX.test(username)) return { available: false, error: 'Caractères invalides (lettres, chiffres, - et _ uniquement)' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is good
        console.error('Error checking username:', error)
        return { available: false, error: 'Erreur lors de la vérification' }
    }

    if (data) {
        return { available: false, error: 'Ce nom d\'utilisateur est déjà pris' }
    }

    return { available: true }
}

export async function checkEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
    if (!email) return { available: false, error: 'Email requis' }

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return { available: false, error: 'Format d\'email invalide' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking email:', error)
        return { available: false, error: 'Erreur lors de la vérification' }
    }

    if (data) {
        return { available: false, error: 'Cette adresse e-mail est déjà associée à un compte.' }
    }

    return { available: true }
}


export async function signup(prevState: SignupState, formData: FormData): Promise<SignupState> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const username = formData.get('username') as string
    const rgpd = formData.get('rgpd')

    if (!email || !password || !username) {
        return { error: 'Tous les champs sont requis' }
    }

    if (password !== confirmPassword) {
        return { error: 'Les mots de passe ne correspondent pas' }
    }

    if (!rgpd) {
        return { error: 'Vous devez accepter les conditions (RGPD)' }
    }

    // Server-side validation for password strength
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const isLongEnough = password.length >= 10

    if (!hasUpperCase || !hasLowerCase || !isLongEnough) {
        return { error: 'Le mot de passe ne respecte pas les critères de sécurité' }
    }

    const usernameCheck = await checkUsernameAvailability(username)
    if (!usernameCheck.available) {
        return { error: usernameCheck.error || 'Nom d\'utilisateur invalide' }
    }

    const emailCheck = await checkEmailAvailability(email)
    if (!emailCheck.available) {
        return { error: emailCheck.error || 'Email invalide' }
    }

    const supabase = await createClient()

    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
                username: username,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Vérifiez vos emails pour confirmer votre inscription.' }
}
