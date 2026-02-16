'use client'

import { PageConfig } from '@/types/database'
import { ExternalLink } from 'lucide-react'

interface DoubleLinkBlockProps {
    content: {
        links: Array<{
            label: string
            url: string
            icon?: string
        }>
    }
    config: PageConfig
}

export function DoubleLinkBlock({ content, config }: DoubleLinkBlockProps) {
    const links = content.links || []
    // Ensure we have at least 2 slots to render, even if empty, but usually content.links should have 2 items.
    // If less, we render what we have.

    // Helper to get button inline styles (Same as LinkBlock but potentially smaller or adapted)
    const getButtonStyle = (): React.CSSProperties => {
        const primary = config.colors?.primary || config.buttonColor || '#000000'
        const secondary = config.colors?.secondary || config.secondaryColor || '#e5e7eb'
        const buttonText = config.colors?.buttonText || config.buttonTextColor || '#ffffff'
        const fontFamily = config.typography?.fontFamily || config.fontFamily || 'Inter, sans-serif'

        const buttonStyle = config.buttonStyle || 'rounded-md'
        const buttonVariant = config.buttonVariant || 'fill'

        const baseStyle: React.CSSProperties = {
            borderRadius: config.borders?.radius || (buttonStyle === 'rounded-full' ? '9999px' : buttonStyle === 'rounded-none' ? '0px' : '8px'),
            borderWidth: config.borders?.width || (buttonVariant === 'outline' ? '2px' : buttonVariant === 'soft-shadow' ? '1px' : '0px'),
            fontFamily: fontFamily,
            transition: 'all 0.2s',
            borderStyle: config.borders?.style || 'solid',
            backgroundColor: primary,
            color: buttonText,
            borderColor: secondary, // Use secondary
            boxShadow: 'var(--pico-shadow)'
        }

        // Simplified variant logic for DoubleLink (can be expanded if needed, for now sticking to primary fill)
        // If we want to support variants, we need to copy logic from LinkBlock completely or refactor 'getButtonStyle' to a hook/utility.
        // For now, copying standard logic for consistency.

        if (buttonVariant === 'outline') {
            return {
                ...baseStyle,
                backgroundColor: 'transparent',
                color: primary,
                borderColor: secondary // Use secondary
            }
        } else if (buttonVariant === 'soft-shadow') {
            return {
                ...baseStyle,
                backgroundColor: '#ffffff',
                color: '#000000',
                boxShadow: `0 4px 12px ${primary}40`,
                borderColor: secondary, // Use secondary
                borderWidth: '1px'
            }
        }

        return baseStyle
    }

    const buttonStyle = getButtonStyle()

    return (
        <div className="grid grid-cols-2 gap-4 w-full">
            {links.map((link, index) => (
                <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex w-full items-center justify-center px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md hover:opacity-95"
                    style={buttonStyle}
                >
                    <div className="font-medium text-sm md:text-base text-center truncate px-2 w-full">
                        {link.label || 'Lien'}
                    </div>
                </a>
            ))}
        </div>
    )
}
