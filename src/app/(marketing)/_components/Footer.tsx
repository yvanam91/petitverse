import Link from 'next/link'

export function Footer() {
    return (
        <footer className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
                <div className="flex justify-center space-x-6 md:order-2">
                    <Link href="/cgu" className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
                        CGU
                    </Link>
                    <Link href="/mentions-legales" className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
                        Mentions légales
                    </Link>
                    <Link href="/contact" className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
                        Contact
                    </Link>
                </div>
                <div className="mt-8 md:order-1 md:mt-0">
                    <p className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        &copy; {new Date().getFullYear()} Picoverse.
                    </p>
                </div>
            </div>
        </footer>
    )
}
