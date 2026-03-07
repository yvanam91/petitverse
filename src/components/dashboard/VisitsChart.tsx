'use client'

import React from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface VisitsChartProps {
    data: { date: string; visits: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-pv-dark-100 border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-pv-white-0 text-xs font-medium uppercase tracking-wider mb-1">
                    {format(parseISO(label), 'd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-pv-brand-500 font-bold text-lg">
                    {payload[0].value} <span className="text-[10px] uppercase opacity-60">visites</span>
                </p>
            </div>
        )
    }
    return null
}

export function VisitsChart({ data }: VisitsChartProps) {
    return (
        <div className="w-full h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A997DF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#A997DF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(243, 238, 248, 0.4)', fontSize: 10 }}
                        tickFormatter={(str) => format(parseISO(str), 'dd MMM', { locale: fr })}
                        minTickGap={30}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(243, 238, 248, 0.4)', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="visits"
                        stroke="#A997DF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVisits)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
