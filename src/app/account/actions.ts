'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUsername(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const username = formData.get('username') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (!username || username.length < 3) {
        return { error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id)

    if (error) {
        if (error.code === '23505') { // Unique violation code
            return { error: 'Ce nom d\'utilisateur est déjà pris' }
        }
        return { error: error.message }
    }

    revalidatePath('/account')
    return { success: true }
}
