'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, ExternalLink, Calendar, Edit, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deletePage } from '@/app/dashboard/actions'
import type { Page } from '@/types/database'
import { toast } from 'sonner'

interface PageCardProps {
    page: Page
    projectSlug: string
    onDelete?: (pageId: string) => void
}

export function PageCard({ page, projectSlug, onDelete }: PageCardProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deletePage(page.project_id, page.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Page supprimée')
                if (onDelete) {
                    onDelete(page.id)
                } else {
                    router.refresh()
                }
            }
        } catch (e) {
            toast.error('Erreur lors de la suppression')
        } finally {
            setIsDeleting(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date)
    }

    // Extract bio or description if available
    const description = page.description || page.config?.bio || 'Aucune description fournie.'

    return (
        <div className="group relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow h-full">

            <Link href={`/dashboard/${projectSlug}/pages/${page.id}`} className="absolute inset-0 z-0" aria-label={`Editer ${page.title}`} />

            <div className="z-10 pointer-events-none">
                <h3 className="text-lg font-semibold text-indigo-600 mb-2 truncate pr-8">
                    {page.title}
                </h3>

                <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Date de création : {formatDate(page.created_at)}</span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-6 h-14">
                    {description}
                </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 z-10 relative">
                <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Voulez-vous vraiment supprimer la page "${page.title}" ?`)) {
                            handleDelete()
                        }
                    }}
                >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>

                <div className="flex gap-2">
                    {/* Edit Button (Redundant with card click but nice to have distinct visual) */}
                    {/* <Link
                        href={`/dashboard/${projectSlug}/pages/${page.id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                        <Edit className="h-4 w-4" />
                    </Link> */}

                    <a
                        href={`/p/${projectSlug}/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
    )
}
