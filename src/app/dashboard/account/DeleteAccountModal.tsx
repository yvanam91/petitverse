'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { deleteUserAccount } from './delete-actions'
import { toast } from 'sonner'

interface DeleteAccountModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
    const [confirmationText, setConfirmationText] = useState('')
    const [isPending, startTransition] = useTransition()

    if (!isOpen) return null

    const handleConfirm = () => {
        if (confirmationText !== 'SUPPRIMER') return

        startTransition(async () => {
            const result = await deleteUserAccount()
            if (result && result.error) {
                toast.error(result.error)
            } else {
                // Redirect happens on server
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Modal Panel */}
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                            Supprimer le compte
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Cette action est <span className="font-bold text-red-600">irréversible</span>.
                                Pour confirmer la suppression de votre compte et de toutes vos données,
                                veuillez taper <span className="font-mono font-bold select-all">SUPPRIMER</span> dans le champ ci-dessous.
                            </p>
                        </div>
                        <div className="mt-4">
                            <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border placeholder-gray-300"
                                placeholder="SUPPRIMER"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className={`
                            inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto
                            ${(confirmationText === 'SUPPRIMER' && !isPending)
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-gray-300 cursor-not-allowed'}
                        `}
                        disabled={confirmationText !== 'SUPPRIMER' || isPending}
                        onClick={handleConfirm}
                    >
                        {isPending && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                        Confirmer la suppression
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    )
}
