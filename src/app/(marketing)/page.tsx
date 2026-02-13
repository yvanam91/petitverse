import Link from 'next/link'
import { SolutionsSection } from './_components/SolutionsSection'
import { PricingSection } from './_components/PricingSection'
import { Footer } from './_components/Footer'
import { SmartCTA } from './_components/SmartCTA'

export default function LandingPage() {
    return (

        <div className="flex flex-col min-h-screen">
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
                <div className="max-w-4xl space-y-8">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-[var(--foreground)] font-[var(--font-heading)]">
                        Picoverse : Le page builder minimal pour vos ambitions web.
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                        Déployez vos pages en quelques minutes... Prenez le contrôle de votre présence sans la complexité technique.
                    </p>

                    <div className="flex justify-center">
                        <SmartCTA variant="hero" />
                    </div>

                    <div className="mt-16 relative w-full aspect-video rounded-[var(--radius)] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                            <span className="text-sm">Image Placeholder (16/9)</span>
                        </div>
                    </div>
                </div>
            </div>

            <SolutionsSection />
            <PricingSection />
            <Footer />
        </div>
    )
}
