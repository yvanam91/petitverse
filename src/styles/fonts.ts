import { Inter, Open_Sans, Montserrat, Lexend, Space_Grotesk } from 'next/font/google'

export const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

export const openSans = Open_Sans({
    subsets: ['latin'],
    variable: '--font-open-sans',
    display: 'swap',
})

export const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    display: 'swap',
})

export const lexend = Lexend({
    subsets: ['latin'],
    variable: '--font-lexend',
    display: 'swap',
})

export const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-space-grotesk',
    display: 'swap',
})

export const fontVariables = `${inter.variable} ${openSans.variable} ${montserrat.variable} ${lexend.variable} ${spaceGrotesk.variable}`

export const fontMap: Record<string, string> = {
    'inter': 'var(--font-inter)',
    'open-sans': 'var(--font-open-sans)',
    'montserrat': 'var(--font-montserrat)',
    'lexend': 'var(--font-lexend)',
    'space-grotesk': 'var(--font-space-grotesk)',
}
