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
import { addBlockWithProject, updateBlock, deleteBlock, updatePageConfig, addBlockWithContent, updateBlockPositions, updateProjectContent } from '@/app/dashboard/actions'
import { Plus, GripVertical, Trash2, Save, Eye, EyeOff, LayoutTemplate, Type, Heading, Minus, Image as ImageIcon, Twitter, Upload, Loader2, Globe, Settings2, FileText, AlignLeft, AlignCenter, AlignRight, Columns, Instagram, Facebook, Linkedin, Github } from 'lucide-react'
import { getBoxShadow } from '@/lib/utils'
import { HeaderBlock } from '@/components/shared/blocks/HeaderBlock'
import { SocialGridBlock } from '@/components/shared/blocks/SocialGridBlock'
import { LinkBlock } from '@/components/shared/blocks/LinkBlock'
import { DoubleLinkBlock } from '@/components/shared/blocks/DoubleLinkBlock'
import { EmbedBlock } from '@/components/shared/blocks/EmbedBlock'
import type { Block, PageConfig } from '@/types/database'
import { getEmbedUrl } from '@/lib/embed-utils'
import { createClient } from '@/utils/supabase/client'
import ClientOnly from '@/components/ClientOnly'
import { toast } from 'sonner'
import { ComponentPicker } from './ComponentPicker'

interface BlockEditorProps {
    projectId: string
    pageId: string
    initialBlocks: Block[]
    initialConfig: PageConfig
    initialPublishedState: boolean
    initialMetaTitle?: string
    initialTheme?: any // Should ideally be Theme type
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

