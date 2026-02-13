'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type UpdateProfileState = {
    success?: boolean
    error?: string
    message?: string
}

export async function updateProfile(prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    // 2. Extract and Validate Data
    const fullName = formData.get('full_name') as string

    if (fullName && fullName.length > 20) {
        return { error: 'Le nom d\'affichage ne peut pas dépasser 20 caractères' }
    }

    // 3. Update public.profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        return { error: 'Erreur lors de la mise à jour du profil' }
    }

    // 4. Update auth.users metadata to keep display_name in sync (Optional but good practice)
    // User requested "uniquement la colonne full_name dans la table public.profiles".
    // I will stick to that to be safe and strictly follow instructions, 
    // BUT the read logic prioritizes user_metadata.display_name. 
    // If I don't update metadata, the Page might still show the old name if it falls back to metadata first.
    // Let's check the Page logic I wrote:
    // const displayName = user.user_metadata?.display_name || profile?.username || ...
    // If I only update `profiles.full_name`, I should update the Page logic to prefer `profile.full_name`.

    // However, for best UX, I should probably update metadata too so other parts of the app using metadata see the change.
    // The prompt said: "Crée une Server Action... qui met à jour uniquement la colonne full_name...".
    // I will strictly follow this.
    // I will need to update the Page logic to prefer `profile.full_name` over metadata if present, 
    // OR realize that user instructions might imply that `full_name` becomes the source of truth.

    revalidatePath('/dashboard/account')

    return { success: true, message: 'Profil mis à jour avec succès' }
}
