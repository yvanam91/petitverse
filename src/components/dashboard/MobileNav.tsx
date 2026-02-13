'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useAnimationControls, PanInfo } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import type { Project } from '@/types/database'

interface MobileNavProps {
    projectSlug: string
    projects: Project[]
    currentProject: Project
    username?: string | null
}

export function MobileNav({ projectSlug, projects, currentProject, username }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const controls = useAnimationControls()

    // Nudge animation
    const nudgeControls = useAnimationControls()

    useEffect(() => {
        // Pulse animation on mount to indicate swipeability
        nudgeControls.start({
            x: [0, 6, 0, 6, 0],
            opacity: [0, 0.5, 0, 0.5, 0],
            transition: { duration: 1.5, delay: 0.5, ease: "easeInOut" }
        })
    }, [nudgeControls])

    const toggleOpen = () => setIsOpen(!isOpen)

    const onDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100
        const velocityThreshold = 500

        // If dragging right and passed threshold or high velocity
        if (!isOpen && (info.offset.x > threshold || info.velocity.x > velocityThreshold)) {
            setIsOpen(true)
        }
        // If closing (dragging left)
        else if (isOpen && (info.offset.x < -threshold || info.velocity.x < -velocityThreshold)) {
            setIsOpen(false)
        }
    }

    return (
        <div className="md:hidden" ref={containerRef}>
            {/* Burger Button - Fixed Top Left */}
            <button
                onClick={toggleOpen}
                className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-100 text-gray-700 active:scale-95 transition-transform"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Visual Nudge for Swipe - Left Edge */}
            <motion.div
                className="fixed top-1/2 -translate-y-1/2 left-0 w-1 h-32 bg-indigo-500/50 rounded-r-full pointer-events-none z-40 touch-none"
                initial={{ opacity: 0, x: -5 }}
                animate={nudgeControls}
            />

            {/* Gesture Detection Zone - Left Edge */}
            <motion.div
                className="fixed top-0 bottom-0 left-0 w-8 z-40 bg-transparent"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.05}
                onDragEnd={(e, info) => {
                    if (info.offset.x > 50) setIsOpen(true)
                }}
            />

            {/* Drawer Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Drawer Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }} // Don't allow dragging content freely
                        // We use pan on backdrop or specific logic usually, but let's allow "swipe left to close" on the drawer itself?
                        // Adding drag logic to close drawer by swiping left
                        dragElastic={{ right: 0.1 }}
                        onDragEnd={(e, info) => {
                            if (info.offset.x < -50) setIsOpen(false)
                        }}
                        className="fixed top-0 bottom-0 left-0 w-[80%] max-w-sm bg-white z-50 shadow-2xl h-full"
                    >
                        {/* Reuse Sidebar but inside the drawer */}
                        {/* We need to adjust Sidebar to fill height and maybe hide some borders if needed */}
                        <div className="h-full overflow-y-auto">
                            <Sidebar
                                projectSlug={projectSlug}
                                projects={projects}
                                currentProject={currentProject}
                                username={username}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
