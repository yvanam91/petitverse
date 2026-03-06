import { ThemeConfig } from '@/types/database'

interface HeroBlockProps {
    content: {
        title: string
        text: string
        url?: string
    }
    config: ThemeConfig
}

export function HeroBlock({ content, config }: HeroBlockProps) {
    return (
        <div className="w-full flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-2xl shadow-sm my-4">
            {content.url && (
                <div className="w-full md:w-1/2">
                    <img
                        src={content.url}
                        alt={content.title}
                        className="w-full h-64 object-cover rounded-xl shadow-sm"
                    />
                </div>
            )}
            <div className={`w-full ${content.url ? 'md:w-1/2' : ''} flex flex-col gap-3 text-center md:text-left`}>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: '#1f2937' }}>
                    {content.title}
                </h2>
                <p className="leading-relaxed whitespace-pre-wrap opacity-80" style={{ color: '#4b5563' }}>
                    {content.text}
                </p>
            </div>
        </div>
    )
}
