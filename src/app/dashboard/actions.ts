'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Block, PageConfig, Project, BlockType, Theme, Page } from '@/types/database'

export async function deleteProject(projectId: string) {
    console.log('--- Attempting to delete project:', projectId)

    const supabase = await createClient()

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('Unauthorized delete attempt')
        return { error: 'Unauthorized' }
    }

    // 2. Fetch user's other projects BEFORE deletion to determine redirect target
    const { data: projects } = await supabase
        .from('projects')
        .select('slug, created_at')
        .eq('user_id', user.id)
        .neq('id', projectId) // Exclude current project
        .order('created_at', { ascending: false })
        .limit(1)

    const nextProject = projects && projects.length > 0 ? projects[0] : null

    // 3. Verify Ownership & Delete
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id) // Security check to ensure ownership

    if (error) {
        console.error('Supabase DELETE error:', error)
        return { success: false, error: error.message }
    }

    console.log('Project deleted successfully, revalidating...')

    // Small artificial delay for UX (loading state visibility)
    await new Promise(resolve => setTimeout(resolve, 500))

    revalidatePath('/dashboard')

    // 4. Smart Redirect
    if (nextProject) {
        redirect(`/dashboard/${nextProject.slug}`)
    } else {
        redirect('/dashboard')
    }
}

export async function updateProjectName(projectId: string, newName: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (!newName || newName.trim().length === 0) {
        return { error: 'Le nom du projet ne peut pas être vide' }
    }

    const slug = newName.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens
        .trim()

    if (!slug) {
        return { error: 'Le nom génère un slug invalide' }
    }

    // Check for slug uniqueness (excluding current project)
    const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .neq('id', projectId) // Don't block if we keep same slug (though slug derived from name usually changes if name changes)
        .single()

    if (existing) {
        // Append random suffix if slug taken
        // Or simply error. Implementation plan said "regenerate slug".
        // Let's try to append a random string for now or just error.
        // User request didn't specify handling collisions explicitly other than "regenerate slug".
        // Let's error for now to keep it clean, or maybe append 4 random chars?
        // Let's error to let user pick another name if collision.
        return { error: 'Ce nom de projet est déjà pris (slug existant)' }
    }

    const { error } = await supabase
        .from('projects')
        .update({ name: newName, slug: slug })
        .eq('id', projectId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Update project error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${slug}`) // New path
    // Old path revalidation is tricky if we don't know the old slug here, but dashboard list will update.

    return { success: true, newSlug: slug }
}

export async function createProject(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    console.log('Inserting project for user:', user.id)

    const slug = name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens
        .trim()

    // Ensure slug is unique if needed, but for now simple generation
    // Ideally we should check existence or let DB handle unique constraint error

    // Check for slug uniqueness PER USER
    const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .eq('user_id', user.id)
        .single()

    if (existingProject) {
        return { error: 'Vous avez déjà un projet avec ce nom.' }
    }

    // Ensure theme_id is associated (per user rules) - verified later in flow by creating default theme

    const { data, error } = await supabase.from('projects').insert({
        name,
        slug,
        user_id: user.id,
    }).select().single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')

    // 3. Create Default Theme automatically
    const defaultThemeConfig: PageConfig = {
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
        dividers: { style: 'solid', width: '1px', color: '#e5e7eb' }
    }

    const { data: themeData, error: themeError } = await supabase.from('themes').insert({
        name: 'Défaut',
        config: defaultThemeConfig,
        user_id: user.id,
        project_id: data.id
    }).select().single()

    if (themeError) {
        console.error('Failed to create default theme:', themeError)
    } else if (themeData) {
        // 4. Set as Default Theme for Project
        const { error: updateError } = await supabase
            .from('projects')
            .update({ default_theme_id: themeData.id })
            .eq('id', data.id)

        if (updateError) {
            console.error('Failed to update project default_theme_id:', updateError)
        } else {
            console.log('Project created with default theme:', themeData.id)
        }
    }

    return { data }
}

export async function createPage(projectId: string, formData: FormData) {
    const supabase = await createClient()
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string

    if (!title || !slug) {
        throw new Error('Le titre et le slug sont requis')
    }

    if (title.length > 50 || slug.length > 50) {
        return { error: 'Titre ou slug trop long (max 50 caractères)' }
    }

    if (description.length > 200) {
        return { error: 'La description ne doit pas dépasser 200 caractères' }
    }

    // Basic validation for slug
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
        throw new Error('Le slug ne doit contenir que des minuscules, des chiffres et des tirets')
    }

    // Check for project default theme

    // Check for project default theme
    const { data: project } = await supabase
        .from('projects')
        .select('default_theme_id')
        .eq('id', projectId)
        .single()

    let themeIdToInsert = project?.default_theme_id

    // Fallback: If no default_theme_id, try to find ANY theme attached to this project
    if (!themeIdToInsert) {
        const { data: themes } = await supabase
            .from('themes')
            .select('id')
            .eq('project_id', projectId)
            .limit(1)

        if (themes && themes.length > 0) {
            themeIdToInsert = themes[0].id
            console.log('--- Fallback Theme Found:', themeIdToInsert)
        }
    }

    console.log('--- Creating Page ---')
    console.log('Project ID:', projectId)
    console.log('ID du thème sélectionné pour insertion:', themeIdToInsert)

    const { data, error } = await supabase.from('pages').insert({
        project_id: projectId,
        title,
        slug,
        description,
        config: {}, // Empty config to enforce theme inheritance
        theme_id: themeIdToInsert // Assign discovered theme ID (may still be null if really no themes exist)
    }).select().single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { data }
}

export async function addBlock(pageId: string) {
    const supabase = await createClient()

    // Get current max position to append
    const { data: blocks } = await supabase
        .from('blocks')
        .select('position')
        .eq('page_id', pageId)
        .order('position', { ascending: false })
        .limit(1)

    const nextPosition = blocks && blocks.length > 0 ? blocks[0].position + 1 : 0

    const { error } = await supabase.from('blocks').insert({
        page_id: pageId,
        type: 'link',
        content: { title: 'Nouveau lien', url: 'https://' },
        position: nextPosition,
    })

    if (error) {
        throw new Error(error.message)
    }
}

export async function addBlockWithProject(projectId: string, pageId: string) {
    const supabase = await createClient()

    // Get current max position to append
    const { data: blocks } = await supabase
        .from('blocks')
        .select('position')
        .eq('page_id', pageId)
        .order('position', { ascending: false })
        .limit(1)

    const nextPosition = blocks && blocks.length > 0 ? blocks[0].position + 1 : 0

    const { data, error } = await supabase.from('blocks').insert({
        page_id: pageId,
        type: 'link',
        content: { title: 'Nouveau lien', url: 'https://' },
        position: nextPosition,
    }).select().single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/${projectId}/${pageId}`)
    return { data }
}


