'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react' // or react-dom if using canary, next 15+ uses React.useActionState
// Next.js 16/React 19 might use 'react'
import { updateProfile } from './actions'
import { Loader2, Lock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import PasswordModal from './PasswordModal'
import DeleteAccountModal from './DeleteAccountModal'

interface AccountFormClientProps {
    initialProfile: {
        full_name: string
        username: string
        email: string
    }
}

const initialState = {
    message: '',
    error: '',
    success: false
}

export default function AccountFormClient({ initialProfile }: AccountFormClientProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState)
    const [fullName, setFullName] = useState(initialProfile.full_name || '')
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const router = useRouter()

    const isDirty = fullName !== (initialProfile.full_name || '')

    useEffect(() => {
        if (state.success) {
            toast.success(state.message)
            router.refresh()
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state, router])

    return (
        <>
            <form action={formAction} className="space-y-6">
                {/* Information Personnelles */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Informations Personnelles</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nom d'affichage</label>
                            <div className="mt-1">
                                <input
                                    id="full_name"
                                    name="full_name"
                                    type="text"
                                    maxLength={20}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                    placeholder="Votre nom"
                                />
                                <div className="mt-1 flex justify-end">
                                    <span className="text-xs text-gray-400">{fullName.length}/20</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slug Picoverse</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    disabled
                                    value={initialProfile.username}
                                    className="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm sm:text-sm px-3 py-2 border cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    disabled
                                    value={initialProfile.email}
                                    className="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm sm:text-sm px-3 py-2 border cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sécurité */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-medium text-gray-900">Sécurité</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <div className="mt-1 text-sm text-gray-500 font-mono tracking-widest">
                                    ••••••••••••
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Changer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Zone de Danger */}
                <div className="bg-red-50 rounded-lg border border-red-200 shadow-sm overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-red-200 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-medium text-red-900">Zone de Danger</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-red-700 mb-4">
                            Une fois supprimé, votre profil et tous vos projets Picoverse seront effacés définitivement.
                        </p>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Supprimer le compte
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={!isDirty || isPending}
                        className={`
                            inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
                            ${(!isDirty || isPending)
                                ? 'bg-gray-300 cursor-not-allowed hover:bg-gray-300'
                                : 'bg-[#7C3AED] hover:bg-[#6D28D9]'}
                        `}
                    >
                        {isPending && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                        Confirmer les changements
                    </button>
                </div>
            </form>

            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </>
    )
}
