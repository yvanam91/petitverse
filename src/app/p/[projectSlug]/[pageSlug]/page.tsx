import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { slugify } from '@/utils/slugify'
import type { Project, Page, Block } from '@/types/database'
import { FileText, ExternalLink } from 'lucide-react'
import { Metadata } from 'next'

// Fetch logic separated for Metadata and Page
async function getPageData(projectSlug: string, pageSlug: string) {
    const supabase = await createClient()

    // 1. Find Project (In-memory slug check as per current limitations)
    const { data: projects } = await supabase.from('projects').select('*')
    const project = (projects as Project[] | null)?.find(p => slugify(p.name) === projectSlug)

    if (!project) return null

    // 2. Fetch Page
    const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', project.id)
        .eq('slug', pageSlug)
        .single()

    if (!page) return null

    // 3. Fetch Blocks
    const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('position', { ascending: true })

    return { project, page: page as Page, blocks: blocks as Block[] }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ projectSlug: string; pageSlug: string }>
}): Promise<Metadata> {
    const { projectSlug, pageSlug } = await params
    const data = await getPageData(projectSlug, pageSlug)

    if (!data) {
        return {
            title: 'Page introuvable',
        }
    }

    return {
        title: `${data.page.title} | ${data.project.name}`,
        description: `Découvrez la page ${data.page.title} sur ${data.project.name}.`,
    }
}

export default async function PublicPage({
    params,
}: {
    params: Promise<{ projectSlug: string; pageSlug: string }>
}) {
    const { projectSlug, pageSlug } = await params
    const data = await getPageData(projectSlug, pageSlug)

    if (!data) {
        notFound()
    }

    const { page, blocks } = data
    // Default styles from config or fallback
    const config = page.config || {}
    const variables = {
        '--bg-color': config.backgroundColor || '#F9FAFB',
        '--btn-bg': config.buttonColor || '#000000',
        '--btn-text': config.buttonTextColor || '#FFFFFF',
        '--font-main': config.fontFamily || 'Inter, sans-serif',
    } as React.CSSProperties

    const buttonStyle = config.buttonStyle || 'rounded-md'
    const fontFamily = config.fontFamily || 'Inter, sans-serif'

    return (
        <div
            className="min-h-screen transition-colors duration-200 bg-[var(--bg-color)] font-[family-name:var(--font-main)]"
            style={variables}
        >
            <div className="mx-auto max-w-md min-h-screen p-4 flex flex-col gap-6">

                {/* Header / Title */}
                <header className="text-center py-8">
                    <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
                    {/* Optional project name or logo could go here */}
                </header>

                <main className="flex-1 flex flex-col gap-4">
                    {blocks && blocks.map((block) => {
                        switch (block.type) {
                            case 'link':
                                return (
                                    <a
                                        key={block.id}
                                        href={block.content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`group relative flex w-full items-center justify-center px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${buttonStyle} bg-[var(--btn-bg)] text-[var(--btn-text)]`}
                                    >
                                        <div className="font-medium text-lg text-center">
                                            {block.content.title}
                                        </div>
                                        <ExternalLink className="absolute right-4 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </a>
                                )

                            case 'text':
                                return (
                                    <div key={block.id} className="prose prose-sm mx-auto text-gray-700 bg-white/80 p-4 rounded-lg shadow-sm backdrop-blur-sm">
                                        <p>{block.content.text}</p>
                                    </div>
                                )

                            case 'file':
                                return (
                                    <a
                                        key={block.id}
                                        href={block.content.url}
                                        download
                                        className="group flex w-full items-center gap-4 rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:ring-2 hover:ring-indigo-500 backdrop-blur-sm"
                                    >
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate font-medium text-gray-900">
                                                {block.content.title || 'Document'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Télécharger le fichier
                                            </p>
                                        </div>
                                    </a>
                                )

                            case 'image':
                                return (
                                    <div key={block.id} className="w-full">
                                        <img
                                            src={block.content.url}
                                            alt={block.content.title || 'Image'}
                                            className="w-full h-auto rounded-lg shadow-sm"
                                            style={{ maxHeight: '500px', objectFit: 'contain' }}
                                        />
                                    </div>
                                )

                            default:
                                return null
                        }
                    })}

                    {blocks && blocks.length === 0 && (
                        <div className="text-center text-gray-500 py-10">
                            Cette page est vide pour le moment.
                        </div>
                    )}
                </main>

                <footer className="text-center py-6 text-sm text-gray-400">
                    Propulsé par Korner
                </footer>
            </div>
        </div>
    )
}
