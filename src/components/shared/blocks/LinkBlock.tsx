import { PageConfig } from '@/types/database'
import { ExternalLink } from 'lucide-react'

interface LinkBlockProps {
    content: {
        title: string
        url: string
    }
    config: PageConfig
}

export function LinkBlock({ content, config }: LinkBlockProps) {
    // Helper to get button inline styles
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
            boxShadow: 'var(--pico-shadow)' // Apply shadow
        }

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
        } else {
            // Default 'fill'
            return {
                ...baseStyle,
                backgroundColor: primary,
                color: buttonText,
                borderColor: secondary // Use secondary for border if defined
            }
        }
    }

    return (
        <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex w-full items-center justify-center px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md hover:opacity-95"
            style={getButtonStyle()}
        >
            <div className="font-medium text-lg text-center">
                {content.title}
            </div>
            <ExternalLink className="absolute right-4 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
    )
}
