'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

interface UpdateAccountData {
    displayName: string
    email: string
    oldPassword?: string
    newPassword?: string
}

export async function updateAccountSettings(data: UpdateAccountData) {
    const supabase = await createClient()

    // 1. Verify Session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    let passwordUpdateSuccess = true

    // 2. Handle Password Change if requested
    if (data.newPassword && data.oldPassword) {
        // Verify old password by attempting a sign-in shim or just relying on the fact that we are authenticated?
        // User requested explicit check. Supabase doesn't have "verifyPassword" without sign-in.
        // We can try signing in with the current email and OLD password.
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!, // Use current verified email from session, NOT the new one
            password: data.oldPassword
        })

        if (signInError) {
            return { error: 'L\'ancien mot de passe est incorrect.' }
        }

        // If success, we can proceed to update the password
        const { error: updatePwError } = await supabase.auth.updateUser({ password: data.newPassword })
        if (updatePwError) {
            return { error: `Erreur mot de passe: ${updatePwError.message}` }
        }
    }

    // 3. Update Profile & Email
    const updates: any = {
        data: { full_name: data.displayName }
    }

    // Only update email if changed
    if (data.email !== user.email) {
        updates.email = data.email
    }

    const { error: updateError } = await supabase.auth.updateUser(updates)

    if (updateError) {
        return { error: `Erreur mise à jour: ${updateError.message}` }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// --- SIGNUP LOGIC ---

export type SignupState = {
    error?: string
    success?: boolean
    message?: string
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/
const USERNAME_STRICT_REGEX = /^[a-zA-Z0-9\s\-_'’\u00C0-\u017F]+$/ // For server-side check of allowed chars

// Helper to normalize slug on server side (same logic as client)
const normalizeForSlug = (name: string) => {
    return name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/['’]/g, "")             // Remove apostrophes
        .replace(/\s+/g, '_')             // Space -> Underscore
        .replace(/[^\w-]/g, '');          // Keep only alphanum, _, -
}

import { headers, cookies } from 'next/headers'

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    if (!username) return { available: false, error: 'Nom d\'utilisateur requis' }

    // Check length (client checks strict chars, server checks length)
    // We can also check strict chars here just in case
    // Note: The input 'username' here might be the raw one or normalized one depending on who calls it.
    // The client calls this with the *normalized* slug for availability check.

    if (username.length < 3) return { available: false, error: 'Trop court (3 min)' }

    // We assume check is done on the Slug
    if (!USERNAME_REGEX.test(username)) return { available: false, error: 'Caractères invalides (lettres, chiffres, - et _ uniquement)' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

    if (error && error.code !== 'PGRST116') {
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

export async function signUp(prevState: SignupState, formData: FormData): Promise<SignupState> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const rawUsername = formData.get('username') as string // This is likely the normalized one from client, BUT user asked to send raw?
    // Wait, client sends: formData.set('username', normalizedUsername).
    // The USER REQUEST says: "Reçoit l'email, le mot de passe et le username (non-normalisé)."
    // So I must update the client to send the RAW username, OR handle the fact it sends normalized.
    // If client sends normalized, I can't store "display name" easily unless I send "display_name" separately.
    // Let's assume I should update the client to send 'username' as RAW, or 'display_name' as RAW.
    // Standard approach: Form has 'username' input. User types "Jean-Marc".
    // Client onSubmit currently does: formData.set('username', normalizedUsername).
    // I SHOULD CHANGE CLIENT to send: formData.set('username', rawUsername) AND maybe formData.set('slug', normalizedUsername).
    // OR, server receives 'username' (raw), and normalizes it itself.

    // Let's stick to the prompt: "Reçoit l'email, le mot de passe et le username (non-normalisé)."
    // So I will update client to NOT overwrite 'username' with normalized one in FormData.

    const rgpd = formData.get('rgpd')

    if (!email || !password || !rawUsername) {
        return { error: 'Tous les champs sont requis' }
    }

    if (password !== confirmPassword) {
        return { error: 'Les mots de passe ne correspondent pas' }
    }

    if (!rgpd) {
        return { error: 'Vous devez accepter les conditions (RGPD)' }
    }

    // Password strength
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const isLongEnough = password.length >= 10
    if (!hasUpperCase || !hasLowerCase || !isLongEnough) {
        return { error: 'Le mot de passe ne respecte pas les critères de sécurité' }
    }

    // Normalize Username for Slug
    const normalizedUsername = normalizeForSlug(rawUsername)

    // Check Availability (on the SLUG)
    const usernameCheck = await checkUsernameAvailability(normalizedUsername)
    if (!usernameCheck.available) {
        return { error: usernameCheck.error || 'Ce nom d\'utilisateur est déjà pris' }
    }

    const emailCheck = await checkEmailAvailability(email)
    if (!emailCheck.available) {
        return { error: emailCheck.error || 'Cet email est déjà utilisé' }
    }

    const supabase = await createClient()

    // options: { emailRedirectTo: 'https://picover.se/login?verified=true' }
    // Metadata : Enregistre le username normalisé et le nom d'affichage dans user_metadata.

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: 'https://picover.se/login?verified=true',
            data: {
                username: normalizedUsername, // The slug
                full_name: rawUsername,       // The original input (mapped to profiles.full_name via trigger)
                // Keeping display_name for backward compatibility if needed, but full_name is the primary target now
                display_name: rawUsername
            },
        },
    })

    if (error) {
        return { error: error.message }
    }


    // Set recognized cookie
    const cookieStore = await cookies()
    cookieStore.set('recognized', 'true', {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })


    return { success: true, message: `Un lien de confirmation a été envoyé à ${email}.` }
}

export async function signIn(prevState: { error?: string }, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email et mot de passe requis' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        if (error.message.includes('Email not confirmed')) {
            return { error: 'Veuillez confirmer votre adresse e-mail pour accéder à votre dashboard.' }
        }
        return { error: 'Identifiants incorrects' }
    }

    // Set recognized cookie
    const cookieStore = await cookies()
    cookieStore.set('recognized', 'true', {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

