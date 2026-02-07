'use client'

import { useState, useRef, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { addBlockWithProject, updateBlock, deleteBlock, updatePageConfig, addBlockWithContent, updateBlockPositions, saveTheme, getThemes } from '@/app/dashboard/actions'
import {
    Plus, GripVertical, Save, Loader2, Trash2, Palette, Layers,
    ExternalLink, FileText, Upload, Image as ImageIcon,
    Eye, EyeOff, LayoutTemplate, Minus, Globe, Twitter, Instagram, Facebook, Linkedin, Github,
    AlignLeft, AlignCenter, AlignRight, Type, Heading, Download, Play
} from 'lucide-react'
import type { Block, PageConfig, Theme } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import ClientOnly from '@/components/ClientOnly'
import { toast } from 'sonner'

interface BlockEditorProps {
    projectId: string
    pageId: string
    initialBlocks: Block[]
    initialConfig: PageConfig
}

const DEFAULT_CONFIG: PageConfig = {
    backgroundColor: '#ffffff',
    buttonColor: '#000000',
    buttonTextColor: '#ffffff',
    buttonStyle: 'rounded-md',
    buttonVariant: 'fill',
    fontFamily: 'Inter',
}

// Helper for Social Icons
const SOCIAL_ICONS = [
    { value: 'globe', label: 'Website', icon: Globe },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'github', label: 'GitHub', icon: Github },
]

interface SortableBlockProps {
    block: Block
    isEditing: boolean
    editState: { title: string; url: string; loading: boolean }
    onEditChange: (field: 'title' | 'url', value: string) => void
    onSave: () => void
    onDelete: () => void
    onToggleVisibility: () => void
    onUpdateContent: (content: any) => void
    deleting: boolean
    projectId: string
}

