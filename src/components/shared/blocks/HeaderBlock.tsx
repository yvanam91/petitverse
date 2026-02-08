import { PageConfig } from '@/types/database'

interface HeaderBlockProps {
    content: {
        title?: string
        subtitle?: string
        url?: string
    }
    config: PageConfig
}

export function HeaderBlock({ content, config }: HeaderBlockProps) {
    const textColor = config.colors?.text || config.textColor || '#1f2937'
    const fontFamily = config.typography?.fontFamily || config.fontFamily || 'Inter, sans-serif'

    return (
        <div className="text-center mb-6 w-full" style={{ fontFamily }}>
            {content.url && (
                <div className="relative w-28 h-28 mx-auto mb-4">
                    <img
                        src={content.url}
                        alt={content.title || 'Header'}
                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-md"
                    />
                </div>
            )}
            {content.title && <h2 className="text-2xl font-bold" style={{ color: textColor }}>{content.title}</h2>}
            {content.subtitle && <p className="text-lg opacity-80 mt-1" style={{ color: textColor }}>{content.subtitle}</p>}
        </div>
    )
}
