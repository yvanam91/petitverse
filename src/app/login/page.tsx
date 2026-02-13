'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { signIn } from '../auth/actions'


export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [state, formAction, isPending] = useActionState(signIn, { error: '' })

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-black/5">

                {/* Toggle Header */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-full flex text-sm font-medium">
                        <span className="px-6 py-2 rounded-full bg-white text-gray-900 shadow-sm">
                            Connexion
                        </span>
                        <Link href="/signup" className="px-6 py-2 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                            S'inscrire
                        </Link>
                    </div>
                </div>

                <div className="text-center">

                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Connexion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Accédez à votre espace sécurisé
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={formAction}>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium leading-6 text-gray-900"
                            >
                                Adresse email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
                                    placeholder="exemple@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium leading-6 text-gray-900"
                            >
                                Mot de passe
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="text-sm text-red-700">
                                    {state.error}
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
