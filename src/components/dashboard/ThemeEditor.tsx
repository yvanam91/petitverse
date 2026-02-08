'use client'

import { useState, useEffect } from 'react'
import type { PageConfig, Theme } from '@/types/database'
import { saveTheme, updateTheme, applyThemeToProject } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { Loader2, Check, Save } from 'lucide-react'

interface ThemeEditorProps {
    themes: Theme[]
    projectId: string
}

export function ThemeEditor({ themes: initialThemes, projectId }: ThemeEditorProps) {
    const [themes, setThemes] = useState<Theme[]>(initialThemes)
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(initialThemes.length > 0 ? initialThemes[0].id : null)
    const [config, setConfig] = useState<PageConfig>(() => {
        const baseConfig = initialThemes.length > 0 ? initialThemes[0].config : {}
        return {
            ...baseConfig,
            colors: {
                background: baseConfig.colors?.background || baseConfig.backgroundColor || '#ffffff',
                primary: baseConfig.colors?.primary || baseConfig.buttonColor || '#000000',
                secondary: baseConfig.colors?.secondary || baseConfig.secondaryColor || '#e5e7eb',
                text: baseConfig.colors?.text || baseConfig.textColor || '#1f2937',
                link: baseConfig.colors?.link || baseConfig.linkColor || '#000000',
                buttonText: baseConfig.colors?.buttonText || baseConfig.buttonTextColor || '#ffffff'
            },
            borders: {
                radius: baseConfig.borders?.radius || '8px',
                width: baseConfig.borders?.width || '1px',
                style: baseConfig.borders?.style || 'solid'
            },
            typography: {
                fontFamily: baseConfig.typography?.fontFamily || baseConfig.fontFamily || 'Inter, sans-serif'
            },
            dividers: {
                style: baseConfig.dividers?.style || 'solid',
                width: baseConfig.dividers?.width || '1px',
                color: baseConfig.dividers?.color || '#e5e7eb'
            }
        }
    })
    const [themeName, setThemeName] = useState(initialThemes.length > 0 ? initialThemes[0].name : 'Nouveau Thème')
    const [isSaving, setIsSaving] = useState(false)
    const [isApplying, setIsApplying] = useState(false)

    useEffect(() => {
        if (selectedThemeId) {
            const theme = themes.find(t => t.id === selectedThemeId)
            if (theme) {
                setConfig(theme.config)
                setThemeName(theme.name)
            }
        }
    }, [selectedThemeId, themes])

    const handleColorChange = (key: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            colors: {
                ...(prev.colors || {}),
                [key]: value
            } as any
        }))
    }

    const handleBorderChange = (key: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            borders: {
                ...(prev.borders || {}),
                [key]: value
            } as any
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (selectedThemeId && selectedThemeId !== 'new') {
                const result = await updateTheme(selectedThemeId, themeName, config)
                if (result.error) throw new Error(result.error)
                toast.success('Thème mis à jour')
            } else {
                const result = await saveTheme(themeName, config, projectId)
                if (result.error) throw new Error(result.error)
                if (result.theme) {
                    setThemes(prev => [result.theme!, ...prev])
                    setSelectedThemeId(result.theme.id)
                }
                toast.success('Thème sauvegardé')
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleApplyToProject = async () => {
        if (!selectedThemeId || selectedThemeId === 'new') {
            toast.error('Veuillez d\'abord sauvegarder le thème')
            return
        }
        setIsApplying(true)
        try {
            const result = await applyThemeToProject(projectId, selectedThemeId)
            if (result.error) throw new Error(result.error)
            toast.success('Thème appliqué à tout le projet')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsApplying(false)
        }
    }

    const previewStyle = {
        '--bg-color': config.colors?.background || '#ffffff',
        '--primary': config.colors?.primary || '#000000',
        '--secondary': config.colors?.secondary || '#e5e7eb',
        '--text': config.colors?.text || '#1f2937',
        '--link': config.colors?.link || '#000000',
        '--btn-text': config.colors?.buttonText || '#ffffff',
        '--font-family': config.typography?.fontFamily || 'Inter, sans-serif',
        '--border-radius': config.borders?.radius || '8px',
        '--border-width': config.borders?.width || '1px',
        '--divider-style': config.dividers?.style || 'solid',
        fontFamily: 'var(--font-family)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text)',
    } as React.CSSProperties

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">
            {/* Left: Controls */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un thème</label>
                        <select
                            value={selectedThemeId || 'new'}
                            onChange={(e) => {
                                if (e.target.value === 'new') {
                                    setSelectedThemeId('new')
                                    setThemeName('Nouveau Thème')
                                    // Keep current config as start base
                                } else {
                                    setSelectedThemeId(e.target.value)
                                }
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            <option value="new">+ Créer un nouveau thème</option>
                            {themes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom du thème</label>
                        <input
                            type="text"
                            value={themeName}
                            onChange={(e) => setThemeName(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <div className="space-y-6">
                        {/* Typography */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Typographie</h3>
                            <select
                                value={config.typography?.fontFamily}
                                onChange={(e) => setConfig(prev => ({ ...prev, typography: { ...prev.typography!, fontFamily: e.target.value } }))}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            >
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="Roboto, sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="'Courier New', monospace">Courier New</option>
                            </select>
                        </div>

                        {/* Colors */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Palette de couleurs</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Arrière-plan</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.colors?.background}
                                            onChange={(e) => handleColorChange('background', e.target.value)}
                                            className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right font-mono">{config.colors?.background}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Primaire (Boutons)</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.colors?.primary}
                                            onChange={(e) => handleColorChange('primary', e.target.value)}
                                            className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right font-mono">{config.colors?.primary}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Texte Bouton</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.colors?.buttonText}
                                            onChange={(e) => handleColorChange('buttonText', e.target.value)}
                                            className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right font-mono">{config.colors?.buttonText}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Secondaire (Diviseurs)</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.colors?.secondary}
                                            onChange={(e) => handleColorChange('secondary', e.target.value)}
                                            className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right font-mono">{config.colors?.secondary}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Texte</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.colors?.text}
                                            onChange={(e) => handleColorChange('text', e.target.value)}
                                            className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right font-mono">{config.colors?.text}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Liens</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={config.colors?.link}
                                            onChange={(e) => handleColorChange('link', e.target.value)}
                                            className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right font-mono">{config.colors?.link}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Borders & Radius */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Bordures & Formes</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Arrondi (Radius): {config.borders?.radius}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="30"
                                        value={parseInt(config.borders?.radius || '8')}
                                        onChange={(e) => handleBorderChange('radius', `${e.target.value}px`)}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 px-1">
                                        <span>Carré</span>
                                        <span>Rond</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Épaisseur bordure</label>
                                    <select
                                        value={config.borders?.width}
                                        onChange={(e) => handleBorderChange('width', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    >
                                        <option value="0px">Aucune (0px)</option>
                                        <option value="1px">Fine (1px)</option>
                                        <option value="2px">Moyenne (2px)</option>
                                        <option value="4px">Épaisse (4px)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center w-full gap-2 rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Sauvegarder le thème
                    </button>
                    <button
                        onClick={handleApplyToProject}
                        disabled={isApplying || !selectedThemeId || selectedThemeId === 'new'}
                        className="flex items-center justify-center w-full gap-2 rounded-md bg-white border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Appliquer à tout le projet
                    </button>
                </div>
            </div>

            {/* Right: Preview */}
            <div className="w-full lg:w-2/3 bg-gray-100/50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu en direct</span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div
                        className="max-w-md mx-auto min-h-[600px] shadow-2xl rounded-[30px] overflow-hidden border-8 border-gray-900 transition-all duration-300 p-8"
                        style={previewStyle}
                    >
                        {/* Content Skeleton matches PublicPage but simpler */}
                        <div className="flex flex-col items-center text-center space-y-6 pt-10">
                            {/* Profile Image Mock */}
                            <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-sm mb-2"></div>

                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Mon Super Projet</h2>
                                <p className="opacity-80">@mon_handle</p>
                            </div>

                            {/* Separator */}
                            <hr
                                className="w-2/3 opacity-50"
                                style={{
                                    borderColor: 'var(--secondary)',
                                    borderStyle: 'var(--divider-style)',
                                    borderTopWidth: '1px'
                                }}
                            />

                            {/* Text */}
                            <p className="opacity-90 leading-relaxed px-4">
                                Bienvenue sur ma page. Ceci est un aperçu en temps réel de votre thème. Modifiez les couleurs et les formes à gauche pour voir le résultat.
                            </p>

                            {/* Buttons */}
                            <div className="w-full space-y-4 pt-4">
                                <button
                                    className="w-full py-4 px-6 font-medium shadow-sm transition-transform hover:scale-[1.02]"
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'var(--btn-text)',
                                        borderRadius: 'var(--border-radius)',
                                        borderWidth: 'var(--border-width)',
                                        borderColor: 'transparent', // Fill buttons usually dont have distinct border unless outlined
                                        borderStyle: 'solid'
                                    }}
                                >
                                    Bouton Principal
                                </button>

                                <button
                                    className="w-full py-4 px-6 font-medium shadow-sm transition-transform hover:scale-[1.02]"
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: 'var(--primary)',
                                        borderRadius: 'var(--border-radius)',
                                        borderWidth: 'var(--border-width)',
                                        borderColor: 'var(--primary)',
                                        borderStyle: 'solid'
                                    }}
                                >
                                    Bouton Secondaire (Outline)
                                </button>
                            </div>

                            <div className="pt-8 text-xs opacity-50">
                                <p>Rejoignez-nous sur les réseaux</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
