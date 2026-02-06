import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Page } from '@/types/database'
import { ProjectView } from '@/components/dashboard/ProjectView'

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params
    const supabase = await createClient()

    // Fetch project to ensure it exists and belongs to user
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (!project) {
        notFound()
    }

    const { data: pages } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', projectId)
        .order('id', { ascending: false })

    return <ProjectView project={project} initialPages={(pages as Page[]) || []} />
}
