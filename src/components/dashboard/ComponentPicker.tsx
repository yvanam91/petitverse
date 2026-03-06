import { X, Type, Link, Image, Share2, LayoutTemplate, Minus, Heading, Columns, ImageIcon, FileText } from 'lucide-react'

interface ComponentPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (type: string) => void
}

export function ComponentPicker({ isOpen, onClose, onSelect }: ComponentPickerProps) {
    if (!isOpen) return null

    const contentBlocks = [
        { id: 'header', label: 'En-tête', icon: LayoutTemplate, description: 'Profil et bio' },
        { id: 'title', label: 'Titre', icon: Heading, description: 'Titre de section' },
        { id: 'text', label: 'Texte', icon: Type, description: 'Paragraphe simple' },
        { id: 'image', label: 'Image', icon: Image, description: 'Image simple' },
        { id: 'hero', label: 'Hero', icon: ImageIcon, description: 'Grande image avec texte' },
        { id: 'separator', label: 'Séparateur', icon: Minus, description: 'Ligne de séparation' },
    ]

    const mediaBlocks = [
        { id: 'link', label: 'Lien', icon: Link, description: 'Lien externe' },
        { id: 'double-link', label: '2 Liens', icon: Columns, description: 'Liens côte à côte' },
        { id: 'embed', label: 'Média / Intégration', icon: ImageIcon, description: 'YouTube, Spotify, etc.' },
        { id: 'social_grid', label: 'Social', icon: Share2, description: 'Réseaux sociaux' },
    ]

    const renderBlockGrid = (blocks: typeof contentBlocks) => (
        <div className="grid grid-cols-1 min-[545px]:grid-cols-2 md:grid-cols-3 gap-4">
            {blocks.map((comp) => (
                <button
                    key={comp.id}
                    onClick={() => onSelect(comp.id)}
                    className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-3 p-4 rounded-xl border border-white/5 bg-pv-dark-100/50 hover:bg-pv-brand-500/10 hover:border-pv-brand-500 transition-all text-left sm:text-center group"
                >
                    <div className="p-3 bg-pv-dark-200 text-pv-white-0 rounded-xl border border-white/5 group-hover:text-pv-brand-500 group-hover:border-pv-brand-500/30 transition-all">
                        <comp.icon className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col sm:items-center">
                        <span className="block font-pv-jost font-bold text-pv-16 text-pv-white-0 group-hover:text-pv-brand-500 transition-colors uppercase tracking-tight">
                            {comp.label}
                        </span>
                        <span className="text-[11px] text-pv-white-0/40 font-pv-jost uppercase tracking-widest leading-none mt-1 group-hover:text-pv-white-0/60 transition-colors">
                            {comp.description}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-pv-dark-200 shadow-2xl transition-all duration-300
                max-h-[85vh] overflow-y-auto scrollbar-hide
                rounded-t-[20px] sm:rounded-xl
                p-6 sm:p-8
                animate-in slide-in-from-bottom sm:zoom-in-95"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-pv-24 font-pv-jost font-bold text-pv-white-0 uppercase tracking-wider">
                        Ajouter un bloc
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-pv-white-0/40 hover:text-pv-brand-500 transition-colors p-2"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-10">
                    <section>
                        <h3 className="font-pv-jost font-normal text-pv-16 text-pv-white-0/80 mb-2 px-1">Contenu</h3>
                        <div className="h-px w-full bg-white/5 mb-6" />
                        {renderBlockGrid(contentBlocks)}
                    </section>

                    <section>
                        <h3 className="font-pv-jost font-normal text-pv-16 text-pv-white-0/80 mb-2 px-1">Médias</h3>
                        <div className="h-px w-full bg-white/5 mb-6" />
                        {renderBlockGrid(mediaBlocks)}
                    </section>
                </div>
            </div>
        </div>
    )
}
