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

    const slug = newName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Ne garde que l'essentiel
        .replace(/\s+/g, '-')
        .trim()

    console.log(`Tentative d'update pour ID: ${projectId} vers Slug: ${slug}`)

    if (!slug) {
        return { error: 'Le nom génère un slug invalide' }
    }

    // Check for slug uniqueness (excluding current project)
    const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .neq('id', projectId) // Don't block if we keep same slug
        .maybeSingle()

    if (existing) {
        return { error: 'Ce nom de projet est déjà pris (slug existant)' }
    }

    const { data, error } = await supabase
        .from('projects')
        .update({ name: newName, slug: slug })
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()

    if (error) {
        console.error('Update project error:', error)
        return { error: error.message }
    }

    if (!data || data.length === 0) {
        console.error("Aucun projet trouvé avec l'ID:", projectId)
        return { error: 'Projet introuvable en base ou non autorisé.' }
    }

    // CRUCIAL : On purge TOUT le cache avant de rediriger
    revalidatePath('/dashboard', 'layout')

    return { success: true, newSlug: slug }
}

export async function checkProjectNameAvailability(name: string, currentProjectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { available: false, error: 'Non connecté' }

    if (!name || name.trim().length === 0) return { available: false }

    const slug = name.toLowerCase()
        .normalize('NFD') // Split accents from letters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens
        .trim()

    const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .eq('user_id', user.id)
        .neq('id', currentProjectId)
        .single()

    if (data) {
        return { available: false, error: 'Vous avez déjà un projet portant ce nom.' }
    }

    return { available: true }
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

    // 1. Get Project Default Theme
    const { data: project } = await supabase
        .from('projects')
        .select('default_theme_id, slug')
        .eq('id', projectId)
        .single()

    // 2. Get Theme Config (Inheritance)
    let themeConfig = {}
    if (project?.default_theme_id) {
        const { data: theme } = await supabase
            .from('themes')
            .select('config')
            .eq('id', project.default_theme_id)
            .single()
        themeConfig = theme?.config || {}
    }

    console.log('--- Creating Page ---')
    console.log('Project ID:', projectId)
    console.log('Inheriting Theme ID:', project?.default_theme_id)

    const { data, error } = await supabase.from('pages').insert({
        project_id: projectId,
        title,
        slug,
        description,
        config: themeConfig, // Inject inherited config
        theme_id: project?.default_theme_id // Link to theme
    }).select().single()

    if (error) {
        return { error: error.message }
    }

    if (project?.slug) {
        revalidatePath(`/dashboard/${project.slug}`)
    }
    revalidatePath(`/dashboard/${projectId}`) // Keep ID for safety
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
    cookieStore.set('picoverse_default_theme', JSON.stringify(config), { secure: true, httpOnly: true, sameSite: 'lax' })
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

export async function deleteTheme(themeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: theme } = await supabase
        .from('themes')
        .select('id, user_id')
        .eq('id', themeId)
        .eq('user_id', user.id)
        .single()

    if (!theme) return { error: 'Unauthorized or Theme not found' }

    // Check if it's the project default theme (optional safety check, but maybe not required by user)
    // For now, just delete.

    const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId)

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

export async function updateProjectContent(projectId: string, pageId: string, blocks: Block[]) {
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

    try {
        // 1. Get existing blocks to identify deletions
        const { data: existingBlocks } = await supabase
            .from('blocks')
            .select('id')
            .eq('page_id', pageId)

        const existingIds = existingBlocks?.map(b => b.id) || []
        const incomingIds = blocks.map(b => b.id)

        // 2. Identify blocks to delete (present in DB but not in payload)
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))

        if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('blocks')
                .delete()
                .in('id', idsToDelete)

            if (deleteError) throw deleteError
        }

        // 3. Upsert content
        const updates = blocks.map(b => ({
            id: b.id,
            page_id: pageId,
            type: b.type,
            content: b.content,
            position: b.position
            // is_visible: b.is_visible // Column missing in DB, disabled for now
        }))

        const { error } = await supabase
            .from('blocks')
            .upsert(updates, { onConflict: 'id' })

        if (error) throw error

        revalidatePath(`/dashboard/${projectId}/${pageId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update project content:', error)
        return { error: error.message }
    }
}
