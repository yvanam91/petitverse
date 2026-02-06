'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

    const { error } = await supabase.from('projects').insert({
        name,
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

export async function addBlockWithContent(projectId: string, pageId: string, type: 'link' | 'text' | 'image' | 'file', content: any) {
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
