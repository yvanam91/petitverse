import { ThemeConfig } from '@/types/database'

interface ImageBlockProps {
    content: {
        url: string
        title?: string
    }
    config: ThemeConfig
}

export function ImageBlock({ content, config }: ImageBlockProps) {
    return (
        <div className="w-full">
            <img
                src={content.url}
                alt={content.title || 'Image'}
                className="w-full h-auto rounded-lg shadow-sm"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
        </div>
    )
}
