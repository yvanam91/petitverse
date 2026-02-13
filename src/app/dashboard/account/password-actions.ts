'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type UpdatePasswordState = {
    success?: boolean
    error?: string
    message?: string
}

export async function updatePassword(prevState: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    // 2. Extract Data
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 3. Validation
    if (!password || !confirmPassword) {
        return { error: 'Veuillez remplir tous les champs' }
    }

    if (password !== confirmPassword) {
        return { error: 'Les mots de passe ne correspondent pas' }
    }

    if (password.length < 10) {
        return { error: 'Le mot de passe doit contenir au moins 10 caractères' }
    }

    if (!/[A-Z]/.test(password)) {
        return { error: 'Le mot de passe doit contenir au moins une majuscule' }
    }

    if (!/[a-z]/.test(password)) {
        return { error: 'Le mot de passe doit contenir au moins une minuscule' }
    }

    // 4. Update Password
    const { error: updateError } = await supabase.auth.updateUser({
        password: password
    })

    if (updateError) {
        console.error('Error updating password:', updateError)
        // Check for "new password should be different" error if Supabase throws it specificially, 
        // otherwise generic error.
        return { error: updateError.message || 'Erreur lors de la mise à jour du mot de passe' }
    }

    return { success: true, message: 'Mot de passe mis à jour avec succès' }
}
