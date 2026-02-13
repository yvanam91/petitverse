import { Sidebar } from '@/components/dashboard/Sidebar'
import { getProjects, getProjectBySlug } from '@/app/dashboard/actions'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { MobileNav } from '@/components/dashboard/MobileNav'

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ projectSlug: string }>
}) {
    const { projectSlug } = await params

    const [projects, currentProject] = await Promise.all([
        getProjects(),
        getProjectBySlug(projectSlug)
    ])

    if (!currentProject) {
        notFound()
    }

    // Security check: getProjects already filters by user_id via supabase RLS/query
    // getProjectBySlug also filters by user_id

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let username = null

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        username = profile?.username
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar - Hidden on mobile */}
            <Sidebar
                className="hidden md:flex"
                projectSlug={projectSlug}
                projects={projects as any[]}
                currentProject={currentProject as any}
                username={username}
            />

            {/* Mobile Navigation - Visible only on mobile */}
            <MobileNav
                projectSlug={projectSlug}
                projects={projects as any[]}
                currentProject={currentProject as any}
                username={username}
            />

            <main className="flex-1 overflow-y-auto w-full">
                {children}
            </main>
        </div>
    )
}
