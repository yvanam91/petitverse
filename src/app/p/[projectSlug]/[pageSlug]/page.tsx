import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { slugify } from '@/utils/slugify'
import type { Project, Page, Block, PageConfig } from '@/types/database'
import { FileText } from 'lucide-react'
import { Metadata } from 'next'
import { HeaderBlock } from '@/components/shared/blocks/HeaderBlock'
import { SocialGridBlock } from '@/components/shared/blocks/SocialGridBlock'
import { LinkBlock } from '@/components/shared/blocks/LinkBlock'
import { DoubleLinkBlock } from '@/components/shared/blocks/DoubleLinkBlock'

export const dynamic = 'force-dynamic'

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
        .select('*, theme:themes(*)') // Alias themes to theme to match type
        .eq('project_id', project.id)
        .eq('slug', pageSlug)
        .single() // Ensure single object return

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
        title: `${data.page.meta_title || data.page.title} | ${data.project.name}`,
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

    // Security Check: Unpublished pages
    if (page.is_published === false) {
        redirect('/')
    }

    // Theme Inheritance Logic (Phase 1 & 3)
    // Use Global Theme config if available, fallback to local config, or use System Default.
    const DEFAULT_CONFIG: PageConfig = {
        colors: {
            background: '#ffffff',
            primary: '#000000',
            secondary: '#e5e7eb',
            text: '#1f2937',
            link: '#000000',
            buttonText: '#ffffff'
        },
        typography: { fontFamily: 'Inter, sans-serif' },
        borders: { radius: '8px', width: '1px', style: 'solid' },
        dividers: { style: 'solid', width: '1px', color: '#e5e7eb' },
        buttonStyle: 'rounded-md',
        buttonVariant: 'fill'
    }

    // STRICT PRIORITY: Theme -> Page Config -> System Default
    const effectiveConfig = (page.theme?.config || page.config || DEFAULT_CONFIG) as PageConfig

    // Dynamic Style Injection
    const themeStyles = {
        '--bg-color': effectiveConfig.colors?.background || DEFAULT_CONFIG.colors!.background,
        '--primary': effectiveConfig.colors?.primary || DEFAULT_CONFIG.colors!.primary,
        '--secondary': effectiveConfig.colors?.secondary || DEFAULT_CONFIG.colors!.secondary,
        '--text': effectiveConfig.colors?.text || DEFAULT_CONFIG.colors!.text,
        '--link': effectiveConfig.colors?.link || DEFAULT_CONFIG.colors!.link,
        '--btn-text': effectiveConfig.colors?.buttonText || DEFAULT_CONFIG.colors!.buttonText,
        '--font-family': effectiveConfig.typography?.fontFamily || DEFAULT_CONFIG.typography!.fontFamily,

        // New Phase 1 Variables
        '--border-radius': effectiveConfig.borders?.radius || '8px',
        '--border-width': effectiveConfig.borders?.width || '1px',
        '--divider-style': effectiveConfig.dividers?.style || 'solid',

        fontFamily: 'var(--font-family)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text)',
        backgroundImage: effectiveConfig.headerBackgroundImage ? `url(${effectiveConfig.headerBackgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    } as React.CSSProperties

    return (
        <div style={themeStyles} className="min-h-screen transition-colors duration-300">
            <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Blocks Rendering */}
                <div className="space-y-6">
                    {blocks?.sort((a, b) => a.position - b.position).map((block) => {
                        if (block.is_visible === false) return null

                        // Grid Width Class
                        const widthClass = block.content.width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-full'

                        // Specific wrapper for width
                        const content = (() => {
                            switch (block.type) {
                                case 'header':
                                    return <HeaderBlock content={block.content as any} config={effectiveConfig} />

                                case 'social_grid':
                                    return <SocialGridBlock content={block.content as any} config={effectiveConfig} />

                                case 'separator':
                                    return <hr className="border-t my-4 w-2/3 mx-auto opacity-50" style={{ borderColor: 'var(--secondary)', borderStyle: 'var(--divider-style)' }} />

                                case 'title':
                                    return (
                                        <h2 className={`text-2xl font-bold w-full mb-2 ${block.content.align === 'center' ? 'text-center' : block.content.align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text)' }}>
                                            {block.content.title}
                                        </h2>
                                    )

                                case 'text':
                                    return (
                                        <div className="w-full whitespace-pre-wrap mb-4" style={{ color: 'var(--text)' }}>
                                            {block.content.text}
                                        </div>
                                    )

                                case 'double-link':
                                    return <DoubleLinkBlock content={block.content as any} config={effectiveConfig} />

                                case 'hero':
                                    return (
                                        <div className="w-full flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-2xl shadow-sm my-4">
                                            {block.content.url && (
                                                <div className="w-full md:w-1/2">
                                                    <img
                                                        src={block.content.url}
                                                        alt={block.content.title}
                                                        className="w-full h-64 object-cover rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            )}
                                            <div className={`w-full ${block.content.url ? 'md:w-1/2' : ''} flex flex-col gap-3 text-center md:text-left`}>
                                                <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: '#1f2937' }}>
                                                    {block.content.title}
                                                </h2>
                                                <p className="leading-relaxed whitespace-pre-wrap opacity-80" style={{ color: '#4b5563' }}>
                                                    {block.content.text}
                                                </p>
                                            </div>
                                        </div>
                                    )

                                case 'link':
                                    return <LinkBlock content={block.content as any} config={effectiveConfig} />

                                case 'file':
                                    return (
                                        <a
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
                                        <div className="w-full">
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
                        })()

                        if (!content) return null

                        return (
                            <div key={block.id} className={widthClass}>
                                {content}
                            </div>
                        )
                    })}

                    {blocks && blocks.length === 0 && (
                        <div className="text-center text-gray-500 py-10 w-full">
                            Cette page est vide pour le moment.
                        </div>
                    )}
                </div>

                <footer className="text-center py-6 text-sm text-gray-400 opacity-60">
                    Propulsé par Korner
                </footer>
            </div>
        </div>
    )
}
