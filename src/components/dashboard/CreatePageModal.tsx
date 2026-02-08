'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { createPage } from '../../app/dashboard/actions'
import { slugify } from '@/utils/slugify'
import { useRouter } from 'next/navigation'
import type { Page } from '@/types/database'

import { toast } from 'sonner'

interface CreatePageModalProps {
    projectId: string
    onSuccess?: (page: Page) => void
    children?: React.ReactNode
}

export function CreatePageModal({ projectId, onSuccess, children }: CreatePageModalProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [isSlugEdited, setIsSlugEdited] = useState(false)

    useEffect(() => {
        if (!isSlugEdited) {
            setSlug(slugify(title))
        }
    }, [title, isSlugEdited])

    async function onSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        try {
            const result = await createPage(projectId, formData)

            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
                return
            }

            setIsOpen(false)
            setTitle('')
            setSlug('')
            setDescription('')
            setIsSlugEdited(false)

            if (onSuccess && result?.data) {
                onSuccess(result.data as Page)
            } else {
                // Fallback if no callback provided (e.g. if used elsewhere)
                router.refresh()
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Une erreur est survenue'
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {children ? (
                <div onClick={() => setIsOpen(true)} className="cursor-pointer">
                    {children}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter une page
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Nouvelle page
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={onSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Titre de la page
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    required
                                    maxLength={50}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ma Super Page"
                                    className="mt-1 block w-full rounded-md border-gray-300 text-black placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm border p-2"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="slug"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Slug (URL)
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                        /
                                    </span>
                                    <input
                                        type="text"
                                        name="slug"
                                        id="slug"
                                        required
                                        maxLength={50}
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(e.target.value)
                                            setIsSlugEdited(true)
                                        }}
                                        placeholder="ma-super-page"
                                        className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 text-black placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm border p-2"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Utilisé dans l'URL. Minuscules, chiffres et tirets uniquement.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    id="description"
                                    rows={3}
                                    maxLength={200}
                                    placeholder="Une brève description de votre page..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-black placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm border p-2"
                                />
                                <div className="mt-1 text-right">
                                    <span className={`text-xs ${description.length >= 180 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                        {description.length}/200
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        'Créer'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
