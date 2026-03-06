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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-pv-dark-0 text-white-0">
                <div className="mx-auto max-w-7xl px-4 py-pv-20 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="font-pv-inter font-pv-bold text-pv-12 text-white-0">
                                Éditeur de Thème
                            </h1>
                            <p className="mt-1 font-pv-inter font-pv-regular text-pv-12 text-white-0 opacity-70">
                                Personnalisez l&apos;apparence de vos pages.
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            <main className="bg-pv-dark-100">
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8 bg-pv-dark-100">
                    <ThemeEditor themes={themes || []} projectId={project.id} />
                </div>
            </main>
        </div>
    )
}
