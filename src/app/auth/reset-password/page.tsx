'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '../actions'
import { toast } from 'sonner'
import Link from 'next/link'

type ActionState = {
    error?: string
    success?: boolean
    message?: string
}

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        resetPassword,
        { error: '' }
    )
    const router = useRouter()

    if (state.success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-black/5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Mot de passe modifié</h2>
                    <p className="mt-4 text-base text-gray-600">
                        {state.message}
                    </p>
                    <div className="mt-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors"
                        >
                            Accéder à mon Dashboard
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
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Nouveau mot de passe
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Choisissez un mot de passe sécurisé pour votre compte
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={formAction}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Nouveau mot de passe
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 pl-4 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                                Confirmer le mot de passe
                            </label>
                            <div className="mt-2">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 pl-4"
                                    placeholder="••••••••"
                                />
                            </div>
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
                                'Enregistrer le nouveau mot de passe'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
