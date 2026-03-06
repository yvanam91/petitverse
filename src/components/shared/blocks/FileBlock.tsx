import { FileText } from 'lucide-react'
import { ThemeConfig } from '@/types/database'

interface FileBlockProps {
    content: {
        url: string
        title?: string
    }
    config: ThemeConfig
}

export function FileBlock({ content, config }: FileBlockProps) {
    return (
        <a
            href={content.url}
            download
            className="group flex w-full items-center gap-4 rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:ring-2 hover:ring-indigo-500 backdrop-blur-sm"
        >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium text-gray-900">
                    {content.title || 'Document'}
                </p>
                <p className="text-sm text-gray-500">
                    Télécharger le fichier
                </p>
            </div>
        </a>
    )
}
