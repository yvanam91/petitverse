'use client'

import { useState } from 'react'
import { CreatePageModal } from './CreatePageModal'
import { File, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Page, Project } from '@/types/database'

interface ProjectViewProps {
    project: Project
    initialPages: Page[]
}

export function ProjectView({ project, initialPages }: ProjectViewProps) {
    const [pages, setPages] = useState<Page[]>(initialPages)

    const handlePageCreated = (newPage: Page) => {
        setPages((prev) => [newPage, ...prev])
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 text-black"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour aux projets
                        </Link>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                {project.name}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez les pages de votre projet
                            </p>
                        </div>
                        <CreatePageModal projectId={project.id} onSuccess={handlePageCreated} />
                    </div>
                </div>
            </header>
            <main>
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    {pages && pages.length > 0 ? (
                        <div className="overflow-hidden bg-white shadow sm:rounded-md">
                            <ul role="list" className="divide-y divide-gray-200">
                                {pages.map((page) => (
                                    <li key={page.id}>
                                        <div className="block hover:bg-gray-50">
                                            <div className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <File className="h-5 w-5 text-gray-400" />
                                                        <p className="truncate text-sm font-medium text-indigo-600">
                                                            {page.title}
                                                        </p>
                                                    </div>
                                                    <div className="ml-2 flex flex-shrink-0">
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                            Publié
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 sm:flex sm:justify-between">
                                                    <div className="sm:flex">
                                                        <p className="flex items-center text-sm text-gray-500">
                                                            /{page.slug}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 sm:mt-0">
                                                        <Link
                                                            href={`/dashboard/${project.id}/${page.id}`}
                                                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500 font-semibold"
                                                        >
                                                            Editer
                                                        </Link>
                                                        <Link
                                                            href={`/p/${project.name.toLowerCase().replace(/ /g, '-')}/${page.slug}`}
                                                            target="_blank"
                                                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            Voir
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-300">
                            <File className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                                Aucune page
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Créez votre première page pour ce projet.
                            </p>
                            <div className="mt-6">
                                <CreatePageModal projectId={project.id} onSuccess={handlePageCreated} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
