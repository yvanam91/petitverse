import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { slugify } from '@/utils/slugify'
import type { Project, Page, Block } from '@/types/database'
import { FileText, ExternalLink, Globe, Twitter, Instagram, Facebook, Linkedin, Github } from 'lucide-react'
import { Metadata } from 'next'

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
    const config = page.config || {}

    // Dynamic Style Injection
    const themeStyles = {
        '--bg-color': config.backgroundColor || '#ffffff',
        '--primary': config.buttonColor || '#000000',
        '--secondary': config.secondaryColor || '#e5e7eb',
        '--text': config.textColor || '#1f2937',
        '--link': config.linkColor || '#000000',
        '--btn-text': config.buttonTextColor || '#ffffff',
        '--font-family': config.fontFamily || 'Inter, sans-serif',
        fontFamily: 'var(--font-family)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text)',
        backgroundImage: config.headerBackgroundImage ? `url(${config.headerBackgroundImage})` : 'none',
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
                                    return (
                                        <div className="text-center mb-6 w-full">
                                            {block.content.url && (
                                                <div className="relative w-28 h-28 mx-auto mb-4">
                                                    <img
                                                        src={block.content.url}
                                                        alt={block.content.title}
                                                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-md"
                                                    />
                                                </div>
                                            )}
                                            {block.content.title && <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{block.content.title}</h2>}
                                            {block.content.subtitle && <p className="text-lg opacity-80 mt-1" style={{ color: 'var(--text)' }}>{block.content.subtitle}</p>}
                                        </div>
                                    )

                                case 'social_grid':
                                    const SOCIAL_ICONS = { globe: Globe, twitter: Twitter, instagram: Instagram, facebook: Facebook, linkedin: Linkedin, github: Github }
                                    return (
                                        <div className="flex flex-row flex-wrap justify-center gap-6 mb-4 w-full">
                                            {block.content.links?.map((link: any, i: number) => {
                                                const Icon = SOCIAL_ICONS[link.icon as keyof typeof SOCIAL_ICONS] || Globe
                                                return (
                                                    <a
                                                        key={i}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:scale-105 hover:shadow-md transition-all border border-gray-100"
                                                        style={{ color: 'var(--primary)' }}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </a>
                                                )
                                            })}
                                        </div>
                                    )

                                case 'separator':
                                    return <hr className="border-t my-4 w-2/3 mx-auto opacity-50" style={{ borderColor: 'var(--secondary)' }} />

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
                                    // Helper for styles matching editor
                                    const getButtonStyle = (): React.CSSProperties => {
                                        const styleType = config.buttonStyle
                                        const variant = config.buttonVariant || 'fill'
                                        const btnColor = config.buttonColor || '#000000'
                                        const textColor = config.buttonTextColor || '#ffffff'
                                        const font = config.fontFamily || 'Inter, sans-serif'

                                        const baseStyle: React.CSSProperties = {
                                            borderRadius: styleType === 'rounded-full' ? '9999px' : styleType === 'rounded-none' ? '0px' : '8px',
                                            fontFamily: font
                                        }

                                        if (variant === 'outline') {
                                            return {
                                                ...baseStyle,
                                                backgroundColor: 'transparent',
                                                color: btnColor,
                                                border: `2px solid ${btnColor}`
                                            }
                                        } else if (variant === 'soft-shadow') {
                                            return {
                                                ...baseStyle,
                                                backgroundColor: '#ffffff',
                                                color: '#000000',
                                                boxShadow: `0 4px 12px ${btnColor}40`,
                                                border: '1px solid #f3f4f6'
                                            }
                                        } else {
                                            return {
                                                ...baseStyle,
                                                backgroundColor: btnColor,
                                                color: textColor,
                                                border: 'none' // reset if needed
                                            }
                                        }
                                    }

                                    return (
                                        <a
                                            href={block.content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative flex w-full items-center justify-center px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md hover:opacity-95"
                                            style={getButtonStyle()}
                                        >
                                            <div className="font-medium text-lg text-center">
                                                {block.content.title}
                                            </div>
                                            <ExternalLink className="absolute right-4 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </a>
                                    )

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