export async function addBlockWithContent(projectId: string, pageId: string, type: BlockType, content: Record<string, any>) {
    const supabase = await createClient()

    // Get current max position to append
    const { data: blocks } = await supabase
        .from('blocks')
        .select('position')
        .eq('page_id', pageId)
        .order('position', { ascending: false })
        .limit(1)

    const nextPosition = blocks && blocks.length > 0 ? blocks[0].position + 1 : 0

    const { data, error } = await supabase.from('blocks').insert({
        page_id: pageId,
        type,
        content,
        position: nextPosition,
    }).select().single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/${projectId}/${pageId}`)
    return { data }
}


export async function updateBlock(projectId: string, pageId: string, blockId: string, content: Record<string, any>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('blocks')
        .update({ content })
        .eq('id', blockId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/${projectId}/${pageId}`)
    return { error: null }
}

export async function deleteBlock(projectId: string, pageId: string, blockId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/${projectId}/${pageId}`)
    return { error: null }
}

export async function updatePageConfig(projectId: string, pageId: string, config: PageConfig) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('pages')
        .update({ config })
        .eq('id', pageId)

    if (error) {
        return { error: (error as any).message || 'Unknown error' }
    }


    revalidatePath(`/dashboard/${projectId}/${pageId}`)
    revalidatePath(`/dashboard/${projectId}`) // Might affect listing if we show colors there
    return { error: null }
}

export async function updateBlockPositions(projectId: string, pageId: string, updates: { id: string, position: number, page_id: string, type: string, content: Record<string, any> }[]) {
    console.log('--- Start updateBlockPositions ---')
    console.log('Update pour projet:', projectId, 'page:', pageId, 'updates count:', updates.length)

    const supabase = await createClient()

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('Unauthorized: No user found')
        return { error: 'Unauthorized' }
    }
    console.log('User ID:', user.id)
    console.log('Auth check: User is', user.id, 'Project ID is', projectId)

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, slug')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

    if (projectError || !project) {
        console.error('Project not found or error:', projectError)
        return { error: 'Project not found' }
    }

    try {
        // Explicit payload with all required fields to satisfy NOT NULL constraints and RLS
        // We pass the full object to upsert.
        // NOTE: We trust the client to send the correct 'content' and 'type' for the given 'id'.
        // In a more strict app, we might fetch existing blocks and only update position, 
        // but that requires RLS allowing update on position only OR fetching.
        // Here we use upsert with full data as requested.

        const dataToUpdate = updates.map(u => ({
            id: u.id,
            position: u.position,
            page_id: pageId, // Should match u.page_id, verifying or overriding with validated pageId is safer
            type: u.type as BlockType,
            content: u.content
            // updated_at: new Date().toISOString() // Optional
        }))

        // Debugging Terminal: User ID check right before upsert
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        console.log('User ID détecté côté serveur (pre-upsert):', currentUser?.id)

        // console.log('Données envoyées à Supabase:', JSON.stringify(dataToUpdate, null, 2)) // Reduced logs

        const { error } = await supabase
            .from('blocks')
            .upsert(dataToUpdate, { onConflict: 'id' })

        if (error) {
            console.error('Détail erreur Supabase:', error)
            throw new Error(error.message)
        }

        console.log('Upsert successful, revalidating...')

        revalidatePath(`/dashboard/${projectId}/${pageId}`)
        if (project.slug) {
            // Fetch username for revalidation path
            const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
            if (profile?.username) {
                revalidatePath(`/p/${profile.username}/${project.slug}`)

                const { data: page } = await supabase.from('pages').select('slug').eq('id', pageId).single()
                if (page) {
                    revalidatePath(`/p/${profile.username}/${project.slug}/${page.slug}`)
                }
            }
        }

        console.log('--- End updateBlockPositions (Success) ---')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update positions catch block:', error)
        return { error: error.message || 'Failed to update positions' }
    }
}

export async function saveTheme(name: string, config: PageConfig, projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('themes')
        .insert({
            name,
            config,
            user_id: user.id,
            project_id: projectId
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to save theme:', error)
        return { error: error.message }
    }

    return { success: true, theme: data }
}

export async function getThemes(projectId: string): Promise<Theme[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('project_id', projectId) // Filter by project
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch themes:', error)
        return []
    }

    return data as Theme[]
}

export async function saveDefaultTheme(config: PageConfig) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('korner_default_theme', JSON.stringify(config), { secure: true, httpOnly: true, sameSite: 'lax' })
    return { success: true }
}

export async function getProjects(): Promise<Project[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (projects as Project[]) || []
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', user.id)
        .single()

    return project as Project
}

export async function deletePage(projectId: string, pageId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership of the page via project
    const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('project_id')
        .eq('id', pageId)
        .single()

    if (pageError || !page) {
        return { error: 'Page not found' }
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', page.project_id)
        .eq('user_id', user.id)
        .single()

    if (projectError || !project) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
}

export async function updateTheme(themeId: string, name: string, config: PageConfig) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('themes')
        .update({ name, config })
        .eq('id', themeId)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function applyThemeToProject(projectId: string, themeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

    if (!project) return { error: 'Unauthorized' }

    // 1. Update Project Default Theme
    const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({ default_theme_id: themeId })
        .eq('id', projectId)

    if (projectUpdateError) {
        console.error('Failed to update project default theme:', projectUpdateError)
        return { error: projectUpdateError.message }
    }

    // 2. Update all pages in project
    const { error: pagesUpdateError } = await supabase
        .from('pages')
        .update({ theme_id: themeId })
        .eq('project_id', projectId)

    if (pagesUpdateError) {
        console.error('Failed to update pages theme:', pagesUpdateError)
        return { error: pagesUpdateError.message }
    }

    revalidatePath(`/dashboard/${projectId}`)
    revalidatePath(`/p/[username]/[projectSlug]`, 'layout') // Revalidate public pages potentially
    return { success: true }
}
