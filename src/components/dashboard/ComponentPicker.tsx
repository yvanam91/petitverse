import { X, Type, Link, Image, Share2, LayoutTemplate, Minus, Heading, Columns, ImageIcon, FileText } from 'lucide-react'

interface ComponentPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (type: string) => void
}

export function ComponentPicker({ isOpen, onClose, onSelect }: ComponentPickerProps) {
    if (!isOpen) return null

    const components = [
        { id: 'text', label: 'Texte', icon: Type, description: 'Paragraphe simple' },
        { id: 'link', label: 'Lien', icon: Link, description: 'Lien externe' },
        { id: 'image', label: 'Image', icon: Image, description: 'Image simple' }, // Note: This might need special handling for upload
        { id: 'social_grid', label: 'Social', icon: Share2, description: 'Réseaux sociaux' },
        // Keeping other existing types available
        { id: 'header', label: 'En-tête', icon: LayoutTemplate, description: 'Profil et bio' },
        { id: 'title', label: 'Titre', icon: Heading, description: 'Titre de section' },
        { id: 'separator', label: 'Séparateur', icon: Minus, description: 'Ligne de séparation' },
        { id: 'double-link', label: '2 Liens', icon: Columns, description: 'Liens côte à côte' },
        { id: 'hero', label: 'Hero', icon: ImageIcon, description: 'Grande image avec texte' },
        // { id: 'file', label: 'Fichier', icon: FileText, description: 'Fichier à télécharger' }, // Usually triggers upload directly
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Ajouter un composant
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {components.map((comp) => (
                        <button
                            key={comp.id}
                            onClick={() => onSelect(comp.id)}
                            className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                        >
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md group-hover:bg-white group-hover:shadow-sm transition-colors">
                                <comp.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="block font-medium text-gray-900">{comp.label}</span>
                                <span className="text-xs text-gray-500">{comp.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
