import { getProjectBySlug } from '@/app/dashboard/actions'
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'
import { notFound } from 'next/navigation'

export default async function ProjectDashboardPage({
    params,
}: {
    params: Promise<{ projectSlug: string }>
}) {
    const { projectSlug } = await params
    const project = await getProjectBySlug(projectSlug)

    if (!project) {
        notFound()
    }

    return <AnalyticsDashboard projectId={project.id} projectName={project.name} />
}
