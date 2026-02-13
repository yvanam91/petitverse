'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

export async function deleteUserAccount() {
    const supabase = await createClient()

    // 1. Verify User Session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    // 2. Initialize Admin Client
    // Note: Admin client is needed because deleting a user is an admin operation 
    // or requires specific RPCs not exposed by standard client usually.
    // However, if RLS allows, user might be able to delete their own profile, 
    // but deleting from auth.users requires admin/service_role.

    let adminClient
    try {
        adminClient = createAdminClient()
    } catch (error) {
        console.error('Failed to create admin client:', error)
        return { error: 'Configuration serveur manquante pour la suppression' }
    }

    // 3. Delete User from Auth (Cascade should handle public tables if configured, 
    // otherwise we might need to manually delete from tables first)
    // Assuming Supabase Cascade Delete is set up or we rely on it. 
    // Standard Supabase starter often has 'on delete cascade' for profiles linked to auth.users.

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return { error: 'Erreur lors de la suppression du compte' }
    }

    // 4. Sign out
    await supabase.auth.signOut()

    // 5. Redirect
    redirect('/?deleted=true')
}