function SortableBlock({ block, isEditing, editState, onEditChange, onSave, onDelete, onToggleVisibility, onUpdateContent, deleting, projectId }: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    }

    // --- Block Specific Renders ---

    const renderHeaderBlock = () => {
        const title = isEditing ? editState.title : block.content.title
        const loading = isEditing && editState.loading

        return (
            <div className="flex flex-col items-center gap-4 p-4">
                <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                        {block.content.url ? (
                            <img src={block.content.url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <LayoutTemplate className="h-8 w-8 text-gray-400" />
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                        <span className="text-xs">Changer</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                // Simplified upload reuse from parent could be passed down, but for now specific here or prop
                                // We'll assume the parent logic is better, but here we need 'onUpdateContent'
                                // Let's trigger a specialized upload here or reusing the existing pattern is better.
                                // For MVP in this file, I'll do a direct upload call here or ask parent.
                                // Passed 'projectId' prop for this.
                                try {
                                    const supabase = createClient()
                                    const { data: { user } } = await supabase.auth.getUser()
                                    if (!user) return

                                    const fileExt = file.name.split('.').pop()
                                    const fileName = `${Date.now()}-profile-${Math.random().toString(36).substring(2)}.${fileExt}`
                                    const filePath = `${user.id}/${fileName}`

                                    const { error } = await supabase.storage.from('uploads').upload(filePath, file)
                                    if (error) throw error

                                    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath)
                                    onUpdateContent({ ...block.content, url: publicUrl })
                                } catch (err) {
                                    alert('Erreur upload')
                                }
                            }}
                        />
                    </label>
                </div>
                <input
                    type="text"
                    value={block.content.title || ''} // Direct edit for header usually
                    onChange={(e) => onUpdateContent({ ...block.content, title: e.target.value })}
                    placeholder="Votre Nom / Titre"
                    className="text-xl font-bold text-center bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none text-gray-900 placeholder:text-gray-400 w-full"
                />
                <input
                    type="text"
                    value={block.content.subtitle || ''} // Subtitle for Bio
                    onChange={(e) => onUpdateContent({ ...block.content, subtitle: e.target.value })}
                    placeholder="Votre Bio / Sous-titre"
                    className="text-sm text-center bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none text-gray-500 placeholder:text-gray-300 w-full"
                />
            </div>
        )
    }

    const renderSocialGrid = () => {
        const links = block.content.links || [] // Array of { icon: string, url: string }

        const addLink = () => {
            const newLinks = [...links, { icon: 'globe', url: '' }]
            onUpdateContent({ ...block.content, links: newLinks })
        }

        const updateLink = (index: number, field: 'icon' | 'url', value: string) => {
            const newLinks = [...links]
            newLinks[index] = { ...newLinks[index], [field]: value }
            onUpdateContent({ ...block.content, links: newLinks })
        }

        const removeLink = (index: number) => {
            const newLinks = links.filter((_: any, i: number) => i !== index)
            onUpdateContent({ ...block.content, links: newLinks })
        }

        return (
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {links.map((link: any, index: number) => {
                        const IconObj = SOCIAL_ICONS.find(i => i.value === link.icon) || SOCIAL_ICONS[0]
                        const Icon = IconObj.icon
                        return (
                            <div key={index} className="relative group">
                                <div className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-200 text-gray-700">
                                    <Icon className="h-5 w-5" />
                                </div>
                                {/* Edit Overlay */}
                                <div className="absolute inset-0 -m-2 z-10 hidden group-hover:flex items-center justify-center bg-white/95 rounded-lg border border-gray-200 shadow-lg p-2 flex-col gap-2 min-w-[200px]">
                                    <div className="flex gap-1 w-full">
                                        <select
                                            value={link.icon || 'globe'}
                                            onChange={(e) => updateLink(index, 'icon', e.target.value)}
                                            className="bg-gray-50 border border-gray-300 rounded text-xs p-1 text-gray-900 outline-none w-24"
                                        >
                                            {SOCIAL_ICONS.map(icon => (
                                                <option key={icon.value} value={icon.value}>{icon.label}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => removeLink(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <input
                                        type="url"
                                        value={link.url || ''}
                                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-white border border-gray-300 rounded text-xs p-1 text-gray-900 outline-none"
                                    />
                                </div>
                            </div>
                        )
                    })}
                    <button
                        onClick={addLink}
                        className="h-10 w-10 flex items-center justify-center bg-indigo-50 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Ajouter un réseau"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </div>
        )
    }

    const renderSeparator = () => (
        <div className="flex items-center justify-center p-4">
            <div className="h-px w-full bg-gray-200 border-t border-dashed border-gray-400/50"></div>
        </div>
    )

    const renderTitleBlock = () => (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Titre</label>
                <input
                    type="text"
                    value={(isEditing ? editState.title : block.content.title) || ''}
                    onChange={(e) => onEditChange('title', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border font-bold text-lg"
                    placeholder="Grand Titre"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Alignement</label>
                <div className="flex gap-2 mt-1">
                    {['left', 'center', 'right'].map((align) => (
                        <button
                            key={align}
                            onClick={() => onUpdateContent({ ...block.content, align })}
                            className={`p-2 rounded border ${block.content.align === align ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                        >
                            {align === 'left' && <AlignLeft className="h-4 w-4" />}
                            {align === 'center' && <AlignCenter className="h-4 w-4" />}
                            {align === 'right' && <AlignRight className="h-4 w-4" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )

    const renderTextBlock = () => (
        <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Texte</label>
            <textarea
                value={block.content.text || ''}
                onChange={(e) => onUpdateContent({ ...block.content, text: e.target.value })}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border"
                placeholder="Écrivez votre texte ici..."
            />
        </div>
    )

    const renderHeroBlock = () => (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors relative group/image">
                {block.content.url ? (
                    <div className="relative w-full h-48">
                        <img src={block.content.url} alt="Hero" className="w-full h-full object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-medium">Changer d'image</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <span className="mt-2 block text-sm font-medium text-gray-600">Ajouter une image</span>
                    </div>
                )}
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        // 1. Validation Logic
                        const maxSize = 50 * 1024 * 1024 // 50MB
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

                        if (file.size > maxSize) {
                            toast.error('Le fichier est trop volumineux (max 50 Mo)')
                            return
                        }

                        if (!allowedTypes.includes(file.type)) {
                            toast.error('Format non supporté. Utilisez JPG, PNG ou WEBP.')
                            return
                        }

                        try {
                            const supabase = createClient()
                            const { data: { user } } = await supabase.auth.getUser()
                            if (!user) return

                            const fileExt = file.name.split('.').pop()
                            const fileName = `${Date.now()}-hero-${Math.random().toString(36).substring(2)}.${fileExt}`
                            const filePath = `${user.id}/${fileName}`

                            // 2. Cleanup Old File
                            if (block.content.url) {
                                try {
                                    const oldUrl = new URL(block.content.url)
                                    // Extract path: .../storage/v1/object/public/hero_assets/userId/filename
                                    // Path should be userId/filename
                                    const pathParts = oldUrl.pathname.split('/hero_assets/')
                                    if (pathParts.length > 1) {
                                        const oldPath = pathParts[1]
                                        await supabase.storage.from('hero_assets').remove([oldPath])
                                    }
                                } catch (err) {
                                    console.warn('Failed to cleanup old file', err)
                                }
                            }

                            // 3. Upload to hero_assets
                            const { error } = await supabase.storage.from('hero_assets').upload(filePath, file)
                            if (error) throw error

                            const { data: { publicUrl } } = supabase.storage.from('hero_assets').getPublicUrl(filePath)
                            onUpdateContent({ ...block.content, url: publicUrl })
                            toast.success('Image téléchargée')
                        } catch (err) {
                            console.error(err)
                            toast.error('Erreur lors du téléchargement')
                        }
                    }}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Titre</label>
                <input
                    type="text"
                    value={block.content.title || ''}
                    onChange={(e) => onUpdateContent({ ...block.content, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border font-bold"
                    placeholder="Titre accrocheur"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                <textarea
                    value={block.content.text || ''}
                    onChange={(e) => onUpdateContent({ ...block.content, text: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border"
                    placeholder="Texte descriptif..."
                />
            </div>
        </div>
    )

    const renderStandardContent = () => {
        const isFile = block.type === 'file' || block.type === 'image'
        if (isFile) {
            return (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="h-10 w-10 bg-white rounded flex items-center justify-center border border-gray-200 overflow-hidden">
                        {block.type === 'image' ? (
                            <img src={block.content.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <FileText className="h-5 w-5 text-gray-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                            {block.content.title}
                        </p>
                        <a href={block.content.url} target="_blank" className="text-xs text-indigo-600 hover:underline truncate block">
                            {block.content.url}
                        </a>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Titre du bouton</label>
                    <input
                        type="text"
                        value={(isEditing ? editState.title : block.content.title) || ''}
                        onChange={(e) => onEditChange('title', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border"
                        placeholder="Mon super lien"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">URL</label>
                    <input
                        type="url"
                        value={(isEditing ? editState.url : block.content.url) || ''}
                        onChange={(e) => onEditChange('url', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border"
                        placeholder="https://..."
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all ${deleting ? 'opacity-50' : ''} ${!block.is_visible ? 'opacity-75 bg-gray-50' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="flex cursor-grab active:cursor-grabbing flex-col justify-center text-gray-300 hover:text-gray-600 touch-none"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
                {/* Block Label Badge */}
                <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 uppercase">
                        {block.type.replace('_', ' ')}
                    </span>
                    {!block.is_visible && (
                        <span className="inline-flex items-center rounded-sm bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            Masqué
                        </span>
                    )}
                </div>

                {/* Grid Width Toggle in Footer */}
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <span className="uppercase tracking-wide">Largeur:</span>
                    <button
                        onClick={() => onUpdateContent({ ...block.content, width: block.content.width === 'half' ? 'full' : 'half' })}
                        className={`px-2 py-0.5 rounded transition-colors ${block.content.width === 'half' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        {block.content.width === 'half' ? '½ Moitié' : 'Pleine'}
                    </button>
                </div>

                {block.type === 'header' && renderHeaderBlock()}
                {block.type === 'social_grid' && renderSocialGrid()}
                {block.type === 'separator' && renderSeparator()}
                {block.type === 'title' && renderTitleBlock()}
                {block.type === 'text' && renderTextBlock()}
                {block.type === 'hero' && renderHeroBlock()}
                {['link', 'file', 'image'].includes(block.type) && renderStandardContent()}
            </div>

            <div className="flex flex-col items-end gap-2">
                <button
                    onClick={onToggleVisibility}
                    className={`rounded-md p-1.5 transition-colors ${!block.is_visible ? 'text-gray-400 hover:text-gray-600' : 'text-indigo-400 hover:text-indigo-600'}`}
                    title={block.is_visible !== false ? "Masquer" : "Afficher"}
                >
                    {block.is_visible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="rounded-md p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>

                {isEditing && ['link'].includes(block.type) && (
                    <button
                        onClick={onSave}
                        disabled={editState.loading}
                        className="rounded-md bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                        title="Enregistrer"
                    >
                        {editState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                )}
            </div>
        </div>
    )
}


export function BlockEditor({ projectId, pageId, initialBlocks, initialConfig }: BlockEditorProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'design'>('content')
    // Ensure positions are sorted initially if they weren't
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks.sort((a, b) => a.position - b.position))
    const [config, setConfig] = useState<PageConfig>({ ...DEFAULT_CONFIG, ...initialConfig })
    const [activeId, setActiveId] = useState<string | null>(null)

    // Block State
    const [loadingAdd, setLoadingAdd] = useState(false)
    const [edits, setEdits] = useState<Record<string, { title: string; url: string; loading: boolean }>>({})
    const [deleting, setDeleting] = useState<Record<string, boolean>>({})
    const [savingConfig, setSavingConfig] = useState(false)

    // Theme Management State
    const [themes, setThemes] = useState<Theme[]>([])
    const [themeName, setThemeName] = useState('')
    const [savingTheme, setSavingTheme] = useState(false)

    useEffect(() => {
        getThemes().then(res => {
            if (Array.isArray(res)) setThemes(res)
        })
    }, [])

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // --- Actions ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((i) => i.id === active.id)
            const newIndex = blocks.findIndex((i) => i.id === over.id)
            const newItems = arrayMove(blocks, oldIndex, newIndex)

            // Optimistic update
            setBlocks(newItems)

            // Trigger server update in background with toast promise
            const updates = newItems.map((b, index) => ({
                id: b.id,
                position: index,
                page_id: pageId,
                type: b.type,
                content: b.content
            }))

            toast.promise(
                updateBlockPositions(projectId, pageId, updates),
                {
                    loading: 'Sauvegarde de l\'ordre...',
                    success: (data) => {
                        if (data.error) throw new Error(data.error)
                        return 'Ordre sauvegardé'
                    },
                    error: (err) => {
                        return `Erreur: ${err.message}`
                    }
                }
            )
        }
    }

    const handleAddBlock = async (type: Block['type']) => {
        setLoadingAdd(true)
        try {
            let initialContent: any = { title: 'Nouveau bloc', url: '' }
            if (type === 'header') initialContent = { title: 'Mon Profil', url: '' }
            if (type === 'social_grid') initialContent = { links: [{ icon: 'globe', url: '' }] }
            if (type === 'separator') initialContent = {}
            if (type === 'title') initialContent = { title: 'Nouveau Titre', align: 'left' }
            if (type === 'text') initialContent = { text: 'Votre texte ici...' }
            if (type === 'hero') initialContent = { title: 'Titre Hero', text: 'Description du hero', url: '' }

            const result = await addBlockWithContent(projectId, pageId, type, initialContent)

            if (result?.error) throw new Error(result.error)
            if (result?.data) {
                setBlocks(prev => [...prev, result.data as Block])
                toast.success('Bloc ajouté')
            }
        } catch (error) {
            console.error('Failed to add block', error)
            toast.error('Erreur ajout bloc')
        } finally {
            setLoadingAdd(false)
        }
    }

    const handleUpdateContent = async (blockId: string, newContent: any) => {
        // Optimistic update
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b))

        // Debounce needed ideally, but for now direct update
        // We'll skip loading state for cleaner UI on small edits like text
        await updateBlock(projectId, pageId, blockId, newContent)
    }

    const handleToggleVisibility = async (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (!block) return

        const newVisibility = block.is_visible === false ? true : false // default is true (undefined)

        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, is_visible: newVisibility } : b))

        const supabase = createClient()
        const { error } = await supabase.from('blocks').update({ is_visible: newVisibility }).eq('id', blockId)

        if (error) {
            toast.error('Erreur mise à jour visibilité')
        } else {
            toast.success(newVisibility ? 'Bloc visible' : 'Bloc masqué')
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSaveBlock = async (blockId: string) => {
        const edit = edits[blockId]
        if (!edit) return

        setEdits(prev => ({
            ...prev,
            [blockId]: { ...prev[blockId], loading: true }
        }))

        try {
            const result = await updateBlock(projectId, pageId, blockId, { title: edit.title, url: edit.url })
            if (result?.error) throw new Error(result.error)

            setBlocks(prev => prev.map(b =>
                b.id === blockId
                    ? { ...b, content: { ...b.content, title: edit.title, url: edit.url } }
                    : b
            ))
            // Clear edit state or keep it? Usually keep it but update original.
            // Actually if we save, we might want to exit edit mode or just update the "original" to match "edit".
            // We'll update the block in state (done above) and keep edit state as is (it matches now).
            toast.success('Bloc sauvegardé')
        } catch (error) {
            console.error('Failed to update block', error)
            toast.error('Erreur sauvegarde bloc')
        } finally {
            setEdits(prev => ({
                ...prev,
                [blockId]: { ...prev[blockId], loading: false }
            }))
        }
    }

    const handleDelete = async (blockId: string) => {
        if (!confirm('Supprimer ce bloc ?')) return
        setDeleting(prev => ({ ...prev, [blockId]: true }))

        // Cleanup Storage File if exists
        const block = blocks.find(b => b.id === blockId)
        if (block && block.content.url) {
            try {
                const supabase = createClient()
                const url = new URL(block.content.url)

                // Cleanup based on bucket path detection
                if (url.pathname.includes('/hero_assets/')) {
                    const path = url.pathname.split('/hero_assets/')[1]
                    await supabase.storage.from('hero_assets').remove([path])
                } else if (url.pathname.includes('/uploads/')) {
                    const path = url.pathname.split('/uploads/')[1]
                    await supabase.storage.from('uploads').remove([path])
                }
            } catch (err) {
                console.warn('File cleanup failed', err)
            }
        }

        try {
            await deleteBlock(projectId, pageId, blockId)
            setBlocks(prev => prev.filter(b => b.id !== blockId))
            toast.success('Bloc supprimé')
        } catch (error) {
            console.error('Failed to delete block', error)
            toast.error('Erreur suppression')
            setDeleting(prev => ({ ...prev, [blockId]: false }))
        }
    }
    // Re-implementing the specific upload logic correctly:
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setLoadingAdd(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = `${user.id}/${fileName}`
            const { error } = await supabase.storage.from('uploads').upload(filePath, file)
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath)
            const type = file.type.startsWith('image/') ? 'image' : 'file'

            const result = await addBlockWithContent(projectId, pageId, type, {
                title: file.name,
                url: publicUrl,
                type: file.type
            })
            if (result?.data) {
                setBlocks(prev => [...prev, result.data as Block])
                toast.success('Fichier uploadé et ajouté')
            }
        } catch (e) {
            console.error(e)
            toast.error('Erreur upload')
        }
        finally { setLoadingAdd(false); if (fileInputRef.current) fileInputRef.current.value = '' }
    }


    // --- Config Handlers ---
    const handleConfigChange = (field: keyof PageConfig, value: string) => setConfig(prev => ({ ...prev, [field]: value }))
    const handleSaveConfig = async () => {
        setSavingConfig(true)
        try {
            await updatePageConfig(projectId, pageId, config)
            toast.success('Thème enregistré !')
        } catch { toast.error('Erreur sauvegarde thème') }
        finally { setSavingConfig(false) }
    }

    // --- Theme Handlers ---
    const handleSaveTheme = async () => {
        if (!themeName.trim()) return toast.error('Nom du thème requis')
        setSavingTheme(true)
        try {
            const result = await saveTheme(themeName, config)
            if (result.error) throw new Error(result.error)

            if (result.theme) {
                // @ts-ignore
                setThemes(prev => [result.theme, ...prev])
                setThemeName('')
                toast.success('Thème enregistré')
            }
        } catch (err) {
            console.error(err)
            toast.error('Erreur sauvegarde thème')
        } finally {
            setSavingTheme(false)
        }
    }

    const handleApplyTheme = (themeId: string) => {
        const theme = themes.find(t => t.id === themeId)
        if (theme) {
            setConfig(prev => ({ ...prev, ...theme.config }))
            toast.success('Thème appliqué')
        }
    }

    const handleHeaderBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Fichier trop volumineux (max 5Mo)')
            return
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            toast.error('Format invalide (JPG, PNG, WEBP)')
            return
        }

        const toastId = toast.loading('Upload en cours...')
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}-header-bg-${Math.random().toString(36).substring(2)}.${ext}`
            const filePath = `${user.id}/${fileName}`

            const { error } = await supabase.storage.from('hero_assets').upload(filePath, file)
            if (error) throw error

            const { data: { publicUrl } } = supabase.storage.from('hero_assets').getPublicUrl(filePath)

            setConfig(prev => ({ ...prev, headerBackgroundImage: publicUrl }))
            toast.success('Image de fond mise à jour', { id: toastId })
        } catch (err) {
            console.error(err)
            toast.error('Erreur upload', { id: toastId })
        }
    }

    const applyPreset = (name: 'Dark Neon' | 'Minimalist' | 'Pastel Garden') => {
        let preset: Partial<PageConfig> = {}
        if (name === 'Dark Neon') {
            preset = {
                backgroundColor: '#0f172a',
                secondaryColor: '#334155',
                textColor: '#f8fafc',
                linkColor: '#a855f7',
                buttonColor: '#3b82f6',
                buttonTextColor: '#ffffff',
                buttonStyle: 'rounded-none',
                fontFamily: 'Inter, sans-serif'
            }
        } else if (name === 'Minimalist') {
            preset = {
                backgroundColor: '#ffffff',
                secondaryColor: '#e5e7eb',
                textColor: '#1f2937',
                linkColor: '#000000',
                buttonColor: '#000000',
                buttonTextColor: '#ffffff',
                buttonStyle: 'rounded-md',
                fontFamily: 'Inter, sans-serif'
            }
        } else if (name === 'Pastel Garden') {
            preset = {
                backgroundColor: '#fdf4ff',
                secondaryColor: '#f0abfc',
                textColor: '#4a044e',
                linkColor: '#d946ef',
                buttonColor: '#fae8ff',
                buttonTextColor: '#86198f',
                buttonStyle: 'rounded-full',
                fontFamily: 'Inter, sans-serif'
            }
        }
        setConfig(prev => ({ ...prev, ...preset }))
        toast.success(`Preset "${name}" appliqué`)
    }

    // --- Sub components for rendering ---
    const renderPreview = () => {
        // Force re-render when config changes
        const previewKey = JSON.stringify(config)
        const { backgroundColor, buttonColor, buttonTextColor, buttonStyle, buttonVariant, fontFamily } = config

        // Helper to get button inline styles
        const getButtonStyle = (): React.CSSProperties => {
            const baseStyle: React.CSSProperties = {
                borderRadius: buttonStyle === 'rounded-full' ? '9999px' : buttonStyle === 'rounded-none' ? '0px' : '8px',
                fontFamily: fontFamily || 'Inter, sans-serif'
            }

            if (buttonVariant === 'outline') {
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    color: buttonColor || '#000000',
                    border: `2px solid ${buttonColor || '#000000'}`
                }
            } else if (buttonVariant === 'soft-shadow') {
                return {
                    ...baseStyle,
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    boxShadow: `0 4px 12px ${buttonColor || '#000000'}40`, // Approx 25% opacity using hex
                    border: '1px solid #f3f4f6'
                }
            } else {
                // Default 'fill'
                return {
                    ...baseStyle,
                    backgroundColor: buttonColor || '#000000',
                    color: buttonTextColor || '#ffffff',
                    border: 'none'
                }
            }
        }

        const containerStyle: React.CSSProperties = {
            backgroundColor: backgroundColor || '#ffffff',
            fontFamily: fontFamily || 'Inter, sans-serif'
        }

        const btnStyle = getButtonStyle()

        return (
            <div key={previewKey} className="h-[600px] w-full max-w-[375px] mx-auto overflow-y-auto border-8 border-gray-800 rounded-[3rem] shadow-2xl transition-colors duration-200" style={containerStyle}>
                <div className="h-full w-full p-6 flex flex-col gap-4">
                    {/* Preview blocks should follow visibility */}
                    {blocks.filter(b => b.is_visible !== false).map(block => (
                        <div key={block.id} className="w-full">
                            {block.type === 'header' && (
                                <div className="text-center mb-6">
                                    {block.content.url && <img src={block.content.url} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-white shadow-sm" />}
                                    <h1 className="text-xl font-bold">{block.content.title}</h1>
                                    {block.content.subtitle && <p className="text-sm opacity-80 mt-1">{block.content.subtitle}</p>}
                                </div>
                            )}
                            {block.type === 'social_grid' && (
                                <div className="flex flex-wrap justify-center gap-6 mb-4">
                                    {block.content.links?.map((link: any, i: number) => {
                                        const Icon = SOCIAL_ICONS.find(ic => ic.value === link.icon)?.icon || Globe
                                        return (
                                            <a key={i} href={link.url} target="_blank" className="p-2 bg-white rounded-lg shadow-sm hover:scale-105 transition-transform" style={{ color: buttonColor || '#000000' }}>
                                                <Icon className="h-5 w-5" />
                                            </a>
                                        )
                                    })}
                                </div>
                            )}
                            {block.type === 'separator' && <hr className="border-t border-gray-200 my-4" />}
                            {block.type === 'title' && (
                                <h2 className={`font-bold text-lg mb-2 text-gray-900 ${block.content.align === 'center' ? 'text-center' : block.content.align === 'right' ? 'text-right' : 'text-left'}`}>
                                    {block.content.title}
                                </h2>
                            )}
                            {block.type === 'text' && (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                                    {block.content.text}
                                </p>
                            )}
                            {block.type === 'hero' && (
                                <div className="flex flex-col gap-3 rounded-lg overflow-hidden border border-gray-200 pb-3">
                                    {block.content.url && <img src={block.content.url} className="w-full h-32 object-cover" />}
                                    <div className="px-3">
                                        <h3 className="font-bold text-gray-900">{block.content.title}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{block.content.text}</p>
                                    </div>
                                </div>
                            )}
                            {block.type === 'link' && (
                                <a href={block.content.url} target="_blank" className="flex items-center justify-center p-4 w-full shadow-sm hover:opacity-90 transition-opacity" style={btnStyle}>
                                    <span className="font-medium">{block.content.title}</span>
                                </a>
                            )}
                            {block.type === 'image' && <img src={block.content.url} className="w-full rounded-lg shadow-sm" />}
                            {block.type === 'file' && (
                                <a href={block.content.url} download className="flex items-center gap-3 p-3 bg-white/90 rounded-lg shadow-sm border border-gray-200/50">
                                    <FileText className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900 truncate">{block.content.title}</span>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-12rem)]">
            <div className="flex-1 space-y-6">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setActiveTab('content')} className={`${activeTab === 'content' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}>
                            <Layers className="h-4 w-4" /> Contenu
                        </button>
                        <button onClick={() => setActiveTab('design')} className={`${activeTab === 'design' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}>
                            <Palette className="h-4 w-4" /> Apparence
                        </button>
                    </nav>
                </div>

                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {/* Add Buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*,application/pdf" />
                            <button onClick={() => handleAddBlock('link')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <Plus className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">Lien</span>
                            </button>
                            <button onClick={() => handleAddBlock('header')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <LayoutTemplate className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">En-tête</span>
                            </button>
                            <button onClick={() => handleAddBlock('social_grid')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <Twitter className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">Réseaux</span>
                            </button>
                            <button onClick={() => handleAddBlock('separator')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <Minus className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">Séparateur</span>
                            </button>

                            <button onClick={() => handleAddBlock('title')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <Heading className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">Titre</span>
                            </button>
                            <button onClick={() => handleAddBlock('text')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <Type className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">Texte</span>
                            </button>
                            <button onClick={() => handleAddBlock('hero')} disabled={loadingAdd} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white transition-colors">
                                <ImageIcon className="h-5 w-5 text-indigo-600" /> <span className="text-xs font-medium text-gray-700">Hero</span>
                            </button>

                            <button onClick={() => fileInputRef.current?.click()} disabled={loadingAdd} className="md:col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-gray-500 hover:text-indigo-600 bg-white">
                                <Upload className="h-5 w-5" /> <span className="text-xs font-medium text-center">Fichier / Img</span>
                            </button>
                        </div>

                        {/* DnD List */}
                        <ClientOnly>
                            <DndContext
                                id="block-editor-dnd-context"
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {blocks.map(block => (
                                            <SortableBlock
                                                key={block.id}
                                                block={block}
                                                projectId={projectId}
                                                isEditing={!!edits[block.id]}
                                                editState={edits[block.id]}
                                                deleting={deleting[block.id]}
                                                onEditChange={(field, val) => {
                                                    setEdits(prev => ({
                                                        ...prev,
                                                        [block.id]: { ...prev[block.id], [field]: val }
                                                    }))
                                                }}
                                                onSave={() => handleSaveBlock(block.id)}
                                                onDelete={() => handleDelete(block.id)}
                                                onToggleVisibility={() => handleToggleVisibility(block.id)}
                                                onUpdateContent={(content) => handleUpdateContent(block.id, content)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeId && blocks.find(b => b.id === activeId) ? (
                                        <div className="p-4 bg-white rounded-lg shadow-xl border-2 border-indigo-500 opacity-90 cursor-grabbing">
                                            <div className="flex items-center gap-4">
                                                <GripVertical className="h-5 w-5 text-indigo-600" />
                                                <span className="font-medium text-gray-900">Déplacement...</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </ClientOnly>
                    </div>
                )}

                {activeTab === 'design' && (
                    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* 1. PRESETS */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="h-4 w-4" /> Presets Rapides
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {['Dark Neon', 'Minimalist', 'Pastel Garden'].map((name) => (
                                    <button
                                        key={name}
                                        onClick={() => applyPreset(name as any)}
                                        className="px-3 py-2 text-xs font-medium rounded-md border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* 2. THEMES MANAGER */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Mes Thèmes
                            </h3>
                            <div className="space-y-3">
                                {/* Save Theme */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nom du nouveau thème..."
                                        value={themeName}
                                        onChange={(e) => setThemeName(e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                                    />
                                    <button
                                        onClick={handleSaveTheme}
                                        disabled={savingTheme}
                                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {savingTheme ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Load Theme */}
                                {themes.length > 0 && (
                                    <select
                                        onChange={(e) => handleApplyTheme(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border text-gray-700"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Appliquer un design existant...</option>
                                        {themes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* 3. COLORS & STYLE */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Couleurs & Style</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Fond Page</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.backgroundColor || '#ffffff'} onChange={e => handleConfigChange('backgroundColor', e.target.value)} className="h-8 w-8 rounded border cursor-pointer p-0" />
                                        <span className="text-xs font-mono text-gray-500 uppercase">{config.backgroundColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Secondaire</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.secondaryColor || '#e5e7eb'} onChange={e => handleConfigChange('secondaryColor', e.target.value)} className="h-8 w-8 rounded border cursor-pointer p-0" />
                                        <span className="text-xs font-mono text-gray-500 uppercase">{config.secondaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Texte Principal</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.textColor || '#1f2937'} onChange={e => handleConfigChange('textColor', e.target.value)} className="h-8 w-8 rounded border cursor-pointer p-0" />
                                        <span className="text-xs font-mono text-gray-500 uppercase">{config.textColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Liens & Accents</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.linkColor || '#000000'} onChange={e => handleConfigChange('linkColor', e.target.value)} className="h-8 w-8 rounded border cursor-pointer p-0" />
                                        <span className="text-xs font-mono text-gray-500 uppercase">{config.linkColor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. BUTTONS SPECIFIC */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Boutons</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Fond Bouton</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.buttonColor || '#000000'} onChange={e => handleConfigChange('buttonColor', e.target.value)} className="h-8 w-8 rounded border cursor-pointer p-0" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Texte Bouton</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.buttonTextColor || '#ffffff'} onChange={e => handleConfigChange('buttonTextColor', e.target.value)} className="h-8 w-8 rounded border cursor-pointer p-0" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Forme</label>
                                    <select value={config.buttonStyle || 'rounded-md'} onChange={e => handleConfigChange('buttonStyle', e.target.value)} className="block w-full rounded-md border-gray-300 p-1.5 border text-sm">
                                        <option value="rounded-none">Carré</option>
                                        <option value="rounded-md">Arrondi</option>
                                        <option value="rounded-full">Pilule</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Style</label>
                                    <select value={config.buttonVariant || 'fill'} onChange={e => handleConfigChange('buttonVariant', e.target.value)} className="block w-full rounded-md border-gray-300 p-1.5 border text-sm">
                                        <option value="fill">Rempli</option>
                                        <option value="outline">Contour</option>
                                        <option value="soft-shadow">Ombre</option>
                                    </select>
                                </div>
                            </div>
                        </div>


                        {/* 5. HEADER & TYPOGRAPHY */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">En-tête & Police</h3>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Image de fond (Header)</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                                        <Upload className="h-4 w-4" />
                                        <span>{config.headerBackgroundImage ? 'Changer l\'image' : 'Uploader une image'}</span>
                                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleHeaderBgUpload} />
                                    </label>
                                    {config.headerBackgroundImage && (
                                        <div className="h-9 w-9 rounded-md border border-gray-200 overflow-hidden relative group">
                                            <img src={config.headerBackgroundImage} className="h-full w-full object-cover" />
                                            <button
                                                onClick={() => setConfig(prev => ({ ...prev, headerBackgroundImage: '' }))}
                                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Police d'écriture</label>
                                <select value={config.fontFamily || 'Inter, sans-serif'} onChange={e => handleConfigChange('fontFamily', e.target.value)} className="block w-full rounded-md border-gray-300 p-2 border text-sm">
                                    <option value="Inter, sans-serif">Inter</option>
                                    <option value="Nunito, sans-serif">Nunito</option>
                                    <option value="Roboto, sans-serif">Roboto</option>
                                    <option value="Playfair Display, serif">Playfair Display</option>
                                    <option value="Courier New, monospace">Courier New</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleSaveConfig} disabled={savingConfig} className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium">
                            {savingConfig ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Enregistrer les modifications
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 lg:max-w-md">
                <div className="sticky top-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Aperçu en direct</h3>
                    {renderPreview()}
                </div>
            </div>
        </div>
    )
}
