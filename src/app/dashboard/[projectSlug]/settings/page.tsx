import { getProjectBySlug } from '@/app/dashboard/actions'
import { ProjectSettings } from '@/components/dashboard/ProjectSettings'
import { notFound } from 'next/navigation'

export default async function SettingsPage({
    params
}: {
    params: Promise<{ projectSlug: string }>
}) {
    const { projectSlug } = await params
    const project = await getProjectBySlug(projectSlug)

    if (!project) {
        notFound()
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Paramètres du projet</h1>
                <p className="text-gray-500 mt-1">Gérez les informations générales et la suppression de votre projet.</p>
            </div>

            <ProjectSettings project={project} />
        </div>
    )
}
