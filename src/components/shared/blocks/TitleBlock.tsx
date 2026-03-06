import { ThemeConfig } from '@/types/database'

interface TitleBlockProps {
    content: {
        title: string
        align?: 'left' | 'center' | 'right'
    }
    config: ThemeConfig
}

export function TitleBlock({ content, config }: TitleBlockProps) {
    const alignClass = content.align === 'center' ? 'pico-text-center' : content.align === 'right' ? 'pico-text-right' : 'pico-text-left'

    return (
        <h2 className={`pico-title ${alignClass}`}>
            {content.title}
        </h2>
    )
}
