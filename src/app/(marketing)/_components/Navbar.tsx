import Link from 'next/link'
import { SmartCTA } from './SmartCTA'

export function Navbar() {

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-md dark:bg-black/80 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-8">
                <Link href="/" className="text-xl font-bold tracking-tight">
                    Picoverse
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    <Link href="#solutions" className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">
                        Solutions
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">
                        Tarifs
                    </Link>
                    <span className="text-sm font-medium text-zinc-400 cursor-not-allowed dark:text-zinc-600 select-none">
                        Centre d'aide
                    </span>
                </div>
            </div>


            <div>
                <SmartCTA variant="navbar" />
            </div>
        </nav>
    )
}
