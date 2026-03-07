'use client'

import React from 'react'
import { TrendingUp } from 'lucide-react'

interface PagesTableProps {
    pages: any[]
    isLoading: boolean
}

export function PagesTable({ pages, isLoading }: PagesTableProps) {
    return (
        <div className="bg-pv-dark-0 rounded-2xl border border-white-0/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white-0/5 flex items-center justify-between">
                <h2 className="text-lg font-pv-jost font-pv-bold text-white-0 uppercase tracking-wide">Performance des pages</h2>
                <TrendingUp className="w-5 h-5 text-pv-brand-500" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white-0/5">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-pv-bold text-white-0/40 uppercase tracking-widest">Slug</th>
                            <th className="px-6 py-3 text-[10px] font-pv-bold text-white-0/40 uppercase tracking-widest text-right">Visites</th>
                            <th className="px-6 py-3 text-[10px] font-pv-bold text-white-0/40 uppercase tracking-widest text-right">Clics</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white-0/5">
                        {isLoading ? (
                            [1, 2, 3].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 w-32 bg-pv-dark-100/50 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-pv-dark-100/50 rounded ml-auto" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-pv-dark-100/50 rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : pages?.length > 0 ? (
                            pages.map((page: any) => (
                                <tr key={page.page_id} className="hover:bg-white-0/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-pv-regular text-white-0/80">/{page.page_slug || page.slug}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-pv-bold text-pv-brand-500">{page.visit_count}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-pv-bold text-indigo-400">{page.click_count || 0}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="px-6 py-8 text-center text-sm text-white-0/40 italic">
                                    Aucune donnée pour le moment
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
