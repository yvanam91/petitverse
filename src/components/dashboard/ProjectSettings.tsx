'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProjectName, deleteProject } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { AlertTriangle, Trash2, Loader2, Save } from 'lucide-react'
import { Project } from '@/types/database'

interface ProjectSettingsProps {
    project: Project
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
    const router = useRouter()
    const [name, setName] = useState(project.name)
    const [isRenaming, setIsRenaming] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleRename(e: React.FormEvent) {
        e.preventDefault()
        setIsRenaming(true)
        try {
            const result = await updateProjectName(project.id, name)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Nom du projet mis à jour')
                if (result.newSlug) {
                    // Redirect to new slug URL
                    router.push(`/dashboard/${result.newSlug}/settings`)
                } else {
                    router.refresh()
                }
            }
        } catch (error) {
            toast.error('Une erreur est survenue lors de la modification')
        } finally {
            setIsRenaming(false)
        }
    }

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const result = await deleteProject(project.id)
            if (result?.error) {
                toast.error(result.error)
                setIsDeleting(false)
            } else {
                toast.success('Projet supprimé')
                // Redirect is handled by server action or we can fallback here
            }
        } catch (error) {
            toast.error('Une erreur est survenue lors de la suppression')
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Rename Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Nom du projet</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Le nom de votre projet est visible publiquement.
                    </p>

                    <form onSubmit={handleRename} className="max-w-md">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                placeholder="Nom du projet"
                            />
                            <button
                                type="submit"
                                disabled={isRenaming || name === project.name}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRenaming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {isRenaming ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-red-600 mb-1">Zone de danger</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Une fois que vous supprimez un projet, il n'y a pas de retour en arrière. S'il vous plaît soyez certain.
                    </p>

                    <button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="inline-flex items-center rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 border border-red-200 transition-colors"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer le projet
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Supprimer le projet ?
                                </h3>
                                <div className="mt-1">
                                    <p className="text-sm text-gray-500">
                                        Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-red-50 p-3 rounded-md border border-red-100">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                                />
                                <span className="text-sm text-red-800 font-medium select-none">
                                    Je confirme vouloir supprimer définitivement ce projet et toutes ses pages.
                                </span>
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false)
                                    setDeleteConfirm(false)
                                }}
                                disabled={isDeleting}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={!deleteConfirm || isDeleting}
                                className="inline-flex justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    'Confirmer la suppression'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
