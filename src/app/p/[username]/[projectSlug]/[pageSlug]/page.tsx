import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Project, Page, Block, PageConfig } from '@/types/database'
import { Metadata } from 'next'
import { BlockFactory } from '@/components/shared/BlockFactory'
import { getBoxShadow } from '@/lib/utils'
import { fontMap } from '@/styles/fonts'

export const dynamic = 'force-dynamic'

// Fetch logic separated for Metadata and Page
async function getPageData(username: string, projectSlug: string, pageSlug: string) {
    const supabase = await createClient()

    // 1. Find User by Username
    const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

    if (!user) return null

    // 2. Find Project
    const { data: project } = await supabase
        .from('projects')
        .select('*') // We need default_theme_id
        .eq('slug', projectSlug)
        .eq('user_id', user.id)
        .single()

    if (!project) return null

    // 3. Fetch Page
    const { data: page } = await supabase
        .from('pages')
        .select('*, theme:themes(*)') // Alias themes to theme to match type
        .eq('project_id', project.id)
        .eq('slug', pageSlug)
        .single() // Ensure single object return

    if (!page) return null

    // 4. Fetch Blocks
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
    params: Promise<{ username: string; projectSlug: string; pageSlug: string }>
}): Promise<Metadata> {
    const { username, projectSlug, pageSlug } = await params
    const data = await getPageData(username, projectSlug, pageSlug)

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
    params: Promise<{ username: string; projectSlug: string; pageSlug: string }>
}) {
    const { username, projectSlug, pageSlug } = await params
    const data = await getPageData(username, projectSlug, pageSlug)

    if (!data) {
        notFound()
    }

    const { page, blocks } = data

    // Security Check: Unpublished pages
    if (page.is_published === false) {
        redirect('/')
    }

    // Theme Inheritance Logic (Phase 1 & 3)
    const DEFAULT_CONFIG: PageConfig = {
        colors: {
            background: '#ffffff',
            primary: '#000000',
            secondary: '#e5e7eb',
            text: '#1f2937',
            link: '#000000',
            buttonText: '#ffffff'
        },
        typography: { fontFamily: 'inter' },
        borders: { radius: '8px', width: '1px', style: 'solid' },
        dividers: { style: 'solid', width: '1px', color: '#e5e7eb' },
        buttonStyle: 'rounded-md',
        buttonVariant: 'fill'
    }

    let themeConfig = page.theme?.config || page.config

    const isConfigEmpty = !themeConfig || (typeof themeConfig === 'object' && Object.keys(themeConfig).length === 0)

    if (isConfigEmpty && !page.theme_id && data.project.default_theme_id) {
        const supabase = await createClient()
        const { data: defaultTheme } = await supabase
            .from('themes')
            .select('config')
            .eq('id', data.project.default_theme_id)
            .single()

        if (defaultTheme) {
            themeConfig = defaultTheme.config
        }
    }

    const effectiveConfig = (themeConfig || DEFAULT_CONFIG) as PageConfig

    // Dynamic Style Injection
    const themeStyles = {
        '--pico-bg': effectiveConfig.colors?.background || DEFAULT_CONFIG.colors!.background,
        '--pico-primary': effectiveConfig.colors?.primary || DEFAULT_CONFIG.colors!.primary,
        '--pico-secondary': effectiveConfig.colors?.secondary || DEFAULT_CONFIG.colors!.secondary,
        '--pico-text': effectiveConfig.colors?.text || DEFAULT_CONFIG.colors!.text,
        '--pico-link': effectiveConfig.colors?.link || DEFAULT_CONFIG.colors!.link,
        '--pico-btn-text': effectiveConfig.colors?.buttonText || DEFAULT_CONFIG.colors!.buttonText,
        '--pico-font': fontMap[effectiveConfig.typography?.fontFamily || 'inter'] || 'var(--font-inter)',

        '--pico-radius': effectiveConfig.borders?.radius || '8px',
        '--pico-border-width': effectiveConfig.borders?.width || '1px',
        '--pico-divider-style': effectiveConfig.dividers?.style || 'solid',
        '--pico-shadow': getBoxShadow(effectiveConfig.shadows?.style || 'none', effectiveConfig.colors?.secondary || '#e5e7eb', effectiveConfig.shadows?.opacity ?? 0.5),

        fontFamily: 'var(--pico-font)',
        backgroundColor: 'var(--pico-bg)',
        color: 'var(--pico-text)',
        backgroundImage: effectiveConfig.headerBackgroundImage ? `url(${effectiveConfig.headerBackgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    } as React.CSSProperties

    return (
        <div style={themeStyles} className="pico-background min-h-screen w-full flex flex-col justify-center lg:py-8 transition-colors duration-300">
            <div className="pico-container">
                {/* Blocks Rendering */}
                <div className="space-y-6">
                    {blocks?.sort((a, b) => a.position - b.position).map((block) => {
                        if (block.is_visible === false) return null

                        const widthClass = block.content.width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-full'

                        return (
                            <div key={block.id} className={widthClass}>
                                <BlockFactory block={block} config={effectiveConfig} />
                            </div>
                        )
                    })}

                    {blocks && blocks.length === 0 && (
                        <div className="text-center text-gray-500 py-10 w-full">
                            Cette page est vide pour le moment.
                        </div>
                    )}
                </div>
            </div>

            <footer className="text-center py-6 text-sm text-gray-400 opacity-60">
                Propulsé par Picoverse
            </footer>
        </div>
    )
}
