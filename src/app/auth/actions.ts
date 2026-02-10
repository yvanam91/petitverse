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
