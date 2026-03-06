import { ThemeConfig } from '@/types/database'

interface TextBlockProps {
    content: {
        text: string
        align?: 'left' | 'center' | 'right' | 'justify'
    }
    config: ThemeConfig
}

export function TextBlock({ content, config }: TextBlockProps) {
    const alignClass = content.align === 'center' ? 'pico-text-center' : content.align === 'right' ? 'pico-text-right' : content.align === 'justify' ? 'text-justify' : 'pico-text-left'

    return (
        <div className={`pico-text-block ${alignClass}`}>
            {content.text}
        </div>
    )
}
