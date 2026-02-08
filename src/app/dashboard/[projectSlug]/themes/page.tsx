import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ThemeEditor } from '@/components/dashboard/ThemeEditor'
import { getThemes } from '@/app/dashboard/actions'

export default async function ThemesPage({ params }: { params: Promise<{ projectSlug: string }> }) {
    const { projectSlug } = await params
    const supabase = await createClient()

    // 1. Verify Project
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', projectSlug)
        .single()

    if (!project) {
        notFound()
    }

    // 2. Fetch Themes
    const themes = await getThemes(project.id)

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Éditeur de Thème</h1>
                    <p className="text-gray-500">Personnalisez l&apos;apparence de vos pages.</p>
                </div>
            </div>

            <ThemeEditor themes={themes || []} projectId={project.id} />
        </div>
    )
}
