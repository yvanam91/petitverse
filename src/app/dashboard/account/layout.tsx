import { Sidebar } from '@/components/dashboard/Sidebar'
import { getProjects } from '@/app/dashboard/actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Project } from '@/types/database'
import { MobileNav } from '@/components/dashboard/MobileNav'

export default async function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user details for sidebar
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    const username = profile?.username

    // Fetch user's projects for sidebar logic
    const projects = await getProjects()

    // Determine fallback project for sidebar context (e.g. first one)
    // Sidebar usually requires a currentProject to show in the dropdown selector.
    // If no projects, we might need a dummy or handle empty state in Sidebar.
    // Account page is outside project context, but Sidebar needs *something* to display in the selector header?
    // Or we should update Sidebar to handle "No Project Selected" or "Account Context".
    // For now, let's use the first project if available.

    const fallbackProject = projects.length > 0 ? projects[0] : { id: 'account', name: 'Mon Compte', slug: 'account', user_id: user.id } as Project

    // We pass "account" as projectSlug to Sidebar if we want, or the fallback slug.
    // BUT Sidebar likely highlights navigation based on slug.
    // Since Account is not a project route, Sidebar links (Pages, Themes...) won't be active, which is CORRECT.
    // The "Mon Compte" link will be active if matched.

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar - Hidden on mobile */}
            <Sidebar
                className="hidden md:flex"
                projectSlug={fallbackProject.slug} // Used for creating links, so if user clicks "Pages" it goes to this project's pages
                projects={projects as Project[]}
                currentProject={fallbackProject} // Displayed in the header dropdown
                username={username}
            />

            {/* Mobile Navigation - Visible only on mobile */}
            <MobileNav
                projectSlug={fallbackProject.slug}
                projects={projects as Project[]}
                currentProject={fallbackProject}
                username={username}
            />

            <main className="flex-1 overflow-y-auto bg-gray-50 w-full">
                {children}
            </main>
        </div>
    )
}
