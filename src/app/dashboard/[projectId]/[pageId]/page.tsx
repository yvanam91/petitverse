import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { BlockEditor } from '@/components/dashboard/BlockEditor'
import type { Page, Project, Block } from '@/types/database'

export default async function EditorPage({
    params,
}: {
    params: Promise<{ projectId: string; pageId: string }>
}) {
    const { projectId, pageId } = await params
    const supabase = await createClient()

    // Fetch Page
    const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single()

    if (!page) {
        notFound()
    }

    // Fetch Project for slug generation
    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()

    if (!project) {
        notFound()
    }

    // Fetch Blocks
    const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <Link
                            href={`/dashboard/${projectId}`}
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                {(page as Page).title}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Édition du contenu
                            </p>
                        </div>
                        <Link
                            href={`/p/${project.name.toLowerCase().replace(/ /g, '-')}/${page.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Voir ma page en ligne
                        </Link>
                    </div>
                </div>
            </header>
            <main>
                <div className="mx-auto max-w-4xl py-6 sm:px-6 lg:px-8">
                    <BlockEditor
                        projectId={projectId}
                        pageId={pageId}
                        initialBlocks={(blocks as Block[]) || []}
                        initialConfig={(page as Page).config || {}}
                    />
                </div>
            </main>
        </div>
    )
}
