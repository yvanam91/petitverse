'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { forgotPassword } from '../actions'

type ActionState = {
    error?: string
    success?: boolean
    message?: string
}

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        forgotPassword,
        { error: '' }
    )

    if (state.success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-black/5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Mail className="h-8 w-8 text-black" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Email envoyé</h2>
                    <p className="mt-4 text-base text-gray-600 leading-relaxed">
                        {state.message}
                    </p>
                    <div className="mt-8">
                        <Link
                            href="/login"
                            className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-black/5">
                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-black mb-6 transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Retour
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Mot de passe oublié
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Saisissez votre e-mail pour recevoir un lien de réinitialisation
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={formAction}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            Adresse email
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 pl-4"
                                placeholder="exemple@email.com"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-700">{state.error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex w-full justify-center rounded-md bg-black px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Réinitialiser le mot de passe'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