    const renderDoubleLinkBlock = () => {
        const links = block.content.links || [{ label: 'Lien 1', url: '' }, { label: 'Lien 2', url: '' }]

        const updateLink = (index: number, field: 'label' | 'url', value: string) => {
            const newLinks = [...links]
            newLinks[index] = { ...newLinks[index], [field]: value }
            onUpdateContent({ ...block.content, links: newLinks })
        }

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {links.map((link: any, index: number) => (
                        <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <h4 className="text-xs font-semibold uppercase text-gray-500">Lien {index + 1}</h4>
                            <div>
                                <input
                                    type="text"
                                    value={link.label || ''}
                                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                                    placeholder={`Titre du lien ${index + 1}`}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border mb-2"
                                />
                                <input
                                    type="url"
                                    value={link.url || ''}
                                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                                    placeholder="https://..."
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

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
                    value={block.content.title || ''}
                    onChange={(e) => onUpdateContent({ ...block.content, title: e.target.value })}
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
                <div className="space-y-3">
                    {/* Preview / Upload Area */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors relative group/image">
                        {block.content?.url ? (
                            <div className="relative w-full h-48">
                                {block.type === 'image' ? (
                                    <img src={block.content.url} alt="Preview" className="w-full h-full object-contain rounded-md" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                        <FileText className="h-16 w-16 text-gray-400" />
                                        <span className="mt-2 block text-sm font-medium text-gray-600">{block.content.title || 'Fichier'}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity rounded-md">
                                    <span className="text-white text-sm font-medium">Changer de fichier</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                {block.type === 'image' ? <ImageIcon className="mx-auto h-12 w-12 text-gray-300" /> : <FileText className="mx-auto h-12 w-12 text-gray-300" />}
                                <span className="mt-2 block text-sm font-medium text-gray-600">
                                    {block.type === 'image' ? 'Ajouter une image' : 'Ajouter un fichier'}
                                </span>
                            </div>
                        )}
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept={block.type === 'image' ? "image/*" : "*"}
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return

                                // Validation
                                const maxSize = 50 * 1024 * 1024 // 50MB
                                if (file.size > maxSize) {
                                    toast.error('Le fichier est trop volumineux (max 50 Mo)')
                                    return
                                }

                                try {
                                    const supabase = createClient()
                                    const { data: { user } } = await supabase.auth.getUser()
                                    if (!user) return

                                    // Upload to 'uploads' bucket
                                    const fileExt = file.name.split('.').pop()
                                    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                                    const filePath = `${user.id}/${fileName}`

                                    const { error } = await supabase.storage.from('uploads').upload(filePath, file)
                                    if (error) throw error

                                    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath)

                                    // Update content
                                    onUpdateContent({
                                        ...block.content,
                                        url: publicUrl,
                                        title: file.name // Auto-set title from filename
                                    })
                                    toast.success('Fichier téléchargé')
                                } catch (err) {
                                    console.error(err)
                                    toast.error('Erreur lors du téléchargement')
                                }
                            }}
                        />
                    </div>

                    {/* Meta Fields */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Titre / Légende</label>
                        <input
                            type="text"
                            value={block.content.title || ''}
                            onChange={(e) => onUpdateContent({ ...block.content, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 border"
                            placeholder={block.type === 'image' ? "Légende de l'image" : "Nom du fichier"}
                        />
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
                    {block.is_visible === false && (
                        <span className="inline-flex items-center rounded-sm bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            Masqué
                        </span>
                    )}
                </div>

                {/* Grid Width Toggle Removed */}

                {block.type === 'header' && renderHeaderBlock()}
                {block.type === 'social_grid' && renderSocialGrid()}
                {block.type === 'separator' && renderSeparator()}
                {block.type === 'title' && renderTitleBlock()}
                {block.type === 'text' && renderTextBlock()}
                {block.type === 'hero' && renderHeroBlock()}
                {block.type === 'double-link' && renderDoubleLinkBlock()}
                {block.type === 'double-link' && renderDoubleLinkBlock()}
                {['link', 'file', 'image', 'embed'].includes(block.type) && renderStandardContent()}
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

                {isEditing && ['link', 'embed'].includes(block.type) && (
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


export function BlockEditor({ projectId, pageId, initialBlocks, initialConfig, initialPublishedState, initialMetaTitle, initialTheme }: BlockEditorProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
    // Ensure positions are sorted and visibility is synced from content
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks.sort((a, b) => a.position - b.position).map(b => ({
        ...b,
        // Sync visibility from content if available (migration/compatibility)
        is_visible: b.content?.is_visible !== undefined ? b.content.is_visible : b.is_visible
    })))
    // FIX: Do NOT merge with default config on init, keep exactly what DB has (even if empty) to allow theme inheritance
    // But UI needs defaults to render controls properly? We'll handle defaults in render/accessors.
    const [config, setConfig] = useState<PageConfig>(initialConfig || {})
    const [isPublished, setIsPublished] = useState(initialPublishedState)
    const [metaTitle, setMetaTitle] = useState(initialMetaTitle || '')
    const [activeId, setActiveId] = useState<string | null>(null)

    // Block State
    const [loadingAdd, setLoadingAdd] = useState(false)
    const [edits, setEdits] = useState<Record<string, { title: string; url: string; loading: boolean }>>({})
    const [deleting, setDeleting] = useState<Record<string, boolean>>({})
    const [savingSettings, setSavingSettings] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    // Unsaved Changes Warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        // Internal navigation interceptor
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest('a')
            if (anchor && isDirty) {
                const href = anchor.getAttribute('href')
                if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
                    if (!window.confirm('Vous avez des changements non enregistrés. Voulez-vous vraiment quitter ?')) {
                        e.preventDefault()
                        e.stopImmediatePropagation()
                    }
                }
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('click', handleAnchorClick, true)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            window.removeEventListener('click', handleAnchorClick, true)
        }
    }, [isDirty])



    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // --- Actions ---

    // Centralized Block Update
    const handleBlockUpdate = (blockId: string, newContent: any) => {
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b))
        setIsDirty(true)
    }

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

            // Pure local update
            setBlocks(newItems)
            setIsDirty(true)
        }
    }

    const handleAddBlock = async (type: Block['type']) => {
        setLoadingAdd(true)
        try {
            let initialContent: any = { title: 'Nouveau bloc', url: '' }
            if (type === 'image' || type === 'file') initialContent = { title: '', url: '' }
            if (type === 'header') initialContent = { title: 'Mon Profil', url: '' }
            if (type === 'social_grid') initialContent = { links: [{ icon: 'globe', url: '' }] }
            if (type === 'separator') initialContent = {}
            if (type === 'title') initialContent = { title: 'Nouveau Titre', align: 'left' }
            if (type === 'text') initialContent = { text: 'Votre texte ici...' }
            if (type === 'hero') initialContent = { title: 'Titre Hero', text: 'Description du hero', url: '' }
            if (type === 'embed') initialContent = { url: '' }
            if (type === 'double-link') initialContent = { links: [{ label: 'Lien 1', url: '' }, { label: 'Lien 2', url: '' }] }

            const newBlock: Block = {
                id: crypto.randomUUID(), // Local Temp ID
                type,
                content: initialContent,
                position: blocks.length,
                page_id: pageId,
                is_visible: true
            }

            setBlocks(prev => [...prev, newBlock])
            setIsDirty(true)
            toast.success('Bloc ajouté (Non sauvegardé)')

        } catch (error) {
            console.error('Failed to add block', error)
            toast.error('Erreur ajout bloc')
        } finally {
            setLoadingAdd(false)
        }
    }

    const [isSavingContent, setIsSavingContent] = useState(false)

    const handleUpdateContent = (blockId: string, newContent: any) => {
        // Local state update
        handleBlockUpdate(blockId, newContent)
    }

    const handleSaveAllContent = async () => {
        setIsSavingContent(true)
        try {
            // Sanitize payload to strip undefined values (Next.js Server Actions hate undefined)
            const sanitizedBlocks = JSON.parse(JSON.stringify(blocks))
            const result = await updateProjectContent(projectId, pageId, sanitizedBlocks)

            if (result?.error) {
                console.error('Server Action Error:', result.error)
                toast.error(`Erreur: ${result.error}`)
            } else {
                toast.success('Tout le contenu a été sauvegardé')
                setIsDirty(false)
            }
        } catch (error) {
            console.error('Failed to save content (Client Catch):', error)
            toast.error('Erreur inattendue lors de la sauvegarde')
        } finally {
            setIsSavingContent(false)
        }
    }

    const handleToggleVisibility = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (!block) return

        const currentVisibility = block.content.is_visible !== false
        const newVisibility = !currentVisibility

        // Local update only
        setBlocks(prev => prev.map(b => b.id === blockId ? {
            ...b,
            is_visible: newVisibility,
            content: { ...b.content, is_visible: newVisibility }
        } : b))

        setIsDirty(true)
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSaveBlock = (blockId: string) => {
        const edit = edits[blockId]
        if (!edit) return

        // Update local block with edit state
        setBlocks(prev => prev.map(b =>
            b.id === blockId
                ? { ...b, content: { ...b.content, title: edit.title, url: edit.url } }
                : b
        ))

        toast.success('Modifications appliquées (Non sauvegardé)')
        setIsDirty(true)

        // Clear edit loading state
        setEdits(prev => ({
            ...prev,
            [blockId]: { ...prev[blockId], loading: false }
        }))
    }

    const handleDelete = (blockId: string) => {
        if (!confirm('Supprimer ce bloc ?')) return

        // Just remove locally
        setBlocks(prev => prev.filter(b => b.id !== blockId))
        setIsDirty(true)
        toast.success('Bloc supprimé (Non sauvegardé)')
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


    // --- Settings Handlers ---
    // --- Settings Handlers ---
    const handleSaveSettings = async () => {
        setSavingSettings(true)
        try {
            await updatePageConfig(projectId, pageId, config)

            // Also update published state and meta title
            const supabase = createClient()
            const { error } = await supabase
                .from('pages')
                .update({
                    is_published: isPublished,
                    meta_title: metaTitle
                })
                .eq('id', pageId)

            if (error) throw error

            toast.success('Réglages enregistrés !')
        } catch (e: any) {
            console.error(e)
            toast.error('Erreur sauvegarde réglages')
        } finally { setSavingSettings(false) }
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



    // --- Sub components for rendering ---
    const renderPreview = () => {
        // --- Theme + Config Logic ---
        const DEFAULT_THEME_CONFIG: PageConfig = {
            colors: {
                background: '#ffffff',
                primary: '#000000',
                secondary: '#e5e7eb',
                text: '#1f2937',
                link: '#000000',
                buttonText: '#ffffff'
            },
            typography: { fontFamily: 'Inter, sans-serif' },
            borders: { radius: '8px', width: '1px', style: 'solid' },
            dividers: { style: 'solid', width: '1px', color: '#e5e7eb' },
            buttonStyle: 'rounded-md',
            buttonVariant: 'fill'
        }

        // Priority: Theme > Local (if present) > Default
        // Priority: Theme > Local > Default
        // Strict Logic as requested:
        const effectiveThemeConfig = (initialTheme && initialTheme.config && Object.keys(initialTheme.config).length > 0)
            ? initialTheme.config
            : config

        const previewKey = JSON.stringify(config) // Still re-render on local changes

        // --- Color Helper (Strictly using new structure) ---
        const getBackground = () => effectiveThemeConfig.colors?.background || DEFAULT_THEME_CONFIG.colors!.background
        const getText = () => effectiveThemeConfig.colors?.text || DEFAULT_THEME_CONFIG.colors!.text
        const getFont = () => effectiveThemeConfig.typography?.fontFamily || DEFAULT_THEME_CONFIG.typography!.fontFamily
        const getSecondary = () => effectiveThemeConfig.colors?.secondary || DEFAULT_THEME_CONFIG.colors!.secondary

        const boxShadow = getBoxShadow(
            effectiveThemeConfig.shadows?.style || 'none',
            effectiveThemeConfig.colors?.secondary || '#e5e7eb',
            effectiveThemeConfig.shadows?.opacity ?? 0.5
        )

        const containerStyle: React.CSSProperties = {
            backgroundColor: getBackground(),
            fontFamily: getFont(),
            color: getText(),
            '--pico-shadow': boxShadow,
        } as React.CSSProperties

        const headerBg = effectiveThemeConfig.headerBackgroundImage

        return (
            <div key={previewKey} className="h-[600px] w-full max-w-[375px] mx-auto overflow-y-auto border-8 border-gray-800 rounded-[3rem] shadow-2xl transition-colors duration-200 relative overflow-hidden scrollbar-hide" style={{ ...containerStyle, boxShadow: 'var(--pico-shadow)' }}>

                {/* Debug Theme Name */}

                {/* Header Background */}
                {headerBg && (
                    <div className="absolute top-0 left-0 right-0 h-72 z-0">
                        <img src={headerBg} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"></div>
                    </div>
                )}

                <div className={`h-full w-full p-6 flex flex-col gap-4 relative z-10 ${headerBg ? 'text-white' : ''}`}>
                    {/* Preview blocks should follow visibility */}
                    {blocks.filter(b => b.is_visible !== false).map(block => (
                        <div key={block.id} className="w-full">
                            {block.type === 'header' && <HeaderBlock content={block.content as any} config={effectiveThemeConfig} />}

                            {block.type === 'social_grid' && <SocialGridBlock content={block.content as any} config={effectiveThemeConfig} />}

                            {block.type === 'separator' && <hr className="border-t border-dashed my-4" style={{ borderColor: getSecondary() }} />}

                            {block.type === 'title' && (
                                <h2 className={`font-bold text-lg mb-2 ${headerBg ? 'text-white' : ''} ${block.content.align === 'center' ? 'text-center' : block.content.align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: headerBg ? '#ffffff' : getText() }}>
                                    {block.content.title}
                                </h2>
                            )}

                            {block.type === 'text' && (
                                <p className={`text-sm whitespace-pre-wrap mb-2 ${headerBg ? 'text-white/90' : ''}`} style={{ color: headerBg ? 'rgba(255,255,255,0.9)' : getText() }}>
                                    {block.content.text}
                                </p>
                            )}

                            {block.type === 'hero' && (
                                <div className="flex flex-col gap-3 rounded-lg overflow-hidden border border-gray-200 pb-3 bg-white">
                                    {block.content.url && <img src={block.content.url} className="w-full h-32 object-cover" />}
                                    <div className="px-3">
                                        <h3 className="font-bold text-gray-900">{block.content.title}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{block.content.text}</p>
                                    </div>
                                </div>
                            )}

                            {block.type === 'link' && <LinkBlock content={block.content as any} config={effectiveThemeConfig} />}

                            {block.type === 'double-link' && <DoubleLinkBlock content={block.content as any} config={effectiveThemeConfig} />}

                            {block.type === 'embed' && <EmbedBlock content={block.content as any} config={effectiveThemeConfig} />}

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
                            <LayoutTemplate className="h-4 w-4" /> Contenu
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}>
                            <Settings2 className="h-4 w-4" /> Réglages
                        </button>
                    </nav>
                </div>

                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {/* Add Button */}
                        <button
                            onClick={() => setIsPickerOpen(true)}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                        >
                            <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                <Plus className="h-5 w-5" />
                            </div>
                            <span className="font-medium">Ajouter un composant</span>
                        </button>

                        {/* Components List */}
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

                        {/* Global Save Button */}
                        <div className="pt-4 border-t border-gray-200">
                            <button
                                onClick={handleSaveAllContent}
                                disabled={isSavingContent || !isDirty}
                                className={`w-full flex justify-center items-center gap-2 text-white p-3 rounded-md font-medium transition-colors ${isDirty
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md transform hover:scale-[1.01]'
                                    : 'bg-gray-400 cursor-not-allowed opacity-70'
                                    }`}
                            >
                                {isSavingContent ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                {isDirty ? 'Enregistrer les modifications' : 'Aucun changement'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Publication Status */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-indigo-500" />
                                Publication
                            </h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700">Publier la page</span>
                                <button
                                    onClick={() => setIsPublished(!isPublished)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isPublished ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 text-justify leading-relaxed">
                                Si cette page est dépubliée, elle ne sera plus accessible et les visiteurs seront redirigés vers la page d'accueil de Picoverse.
                            </p>
                        </div>

                        {/* SEO Settings */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Type className="h-4 w-4 text-indigo-500" />
                                SEO & Métadonnées
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Meta Titre
                                </label>
                                <input
                                    type="text"
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder="Titre dans l'onglet du navigateur"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Si vide, le titre de la page sera utilisé.
                                </p>
                            </div>
                        </div>

                        {/* Legacy Header Background Image (Kept as requested) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Image d&apos;en-tête (Optionnel)
                            </h3>

                            <div>
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
                        </div>

                        <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium">
                            {savingSettings ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Enregistrer les réglages
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
            <ComponentPicker
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={(type) => {
                    handleAddBlock(type as any)
                    setIsPickerOpen(false)
                }}
            />
        </div>
    )
}
