'use client'
import { useState } from 'react'
import { CreatePageModal } from './CreatePageModal'
import { File, ArrowLeft, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Page, Project } from '@/types/database'
import { PageCard } from './PageCard'

interface ProjectViewProps {
    project: Project
    initialPages: Page[]
}

export function ProjectView({ project, initialPages }: ProjectViewProps) {
    const [pages, setPages] = useState<Page[]>(initialPages)

    const handlePageCreated = (newPage: Page) => {
        setPages((prev) => [newPage, ...prev])
    }

    const handlePageDeleted = (pageId: string) => {
        setPages((prev) => prev.filter(p => p.id !== pageId))
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                {project.name}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez les pages de votre projet
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            <main>
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pages.map((page) => (
                            <PageCard
                                key={page.id}
                                page={page}
                                projectSlug={project.slug}
                                onDelete={handlePageDeleted}
                            />
                        ))}

                        <CreatePageModal projectId={project.id} onSuccess={handlePageCreated}>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[200px] hover:border-indigo-500 hover:bg-gray-50 cursor-pointer transition-all group">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors mb-4">
                                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-indigo-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Ajouter une page</span>
                                <span className="text-xs text-gray-500 mt-1">Créez une nouvelle page pour votre projet</span>
                            </div>
                        </CreatePageModal>
                    </div>

                    {pages.length === 0 && (
                        <div className="hidden">
                            {/* Fallback or specific empty state logic if we didn't want the Add Card in grid. 
                                 But user requested Add Card as last item, so even if list is empty, 
                                 the Add Card above serves as the empty state action. 
                             */}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
