'use client'

import { useState, useRef } from 'react'
import { addBlockWithProject, updateBlock, deleteBlock, updatePageConfig, addBlockWithContent } from '@/app/dashboard/actions'
import { Plus, GripVertical, Save, Loader2, Trash2, Palette, Layers, ExternalLink, FileText, Upload, Image as ImageIcon } from 'lucide-react'
import type { Block, PageConfig } from '@/types/database'
import { createClient } from '@/utils/supabase/client'

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
    fontFamily: 'Inter',
}

export function BlockEditor({ projectId, pageId, initialBlocks, initialConfig }: BlockEditorProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'design'>('content')
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
    const [config, setConfig] = useState<PageConfig>({ ...DEFAULT_CONFIG, ...initialConfig })

    // Block State
    const [loadingAdd, setLoadingAdd] = useState(false)
    const [edits, setEdits] = useState<Record<string, { title: string; url: string; loading: boolean }>>({})
    const [deleting, setDeleting] = useState<Record<string, boolean>>({})

    // Config State
    const [savingConfig, setSavingConfig] = useState(false)

    // --- Block Handlers ---

    const handleAddBlock = async () => {
        setLoadingAdd(true)
        try {
            const result = await addBlockWithProject(projectId, pageId)

            if (result?.error) {
                console.error('Failed to add block', result.error)
                alert('Erreur lors de l\'ajout du bloc')
                return
            }

            if (result?.data) {
                setBlocks(prev => [result.data as Block, ...prev])
            }
        } catch (error) {
            console.error('Failed to add block', error)
            alert('Erreur lors de l\'ajout du bloc')
        } finally {
            setLoadingAdd(false)
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('Le fichier est trop volumineux (Max 5Mo)')
            return
        }

        setLoadingAdd(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('User not found')
            }

            const fileExt = file.name.split('.').pop()
            // Sanitize filename to avoid weird characters issues in URL
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const fileName = `${Date.now()}-${sanitizedName}`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Supabase Storage Upload Error:', uploadError)
                throw new Error(uploadError.message)
            }

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath)

            const type = file.type.startsWith('image/') ? 'image' : 'file'
            const result = await addBlockWithContent(projectId, pageId, type, {
                title: file.name,
                url: publicUrl,
                type: file.type
            })

            if (result?.error) throw new Error(result.error)

            if (result?.data) {
                setBlocks(prev => [result.data as Block, ...prev])
            }
        } catch (error) {
            console.error('Upload failed', error)
            alert(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        } finally {
            setLoadingAdd(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleEditChange = (blockId: string, field: 'title' | 'url', value: string) => {
        setEdits(prev => {
            const currentEdit = prev[blockId] || {
                title: blocks.find(b => b.id === blockId)?.content.title || '',
                url: blocks.find(b => b.id === blockId)?.content.url || '',
                loading: false
            }
            return {
                ...prev,
                [blockId]: { ...currentEdit, [field]: value }
            }
        })
    }

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
                    ? { ...b, content: { title: edit.title, url: edit.url } }
                    : b
            ))
        } catch (error) {
            console.error('Failed to update block', error)
            alert('Erreur: ' + (error instanceof Error ? error.message : 'Inconnue'))
        } finally {
            setEdits(prev => ({
                ...prev,
                [blockId]: { ...prev[blockId], loading: false }
            }))
        }
    }

    const handleDelete = async (blockId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce bloc ?')) return

        setDeleting(prev => ({ ...prev, [blockId]: true }))
        try {
            const result = await deleteBlock(projectId, pageId, blockId)
            if (result?.error) throw new Error(result.error)

            setBlocks(prev => prev.filter(b => b.id !== blockId))

        } catch (error) {
            console.error('Failed to delete block', error)
            alert('Erreur lors de la suppression')
            setDeleting(prev => ({ ...prev, [blockId]: false }))
        }
    }

    // --- Config Handlers ---

    const handleConfigChange = (field: keyof PageConfig, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveConfig = async () => {
        setSavingConfig(true)
        try {
            const result = await updatePageConfig(projectId, pageId, config)
            if (result?.error) throw new Error(result.error)
            alert('Thème enregistré !')
        } catch (error) {
            console.error('Failed to save config', error)
            alert('Erreur lors de la sauvegarde du thème')
        } finally {
            setSavingConfig(false)
        }
    }

    // --- Render Helpers ---

    const renderPreview = () => {
        const { backgroundColor, buttonColor, buttonTextColor, buttonStyle, fontFamily } = config

        const variables = {
            '--bg-color': backgroundColor || '#ffffff',
            '--btn-bg': buttonColor || '#000000',
            '--btn-text': buttonTextColor || '#ffffff',
            '--font-main': fontFamily || 'Inter, sans-serif',
        } as React.CSSProperties

        return (
            <div
                className="h-[600px] w-full max-w-[375px] mx-auto overflow-y-auto border-8 border-gray-800 rounded-[3rem] shadow-2xl bg-[var(--bg-color)] font-[family-name:var(--font-main)] transition-colors duration-200"
                style={variables}
            >
                <div className="h-full w-full p-6 flex flex-col gap-4">
                    {/* Preview Header */}
                    <div className="text-center py-4">
                        <div className="h-6 w-32 bg-gray-200/50 rounded mx-auto mb-2 animate-pulse"></div>
                    </div>

                    {/* Preview Blocks */}
                    {blocks.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-10">La page est vide</div>
                    ) : (
                        blocks.map(block => {
                            if (block.type === 'link') {
                                return (
                                    <div
                                        key={block.id}
                                        className={`w-full p-4 flex items-center justify-center shadow-sm ${buttonStyle} bg-[var(--btn-bg)] text-[var(--btn-text)] transition-colors`}
                                    >
                                        <span className="font-medium">{block.content.title}</span>
                                    </div>
                                )
                            }
                            if (block.type === 'text') {
                                return (
                                    <div key={block.id} className="text-sm text-gray-700 bg-white/80 p-3 rounded backdrop-blur-sm shadow-sm">
                                        {block.content.text || block.content.title}
                                    </div>
                                )
                            }
                            if (block.type === 'file') {
                                return (
                                    <div
                                        key={block.id}
                                        className="w-full p-3 flex items-center gap-3 bg-white/90 border border-gray-200/50 rounded-lg shadow-sm backdrop-blur-sm"
                                    >
                                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 truncate flex-1">
                                            {block.content.title || 'Document'}
                                        </span>
                                    </div>
                                )
                            }
                            if (block.type === 'image') {
                                return (
                                    <div key={block.id} className="w-full">
                                        <img
                                            src={block.content.url}
                                            alt={block.content.title}
                                            className="w-full h-auto rounded-lg shadow-sm"
                                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                                        />
                                    </div>
                                )
                            }
                            return null
                        })
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-12rem)]">

            {/* LEFT: Editor Controls */}
            <div className="flex-1 space-y-6">

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`${activeTab === 'content'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}
                        >
                            <Layers className="h-4 w-4" />
                            Contenu
                        </button>
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`${activeTab === 'design'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}
                        >
                            <Palette className="h-4 w-4" />
                            Apparence
                        </button>
                    </nav>
                </div>

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6">
                        <div className="flex justify-end gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                accept="image/*,application/pdf"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loadingAdd}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                                {loadingAdd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                Ajouter un fichier
                            </button>
                            <button
                                onClick={handleAddBlock}
                                disabled={loadingAdd}
                                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loadingAdd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Ajouter un lien
                            </button>
                        </div>

                        <div className="space-y-4">
                            {blocks.map((block) => {
                                const isEditing = !!edits[block.id]
                                // For files, we typically don't edit the URL directly via text, maybe just title
                                const title = isEditing ? edits[block.id].title : block.content.title
                                const url = isEditing ? edits[block.id].url : block.content.url
                                const saveLoading = isEditing && edits[block.id].loading
                                const isDeleting = deleting[block.id]
                                const isFile = block.type === 'file' || block.type === 'image'

                                return (
                                    <div
                                        key={block.id}
                                        className={`group relative flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex cursor-col-resize flex-col justify-center text-gray-400 hover:text-gray-600">
                                            <GripVertical className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            {isFile ? (
                                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <div className="h-10 w-10 bg-white rounded flex items-center justify-center border border-gray-200">
                                                        {block.type === 'image' ? (
                                                            <img src={block.content.url} alt="" className="h-full w-full object-cover rounded" />
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
                                            ) : (
                                                <>
                                                    <div>
                                                        <label htmlFor={`title-${block.id}`} className="block text-sm font-medium text-gray-700">
                                                            Titre
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id={`title-${block.id}`}
                                                            value={title}
                                                            onChange={(e) => handleEditChange(block.id, 'title', e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 text-black placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm border p-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`url-${block.id}`} className="block text-sm font-medium text-gray-700">
                                                            URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            id={`url-${block.id}`}
                                                            value={url}
                                                            onChange={(e) => handleEditChange(block.id, 'url', e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 text-black placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm border p-2"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => handleDelete(block.id)}
                                                disabled={isDeleting}
                                                className="rounded-md p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Supprimer"
                                            >
                                                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                            </button>
                                            {isEditing && !isFile && (
                                                <button
                                                    onClick={() => handleSaveBlock(block.id)}
                                                    disabled={saveLoading}
                                                    className="rounded-md bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                                                    title="Enregistrer"
                                                >
                                                    {saveLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* DESIGN TAB */}
                {activeTab === 'design' && (
                    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">

                        {/* Background Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Couleur de fond</label>
                            <div className="mt-1 flex items-center gap-3">
                                <input
                                    type="color"
                                    value={config.backgroundColor}
                                    onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300 p-1 cursor-pointer"
                                />
                                <span className="text-sm text-gray-500 font-mono">{config.backgroundColor}</span>
                            </div>
                        </div>

                        {/* Button Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Couleur des boutons</label>
                            <div className="mt-1 flex items-center gap-3">
                                <input
                                    type="color"
                                    value={config.buttonColor}
                                    onChange={(e) => handleConfigChange('buttonColor', e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300 p-1 cursor-pointer"
                                />
                                <span className="text-sm text-gray-500 font-mono">{config.buttonColor}</span>
                            </div>
                        </div>

                        {/* Button Text Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Couleur du texte des boutons</label>
                            <div className="mt-1 flex items-center gap-3">
                                <input
                                    type="color"
                                    value={config.buttonTextColor}
                                    onChange={(e) => handleConfigChange('buttonTextColor', e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300 p-1 cursor-pointer"
                                />
                                <span className="text-sm text-gray-500 font-mono">{config.buttonTextColor}</span>
                            </div>
                        </div>

                        {/* Button Style */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Style des boutons</label>
                            <select
                                value={config.buttonStyle}
                                onChange={(e) => handleConfigChange('buttonStyle', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-black py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                            >
                                <option value="rounded-none">Carré</option>
                                <option value="rounded-md">Arrondi</option>
                                <option value="rounded-full">Pilule</option>
                            </select>
                        </div>

                        {/* Font Family */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Police d'écriture</label>
                            <select
                                value={config.fontFamily}
                                onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-black py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                            >
                                <option value="Inter, sans-serif">Inter (Moderne)</option>
                                <option value="'Courier New', Courier, monospace">Courier (Code)</option>
                                <option value="'Times New Roman', Times, serif">Times (Classique)</option>
                                <option value="Arial, sans-serif">Arial (Simple)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <button
                                onClick={handleSaveConfig}
                                disabled={savingConfig}
                                className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Enregistrer le thème
                            </button>
                        </div>

                    </div>
                )}

            </div>

            {/* RIGHT: Live Preview */}
            <div className="flex-1 lg:max-w-md">
                <div className="sticky top-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Aperçu en direct</h3>
                    {renderPreview()}
                </div>
            </div>

        </div>
    )
}
