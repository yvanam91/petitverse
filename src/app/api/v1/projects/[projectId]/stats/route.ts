import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { subDays, format, eachDayOfInterval } from 'date-fns'

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await context.params
    const supabase = await createClient()

    // 1. Check Auth & Ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('Authentification requise', { status: 401 })
    }

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

    if (projectError || !project || project.user_id !== user.id) {
        return new NextResponse('Accès refusé', { status: 403 })
    }

    // 2. Parse Period & Date Range
    const searchParams = req.nextUrl.searchParams
    const period = searchParams.get('period') || '7d'
    const days = period === '30d' ? 30 : 7

    // We want the last X days including today
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)

    // 3. Fetch Aggregate Stats from daily_project_stats view
    const { data: dailyResults, error: statsError } = await supabase
        .from('daily_project_stats')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })

    if (statsError) {
        console.error('Erreur lors de la récupération des stats:', statsError)
        return new NextResponse('Erreur serveur', { status: 500 })
    }

    // 4. Fetch Page level stats
    // Note: Using project_pages_stats as fallback if stats_page_overview is not available
    let { data: pageOverview } = await supabase
        .from('stats_page_overview')
        .select('*')
        .eq('project_id', projectId)

    if (!pageOverview) {
        const { data: fallbackPages } = await supabase
            .from('project_pages_stats')
            .select('*')
            .eq('project_id', projectId)
        pageOverview = fallbackPages
    }

    // 5. Fetch Link performance stats
    // stats_links_performance is an aggregate view and might not have a created_at column
    const { data: linkStats } = await supabase
        .from('stats_links_performance')
        .select('*')
        .eq('project_id', projectId)

    // Normalize page visit keys and MERGE click data
    const normalizedPages = (pageOverview || []).map((p: any) => {
        const pageId = p.page_id || p.id
        // Sum clicks for this specific page
        const pageClicks = (linkStats || [])
            .filter((l: any) => l.page_id === pageId)
            .reduce((sum: number, l: any) => sum + (l.click_count || 0), 0)

        return {
            ...p,
            visit_count: p.visit_count ?? p.total_visits ?? 0,
            click_count: pageClicks
        }
    })

    // 6. Gap Filling (Ensure every day in the interval is present)
    const interval = eachDayOfInterval({ start: startDate, end: endDate })

    // Create a map for quick lookup and AGGREGATE by date (summing device counts)
    const statsMap = new Map<string, number>()
    const deviceStats: Record<string, number> = {
        mobile: 0,
        tablet: 0,
        desktop: 0
    }

    dailyResults?.forEach(row => {
        // visits by date aggregation
        const current = statsMap.get(row.date) || 0
        const count = row.visit_count || row.total_visits || 0
        statsMap.set(row.date, current + count)

        // devices aggregation (much more efficient than fetching all rows)
        const d = row.device as string
        if (d && deviceStats.hasOwnProperty(d)) {
            deviceStats[d] += count
        } else {
            deviceStats.desktop += count
        }
    })

    const chartData = interval.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return {
            date: dateStr,
            visits: statsMap.get(dateStr) || 0
        }
    })

    // 7. Calculate Totals
    const totalVisits = Array.from(statsMap.values()).reduce((acc, curr) => acc + curr, 0)

    return NextResponse.json({
        projectId,
        period,
        totalVisits,
        chartData,
        pages: normalizedPages,
        links: linkStats || [],
        devices: deviceStats,
        generatedAt: new Date().toISOString()
    })
}
