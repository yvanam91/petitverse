import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AccountForm } from './AccountForm'

export default async function AccountPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-6">Mon Compte</h1>
            <AccountForm initialUsername={profile?.username || null} />
        </div>
    )
}
