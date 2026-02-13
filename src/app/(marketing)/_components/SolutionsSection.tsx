'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Section } from './Section'
import { LayoutTemplate, WalletCards, Wrench, Palette } from 'lucide-react'

const TABS = [
    {
        id: 'personal',
        label: 'Page personnelle',
        icon: LayoutTemplate,
        title: 'Votre carte de visite numérique',
        description: "Centralisez votre présence en ligne. Une page unique pour présenter qui vous êtes, ce que vous faites et où vous trouver. Idéal pour les créateurs, freelances et professionnels.",
    },
    {
        id: 'projects',
        label: 'Projets',
        icon: WalletCards,
        title: 'Showcasez vos réalisations',
        description: "Révolutionnez le link-in-bio. Créez des pages dédiées pour chaque projet, produit ou événement. Gardez votre audience concentrée sur ce qui compte vraiment.",
    },
    {
        id: 'tools',
        label: 'Outils',
        icon: Wrench,
        title: 'Intégrations puissantes',
        description: "Connectez vos outils préférés. Newsletter, formulaires de contact, prise de rendez-vous... Tout ce dont vous avez besoin pour convertir vos visiteurs, sans code.",
    },
    {
        id: 'theme',
        label: 'Thème',
        icon: Palette,
        title: 'Design système unifié',
        description: "Une cohérence visuelle parfaite. Définissez vos couleurs et polices une seule fois, elles s'appliquent partout. Vos pages restent toujours alignées avec votre marque.",
    },
]

export function SolutionsSection() {
    const [activeTab, setActiveTab] = useState(TABS[0].id)

    return (
        <Section id="solutions" className="bg-zinc-50 dark:bg-zinc-900/50">
            <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl font-[var(--font-heading)]">
                    Tout pour construire votre univers
                </h2>
                <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                    Une suite d'outils minimalistes pour une présence maximale.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                {/* Tabs Navigation */}
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 md:w-1/3 min-w-[200px]">
                    {TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all relative ${isActive
                                        ? 'text-[var(--primary)] bg-white dark:bg-zinc-800 shadow-sm'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[var(--primary)]' : ''}`} />
                                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 rounded-lg border-2 border-[var(--primary)] pointer-events-none"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-[300px] relative">
                    <AnimatePresence mode="wait">
                        {TABS.map((tab) => (
                            tab.id === activeTab && (
                                <motion.div
                                    key={tab.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white dark:bg-zinc-800 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-700 shadow-sm h-full flex flex-col justify-center"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-6 text-[var(--primary)]">
                                        <tab.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                                        {tab.title}
                                    </h3>
                                    <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {tab.description}
                                    </p>
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </Section>
    )
}
