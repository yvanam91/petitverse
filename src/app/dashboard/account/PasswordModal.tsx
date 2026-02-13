'use client'

import { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { useActionState } from 'react'
import { updatePassword } from './password-actions'
import { toast } from 'sonner'

interface PasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

const initialState = {
    message: '',
    error: '',
    success: false
}

export default function PasswordModal({ isOpen, onClose }: PasswordModalProps) {
    const [state, formAction, isPending] = useActionState(updatePassword, initialState)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Strength requirements
    const hasMinLength = password.length >= 10
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)

    const isValid = hasMinLength && hasUpperCase && hasLowerCase && password === confirmPassword

    useEffect(() => {
        if (state.success) {
            toast.success(state.message)
            onClose()
            // Reset form
            setPassword('')
            setConfirmPassword('')
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state, onClose])

    if (!isOpen) return null

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
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                    >
                        <span className="sr-only">Fermer</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                        Changer de mot de passe
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                        Veuillez saisir votre nouveau mot de passe sécurisé.
                    </div>
                </div>

                <form action={formAction} className="mt-5 sm:mt-6 space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Nouveau mot de passe
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>
                    </div>

                    {/* Criteria List */}
                    <ul className="space-y-1 mt-2 text-xs">
                        <li className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                            {hasMinLength ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mx-1" />}
                            Au moins 10 caractères
                        </li>
                        <li className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                            {hasUpperCase ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mx-1" />}
                            Une majuscule
                        </li>
                        <li className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                            {hasLowerCase ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mx-1" />}
                            Une minuscule
                        </li>
                    </ul>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirmer le mot de passe
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={!isValid || isPending}
                            className={`
                                inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2
                                ${(!isValid || isPending) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#7C3AED] hover:bg-[#6D28D9]'}
                            `}
                        >
                            {isPending && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                            Mettre à jour
                        </button>
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
