'use client'

import { Folder, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types/database'
import { useState } from 'react'
import { deleteProject } from './actions'
import { toast } from 'sonner'

export function ProjectCard({ project }: { project: Project }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm('Es-tu sûr de vouloir supprimer ce projet et toutes ses pages ?')) return

        setIsDeleting(true)

        toast.promise(
            async () => {
                const result = await deleteProject(project.id)
                if (result.error) throw new Error(result.error)
                return result
            },
            {
                loading: 'Suppression en cours...',
                success: () => {
                    // Keep isDeleting true to maintain the "deleted" visual state until revalidation removes the card
                    return 'Projet supprimé avec succès'
                },
                error: (err) => {
                    setIsDeleting(false)
                    return `Erreur: ${err.message}`
                }
            }
        )
    }

    return (
        <div
            className={`relative flex flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:ring-gray-900/10 transition-all duration-300 group/card ${isDeleting ? 'opacity-0 scale-95 pointer-events-none' : ''
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-x-3">
                    <div className="rounded-md bg-indigo-50 p-2">
                        <Folder className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold leading-7 text-gray-900">
                        {project.name}
                    </h3>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover/card:opacity-100 focus:opacity-100"
                    title="Supprimer le projet"
                >
                    {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                </button>
            </div>

            <div className="mt-4 flex flex-1 flex-col justify-between">
                <div className="mt-6 flex items-center justify-end">
                    <Link
                        href={`/dashboard/${project.slug}/pages`}
                        className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500 flex items-center gap-1 group"
                    >
                        Voir les pages
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
