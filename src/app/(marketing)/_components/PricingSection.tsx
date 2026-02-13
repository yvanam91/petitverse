import { Section } from './Section'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

const FEATURES = [
    { name: 'Pages', free: '3 pages', paid: '10 pages / projet' },
    { name: 'Projets', free: '1 projet', paid: '3 projets' },
    { name: 'QR Codes', free: true, paid: true },
    { name: 'Raccourcisseur d\'URL', free: true, paid: true },
    { name: 'Analytics basiques', free: true, paid: true },
    { name: 'Domaine personnalisé', free: false, paid: true },
    { name: 'Suppression du branding', free: false, paid: true },
]

export function PricingSection() {
    return (
        <Section id="pricing">
            <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl font-[var(--font-heading)]">
                    Tarifs simples, sans surprise
                </h2>
                <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                    Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt.
                </p>
            </div>

            <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                {/* Free Plan */}
                <div className="rounded-3xl p-8 ring-1 ring-zinc-200 dark:ring-zinc-800 xl:p-10 flex flex-col bg-white dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-x-4">
                        <h3 className="text-lg font-semibold leading-8 text-[var(--foreground)]">Gratuit</h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Pour découvrir Picoverse.</p>
                    <div className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">0€</span>
                        <span className="text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-400">/mois</span>
                    </div>
                    <Link
                        href="/signup"
                        className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 bg-zinc-100 text-[var(--foreground)] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                    >
                        S'inscrire
                    </Link>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300 xl:mt-10">
                        {FEATURES.map((feature) => (
                            <li key={feature.name} className="flex gap-x-3">
                                {feature.free ? (
                                    typeof feature.free === 'string' ? (
                                        <>
                                            <Check className="h-6 w-5 flex-none text-[var(--primary)]" aria-hidden="true" />
                                            <span>{feature.free}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-6 w-5 flex-none text-[var(--primary)]" aria-hidden="true" />
                                            <span>{feature.name}</span>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <X className="h-6 w-5 flex-none text-zinc-400" aria-hidden="true" />
                                        <span className="text-zinc-400 decoration-zinc-400 line-through">{feature.name}</span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Paid Plan */}
                <div className="rounded-3xl p-8 ring-2 ring-[var(--primary)] xl:p-10 flex flex-col bg-white dark:bg-zinc-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-[var(--primary)]/10 blur-3xl rounded-full pointer-events-none"></div>

                    <div className="flex items-center justify-between gap-x-4">
                        <h3 className="text-lg font-semibold leading-8 text-[var(--primary)]">Pro</h3>
                        <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold leading-5 text-[var(--primary)]">Populaire</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Pour les créateurs sérieux.</p>
                    <div className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">5 €</span>
                        <span className="text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-400">/mois</span>
                    </div>
                    <Link
                        href="/signup"
                        className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 bg-[var(--primary)] text-white hover:opacity-90 transition-opacity shadow-sm"
                    >
                        Commencer maintenant
                    </Link>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300 xl:mt-10">
                        {FEATURES.map((feature) => (
                            <li key={feature.name} className="flex gap-x-3">
                                {typeof feature.paid === 'string' ? (
                                    <>
                                        <Check className="h-6 w-5 flex-none text-[var(--primary)]" aria-hidden="true" />
                                        <span>{feature.paid}</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-6 w-5 flex-none text-[var(--primary)]" aria-hidden="true" />
                                        <span>{feature.name}</span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Section>
    )
}
