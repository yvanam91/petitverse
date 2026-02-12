'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { checkUsernameAvailability, checkEmailAvailability, signup } from './actions'

const normalizeForSlug = (name: string) => {

    return name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
        .replace(/['’]/g, "")             // Supprime les apostrophes
        .replace(/\s+/g, '_')             // Espaces -> Underscores (_)
        .replace(/[^\w-]/g, '');          // Ne garde que alphanumérique, _ et -
}

export default function SignupPage() {
    const [loading, setLoading] = useState(false)

    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState<string | null>(null)
    const [isEmailChecking, setIsEmailChecking] = useState(false)
    const [isEmailValid, setIsEmailValid] = useState(false)

    const [username, setUsername] = useState('')

    const [usernameError, setUsernameError] = useState<string | null>(null)
    const [isUsernameValid, setIsUsernameValid] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rgpd, setRgpd] = useState(false)
    const [signupSuccess, setSignupSuccess] = useState(false)
    const router = useRouter()

    const normalizedUsername = normalizeForSlug(username)

    const passwordCriteria = [
        { label: 'Au moins 10 caractères', valid: password.length >= 10 },
        { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
        { label: 'Une minuscule', valid: /[a-z]/.test(password) },
    ]

    const handleUsernameBlur = async () => {
        if (!username) return

        if (normalizedUsername.length < 3) {
            setUsernameError('Trop court (3 caractères minimum)')
            setIsUsernameValid(false)
            return
        }

        const result = await checkUsernameAvailability(normalizedUsername)
        if (!result.available) {
            setUsernameError(result.error || 'Non disponible')
            setIsUsernameValid(false)
        } else {
            setUsernameError(null)
            setIsUsernameValid(true)
        }
    }

    const handleEmailBlur = async () => {
        if (!email) return

        // Basic format check before server call
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setEmailError('Format d\'email invalide')
            setIsEmailValid(false)
            return
        }

        setIsEmailChecking(true)
        const result = await checkEmailAvailability(email)
        setIsEmailChecking(false)

        if (!result.available) {
            setEmailError(result.error || 'Email non disponible')
            setIsEmailValid(false)
        } else {
            setEmailError(null)
            setIsEmailValid(true)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault()
        setLoading(true)

        if (!isUsernameValid) {
            toast.error('Veuillez choisir un nom d\'utilisateur valide')
            setLoading(false)
            return
        }

        const formData = new FormData(e.currentTarget)
        // Overwrite the raw username with the normalized one for submission
        formData.set('username', normalizedUsername)

        const result = await signup({}, formData)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else if (result.success) {
            setSignupSuccess(true)
            toast.success('Inscription réussie !')
            // Delay redirect slightly for UX
            setTimeout(() => {
                router.push('/login')
            }, 5000)
        }
    }

    if (signupSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-black/5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Vérifiez vos emails</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Un lien de confirmation a été envoyé à <strong>{email}</strong>.<br />
                        Veuillez cliquer dessus pour activer votre compte.
                    </p>
                    <div className="mt-6">
                        <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg ring-1 ring-black/5">

                {/* Toggle Header */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-full flex text-sm font-medium">
                        <Link href="/login" className="px-6 py-2 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                            Connexion
                        </Link>
                        <span className="px-6 py-2 rounded-full bg-white text-gray-900 shadow-sm">
                            S'inscrire
                        </span>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Créer un compte
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Rejoignez PetitVerse aujourd'hui
                    </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>

                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                            Nom d'utilisateur
                        </label>
                        <div className="mt-2 relative">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                maxLength={20}
                                onChange={(e) => {
                                    const value = e.target.value
                                    // Autorise : Lettres (a-z, A-Z), Chiffres, Accents/Cédilles (\u00C0-\u017F), 
                                    // Espaces, Tirets (-), Underscores (_), Apostrophes ('’)
                                    const filteredValue = value.replace(/[^a-zA-Z0-9\s\-_'’\u00C0-\u017F]/g, '')

                                    if (filteredValue.length <= 20) {
                                        setUsername(filteredValue)
                                        setUsernameError(null)
                                        setIsUsernameValid(false)
                                    }
                                }}
                                onBlur={handleUsernameBlur}
                                className={`block w-full rounded-md border-0 py-2.5 pl-4 pr-16 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${usernameError ? 'ring-red-300 focus:ring-red-600' :
                                    isUsernameValid ? 'ring-green-300 focus:ring-green-600' : 'ring-gray-300 focus:ring-indigo-600'
                                    }`}
                                placeholder="Votre nom"
                            />
                            {/* Counter */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-gray-400">
                                {username.length}/20
                            </div>

                            {isUsernameValid && (
                                <div className="absolute inset-y-0 right-12 flex items-center pr-3 pointer-events-none">
                                    <Check className="h-5 w-5 text-green-500" />
                                </div>
                            )}
                        </div>
                        {usernameError && (
                            <p className="mt-1 text-xs text-red-600">{usernameError}</p>
                        )}
                        {!usernameError && username && (
                            <p className="mt-1 text-xs text-gray-500 truncate">
                                Votre URL : <span className="font-mono text-indigo-600">petitverse.com/p/@{normalizedUsername}</span>
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            Adresse email
                        </label>
                        <div className="mt-2 relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setEmailError(null)
                                    setIsEmailValid(false)
                                }}
                                onBlur={handleEmailBlur}
                                className={`block w-full rounded-md border-0 py-2.5 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${emailError ? 'ring-red-300 focus:ring-red-600' :
                                    isEmailValid ? 'ring-green-300 focus:ring-green-600' : 'ring-gray-300 focus:ring-indigo-600'
                                    }`}
                                placeholder="exemple@email.com"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                {isEmailChecking ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                ) : isEmailValid ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : null}
                            </div>
                        </div>
                        {emailError && (
                            <p className="mt-1 text-xs text-red-600">{emailError}</p>
                        )}
                    </div>


                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                            Mot de passe
                        </label>
                        <div className="mt-2 relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-2.5 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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

                        {/* Password Strength */}
                        <div className="mt-2 space-y-1">
                            {passwordCriteria.map((criterion, idx) => (
                                <div key={idx} className="flex items-center text-xs">
                                    <div className={`h-1.5 w-1.5 rounded-full mr-2 ${criterion.valid ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className={criterion.valid ? 'text-green-700 font-medium' : 'text-gray-500'}>
                                        {criterion.label}
                                    </span>
                                    {criterion.valid && <Check className="ml-1 h-3 w-3 text-green-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                            Confirmation
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`block w-full rounded-md border-0 py-2.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${confirmPassword && password !== confirmPassword
                                    ? 'ring-red-300 focus:ring-red-600'
                                    : 'ring-gray-300 focus:ring-indigo-600'
                                    }`}
                                placeholder="••••••••"
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
                            )}
                        </div>
                    </div>

                    {/* RGPD */}
                    <div className="flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                                id="rgpd"
                                name="rgpd"
                                type="checkbox"
                                required
                                checked={rgpd}
                                onChange={(e) => setRgpd(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor="rgpd" className="text-gray-600">
                                J'accepte les conditions d'utilisation et la politique de confidentialité (RGPD).
                            </label>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !isUsernameValid || !rgpd || password !== confirmPassword || isEmailChecking}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >

                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Je m'inscris"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
