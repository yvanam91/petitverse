import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Page } from '@/types/database'
import { ProjectView } from '@/components/dashboard/ProjectView'
import { getProjectBySlug } from '@/app/dashboard/actions'

export default async function PagesPage({
    params,
}: {
    params: Promise<{ projectSlug: string }>
}) {
    const { projectSlug } = await params
    const project = await getProjectBySlug(projectSlug)

    if (!project) {
        notFound()
    }

    const supabase = await createClient()
    const { data: pages } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', project.id)
        .order('id', { ascending: false })

    return <ProjectView project={project} initialPages={(pages as Page[]) || []} />
}
