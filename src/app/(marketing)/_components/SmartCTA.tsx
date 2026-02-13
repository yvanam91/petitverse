import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { cn } from '@/lib/utils'

interface SmartCTAProps {
    className?: string
    variant?: 'navbar' | 'hero'
}

export async function SmartCTA({ className, variant = 'hero' }: SmartCTAProps) {
    const cookieStore = await cookies()
    const isRecognized = cookieStore.get('recognized')
    const supabase = await createClient()

    // Check session only if recognized cookie exists to save resources/time if not needed?
    // User prompt: "Utilise supabase.auth.getUser() pour vérifier si une session active existe."
    // Logic: 
    // - Cookie ABSENT -> "Démarrer" -> /signup
    // - Cookie PRESENT -> "Accéder à mon compte" -> Check Session -> /dashboard or /login

    let href = '/signup'
    let label = 'Démarrer'

    if (isRecognized) {
        const { data: { user } } = await supabase.auth.getUser()
        href = user ? '/dashboard' : '/login'
        label = 'Accéder à mon compte'
    }

    if (variant === 'navbar') {
        if (isRecognized) {
            return (
                <Link
                    href={href}
                    className={cn(
                        "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
                        className
                    )}
                >
                    {label}
                </Link>
            )
        } else {
            return (
                <Link
                    href={href}
                    className={cn(
                        "inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90",
                        className
                    )}
                >
                    {label}
                </Link>
            )
        }
    }

    // Hero variant
    return (
        <Link
            href={href}
            className={cn(
                "rounded-[var(--radius)] bg-[var(--primary)] px-8 py-3 text-base font-semibold text-white shadow-sm hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
                className
            )}
        >
            {label}
        </Link>
    )
}
