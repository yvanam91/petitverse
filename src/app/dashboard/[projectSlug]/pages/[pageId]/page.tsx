import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { BlockEditor } from '@/components/dashboard/BlockEditor'
import type { Page, Project, Block } from '@/types/database'
import { getProjectBySlug } from '@/app/dashboard/actions'

export default async function EditorPage({
    params,
}: {
    params: Promise<{ projectSlug: string; pageId: string }>
}) {
    const { projectSlug, pageId } = await params
    const supabase = await createClient()

    // Fetch Project
    const project = await getProjectBySlug(projectSlug)

    if (!project) {
        notFound()
    }

    // Fetch Page
    const { data: page } = await supabase
        .from('pages')
        .select('*, theme:themes(*)')
        .eq('id', pageId)
        .eq('project_id', project.id) // Ensure page belongs to project
        .single()

    if (!page) {
        notFound()
    }

    // Fetch Blocks
    const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true })

    // Fetch User Username (for public link)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', project.user_id)
        .single()

    const username = userProfile?.username

    // Fetch Default Theme if page has none
    let defaultTheme = null
    if (!(page as any).theme && project.default_theme_id) {
        const { data: dt } = await supabase
            .from('themes')
            .select('*')
            .eq('id', project.default_theme_id)
            .single()
        defaultTheme = dt
    }

    return (
        <div className="min-h-screen pv-dark-100 flex flex-col h-screen overflow-hidden">
            <header className="pv-dark-0 text-pv-white-0 z-10 shrink-0">
                <div className="mx-auto w-full px-4 py-pv-20 sm:px-6 lg:px-8 border-b border-gray-100/10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/dashboard/${projectSlug}/pages`}
                                className="inline-flex items-center gap-1 font-pv-inter font-pv-regular text-pv-12 text-pv-white-0 hover:opacity-70 transition-opacity"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Link>
                            <h1 className="font-pv-inter font-pv-bold text-pv-12 text-pv-white-0 border-l border-gray-100/20 pl-4">
                                {(page as Page).title}
                            </h1>
                        </div>
                        {username && (
                            <Link
                                href={`/p/${username}/${project.slug}/${page.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-2 rounded-md bg-transparent border border-pv-brand-500 px-3 py-2 text-pv-12 font-pv-inter font-pv-bold text-pv-brand-500 hover:bg-pv-brand-500/10 transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Voir en ligne
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto">
                        <BlockEditor
                            projectId={project.id}
                            pageId={pageId}
                            initialBlocks={(blocks as Block[]) || []}
                            initialConfig={(page as Page).config && Object.keys((page as Page).config || {}).length > 0 ? (page as Page).config : (defaultTheme?.config || {})}
                            initialPublishedState={(page as Page).is_published ?? true}
                            initialMetaTitle={(page as Page).meta_title}
                            initialTheme={(page as any).theme || defaultTheme}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
