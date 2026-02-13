import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AccountFormClient from './AccountFormClient'

export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile for fallback name if metadata is missing
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Priority: Profile Full Name > Metadata Display Name > Username > Email Part > Fallback
    const fullName = profile?.full_name || user.user_metadata?.display_name || ''
    const username = profile?.username || ''
    const email = user.email || ''

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <User className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mon Compte</h1>
                    <p className="text-sm text-gray-500">Gérez vos informations personnelles et votre abonnement</p>
                </div>
            </div>

            <AccountFormClient
                initialProfile={{
                    full_name: fullName,
                    username: username,
                    email: email
                }}
            />

            <div className="pt-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour au dashboard
                </Link>
            </div>
        </div>
    )
}


