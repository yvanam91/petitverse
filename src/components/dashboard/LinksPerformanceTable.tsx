'use client'

import React from 'react'
import { ExternalLink as LinkIcon } from 'lucide-react'

interface LinksPerformanceTableProps {
    links: any[]
    isLoading: boolean
}

export function LinksPerformanceTable({ links, isLoading }: LinksPerformanceTableProps) {
    const sortedLinks = links ? [...links].sort((a, b) => (b.click_count || 0) - (a.click_count || 0)) : []

    return (
        <div className="bg-pv-dark-0 rounded-2xl border border-white-0/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white-0/5 flex items-center justify-between">
                <h2 className="text-lg font-pv-jost font-pv-bold text-white-0 uppercase tracking-wide">Top Liens cliqués</h2>
                <LinkIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white-0/5">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-pv-bold text-white-0/40 uppercase tracking-widest">Libellé</th>
                            <th className="px-6 py-3 text-[10px] font-pv-bold text-white-0/40 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-3 text-[10px] font-pv-bold text-white-0/40 uppercase tracking-widest text-right">Clics</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white-0/5">
                        {isLoading ? (
                            [1, 2, 3].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-pv-dark-100/50 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-16 bg-pv-dark-100/50 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-10 bg-pv-dark-100/50 rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : sortedLinks.length > 0 ? (
                            sortedLinks.map((link: any, idx) => (
                                <tr key={idx} className="hover:bg-white-0/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-pv-regular text-white-0/80 truncate max-w-[150px] block">
                                            {link.link_label || 'Lien sans titre'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-pv-bold bg-pv-dark-200 text-white-0/60 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {link.block_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-pv-bold text-indigo-400">{link.click_count || 0}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-sm text-white-0/40 italic">
                                    Aucun clic enregistré pour le moment
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
