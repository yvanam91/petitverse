import { createClient } from '@/utils/supabase/server'
import { CreateProjectModal } from './CreateProjectModal'
import { Folder, Globe, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types/database'

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
                                <div
                                    key={project.id}
                                    className="relative flex flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:ring-gray-900/10 transition-all"
                                >
                                    <div className="flex items-center gap-x-3">
                                        <div className="rounded-md bg-indigo-50 p-2">
                                            <Folder className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold leading-7 text-gray-900">
                                            {project.name}
                                        </h3>
                                    </div>
                                    <div className="mt-4 flex flex-1 flex-col justify-between">
                                        <div className="mt-6 flex items-center justify-end">
                                            <Link
                                                href={`/dashboard/${project.id}`}
                                                className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500 flex items-center gap-1 group"
                                            >
                                                Voir les pages
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
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
