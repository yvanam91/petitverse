import { useEffect, useState, useCallback } from 'react'
import { nanoid } from 'nanoid'

const SESSION_KEY = 'pv_session_id_v1'

export function usePicoverseAnalytics(projectId: string, pageId: string) {
    const [sessionId, setSessionId] = useState<string | null>(null)

    useEffect(() => {
        // Analytics only in production
        if (process.env.NODE_ENV !== 'production') return

        let id = localStorage.getItem(SESSION_KEY)
        if (!id) {
            id = nanoid()
            localStorage.setItem(SESSION_KEY, id)
        }
        setSessionId(id)

        // Track Visit immediately on mount
        const payload = JSON.stringify({
            type: 'visit',
            projectId,
            pageId,
            sessionId: id
        })

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/v1/track', payload)
        } else {
            fetch('/api/v1/track', {
                method: 'POST',
                body: payload,
                keepalive: true
            })
        }
    }, [projectId, pageId])

    const trackClick = useCallback((blockId: string, blockType: string) => {
        if (process.env.NODE_ENV !== 'production' || !sessionId) return

        const payload = JSON.stringify({
            type: 'click',
            projectId,
            pageId,
            sessionId,
            blockId,
            blockType
        })

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/v1/track', payload)
        } else {
            fetch('/api/v1/track', {
                method: 'POST',
                body: payload,
                keepalive: true
            })
        }
    }, [projectId, pageId, sessionId])

    return { sessionId, trackClick }
}