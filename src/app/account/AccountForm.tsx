'use client'

import { useActionState } from 'react'
import { updateUsername } from './actions'

const initialState = {
    error: '',
    success: false
}

export function AccountForm({ initialUsername }: { initialUsername: string | null }) {
    const [state, formAction, isPending] = useActionState(updateUsername, initialState)

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    defaultValue={initialUsername || ''}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="votre_nom_utilisateur"
                />
                <p className="mt-1 text-sm text-gray-500">
                    Ce nom d'utilisateur sera utilisé dans vos URLs publiques :<br />
                    <span className="font-mono text-xs bg-gray-100 p-1 rounded">korner.com/p/{initialUsername || '[username]'}/...</span>
                </p>
                {state?.error && (
                    <p className="mt-2 text-sm text-red-600">
                        {state.error}
                    </p>
                )}
                {state?.success && (
                    <p className="mt-2 text-sm text-green-600">
                        Nom d'utilisateur mis à jour avec succès !
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
        </form>
    )
}
