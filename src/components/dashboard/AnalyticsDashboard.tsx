'use client'

import React, { useState, useMemo } from 'react'
import useSWR from 'swr'
import {
    Users,
    Smartphone,
    FileText,
    Loader2
} from 'lucide-react'
import { VisitsChart } from '@/components/dashboard/VisitsChart'
import { PagesTable } from '@/components/dashboard/PagesTable'
import { LinksPerformanceTable } from '@/components/dashboard/LinksPerformanceTable'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AnalyticsDashboardProps {
    projectId: string
    projectName: string
}

export function AnalyticsDashboard({ projectId, projectName }: AnalyticsDashboardProps) {
    const [period, setPeriod] = useState<'7d' | '30d'>('7d')
    const { data, error, isLoading } = useSWR(
        `/api/v1/projects/${projectId}/stats?period=${period}`,
        fetcher
    )

    const mostVisitedPage = useMemo(() => {
        if (!data?.pages || data.pages.length === 0) return null
        return [...data.pages].sort((a: any, b: any) => (b.visit_count || 0) - (a.visit_count || 0))[0]
    }, [data])

    const mostUsedDevice = useMemo(() => {
        if (!data?.devices) return '...'

        // On force le typage des entrées pour aider TypeScript
        const entries = Object.entries(data.devices) as [string, number][]

        if (entries.length === 0) return '...'

        const sorted = entries.sort((a, b) => b[1] - a[1])
        const bestEntry = sorted[0]

        // Vérification explicite du premier élément et de sa valeur
        if (bestEntry && bestEntry[1] > 0) {
            return bestEntry[0] // Retourne 'desktop', 'mobile', etc.
        }

        return '...'
    }, [data])

    if (error) return (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
            Erreur lors du chargement des statistiques.
        </div>
    )

    return (
        <div className="min-h-screen pv-dark-100 pb-20">
            {/* Header matches other dashboard pages */}
            <header className="bg-pv-dark-0 text-white-0">
                <div className="mx-auto max-w-7x1 px-4 py-pv-20 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-pv-inter font-pv-bold text-pv-12 text-white-0 uppercase tracking-widest">
                                Analytics : {projectName}
                            </h1>
                            <p className="mt-1 font-pv-inter font-pv-regular text-pv-12 text-white-0 opacity-70">
                                Suivez les performances de votre projet en temps réel.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-pv-dark-200 rounded-lg w-fit">
                            <button
                                onClick={() => setPeriod('7d')}
                                className={`px-4 py-1.5 text-[10px] font-pv-bold uppercase tracking-wider rounded-md transition-all ${period === '7d'
                                    ? 'bg-pv-gradient-soft text-white-0 shadow-sm'
                                    : 'text-white-0/50 hover:text-white-0'
                                    }`}
                            >
                                7 Jours
                            </button>
                            <button
                                onClick={() => setPeriod('30d')}
                                className={`px-4 py-1.5 text-[10px] font-pv-bold uppercase tracking-wider rounded-md transition-all ${period === '30d'
                                    ? 'bg-pv-gradient-soft text-white-0 shadow-sm'
                                    : 'text-white-0/50 hover:text-white-0'
                                    }`}
                            >
                                30 Jours
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Visits */}
                    <div className="bg-pv-dark-0 p-6 rounded-2xl border border-white-0/5 shadow-sm transition-all hover:border-white-0/10 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-pv-brand-500/10 rounded-xl text-pv-brand-500 group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-pv-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
                        </div>
                        {isLoading ? (
                            <div className="h-8 w-24 bg-pv-dark-200 animate-pulse rounded" />
                        ) : (
                            <div>
                                <span className="text-3xl font-pv-jost font-pv-bold text-white-0">{data?.totalVisits || 0}</span>
                                <p className="text-xs text-white-0/50 mt-1 uppercase tracking-widest font-pv-regular">Visites totales</p>
                            </div>
                        )}
                    </div>

                    {/* Most Used Device */}
                    <div className="bg-pv-dark-0 p-6 rounded-2xl border border-white-0/5 shadow-sm transition-all hover:border-white-0/10 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                                <Smartphone className="w-5 h-5" />
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="h-8 w-32 bg-pv-dark-200 animate-pulse rounded" />
                        ) : (
                            <div>
                                <span className="text-3xl font-pv-jost font-pv-bold text-white-0 capitalize">{mostUsedDevice}</span>
                                <p className="text-xs text-white-0/50 mt-1 uppercase tracking-widest font-pv-regular">Device dominant</p>
                            </div>
                        )}
                    </div>

                    {/* Top Page */}
                    <div className="bg-pv-dark-0 p-6 rounded-2xl border border-white-0/5 shadow-sm transition-all hover:border-white-0/10 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="h-8 w-40 bg-pv-dark-200 animate-pulse rounded" />
                        ) : (
                            <div>
                                <span className="text-xl font-pv-jost font-pv-bold text-white-0 truncate block">
                                    {mostVisitedPage ? (mostVisitedPage.page_title || `/${mostVisitedPage.page_slug}`) : 'N/A'}
                                </span>
                                <p className="text-xs text-white-0/50 mt-1 uppercase tracking-widest font-pv-regular">Page la plus vue</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-pv-dark-0 p-6 md:p-8 rounded-2xl border border-white-0/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-pv-jost font-pv-bold text-white-0 uppercase tracking-wide">Évolution des visites</h2>
                        {isLoading && <Loader2 className="w-5 h-5 text-pv-brand-500 animate-spin" />}
                    </div>

                    {isLoading ? (
                        <div className="w-full h-[300px] bg-pv-dark-100/50 animate-pulse rounded-xl flex items-center justify-center">
                            <span className="text-white-0/20 text-sm font-pv-bold uppercase tracking-widest">Calcul des données...</span>
                        </div>
                    ) : (
                        <VisitsChart data={data?.chartData || []} />
                    )}
                </div>

                {/* Tables Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <PagesTable pages={data?.pages || []} isLoading={isLoading} />
                    <LinksPerformanceTable links={data?.links || []} isLoading={isLoading} />
                </div>
            </main>
        </div>
    )
}
