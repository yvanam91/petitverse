import { createClient } from '@/utils/supabase/server'
import { CreateProjectModal } from './CreateProjectModal'
import { Folder } from 'lucide-react'
import { redirect } from 'next/navigation'
import type { Project } from '@/types/database'

export default async function DashboardPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (projects && projects.length > 0) {
        redirect(`/dashboard/${projects[0].slug}/pages`)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-300 p-12 bg-white">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    Bienvenue sur Korner
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Créez votre premier projet pour commencer.
                </p>
                <div className="mt-6">
                    <CreateProjectModal />
                </div>
            </div>
        </div>
    )
}
