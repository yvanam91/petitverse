'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteProject(projectId: string) {
    console.log('--- Attempting to delete project:', projectId)

    const supabase = await createClient()

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('Unauthorized delete attempt')
        return { error: 'Unauthorized' }
    }

    // 2. Verify Ownership & Delete
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
    return { success: true }
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

    const { error } = await supabase.from('projects').insert({
        name,
        slug,
        user_id: user.id,
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
}

export async function createPage(projectId: string, formData: FormData) {
    const supabase = await createClient()
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string

    if (!title || !slug) {
        throw new Error('Le titre et le slug sont requis')
    }

    // Basic validation for slug
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
        throw new Error('Le slug ne doit contenir que des minuscules, des chiffres et des tirets')
    }

    const { data, error } = await supabase.from('pages').insert({
        project_id: projectId,
        title,
        slug,
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

import type { Block, PageConfig, Project, BlockType } from '@/types/database'

export async function addBlockWithContent(projectId: string, pageId: string, type: BlockType, content: any) {
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


export async function updateBlock(projectId: string, pageId: string, blockId: string, content: any) {
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

export async function updatePageConfig(projectId: string, pageId: string, config: any) {
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

export async function updateBlockPositions(projectId: string, pageId: string, updates: { id: string, position: number, page_id: string, type: string, content: any }[]) {
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
            type: u.type,
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
            revalidatePath(`/p/${project.slug}`)

            const { data: page } = await supabase.from('pages').select('slug').eq('id', pageId).single()
            if (page) {
                revalidatePath(`/p/${project.slug}/${page.slug}`)
            }
        }

        console.log('--- End updateBlockPositions (Success) ---')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update positions catch block:', error)
        return { error: error.message || 'Failed to update positions' }
    }
}

export async function saveTheme(name: string, config: PageConfig) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('themes')
        .insert({
            name,
            config,
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to save theme:', error)
        return { error: error.message }
    }

    return { success: true, theme: data }
}

export async function getThemes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch themes:', error)
        return []
    }

    return data
}
