import { createClient } from '@/utils/supabase/server'
import { CreateProjectModal } from './CreateProjectModal'
import { Folder, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types/database'
import { ProjectCard } from '@/app/dashboard/ProjectCard'

export default async function DashboardPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        // Should be handled by middleware, but just in case
        return null
    }

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{user.email}</span>
                        <CreateProjectModal />
                    </div>
                </div>
            </header>
            <main>
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    {projects && projects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(projects as Project[]).map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-300">
                            <Folder className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                Aucun projet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Commencez par créer un nouveau projet.
                            </p>
                            <div className="mt-6">
                                <CreateProjectModal />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
