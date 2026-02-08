import { PageConfig } from '@/types/database'
import { Globe, Twitter, Instagram, Facebook, Linkedin, Github } from 'lucide-react'

interface SocialGridBlockProps {
    content: {
        links?: Array<{ icon: string; url: string }>
    }
    config: PageConfig
}

const SOCIAL_ICONS_MAP: Record<string, typeof Globe> = {
    globe: Globe,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    github: Github
}

export function SocialGridBlock({ content, config }: SocialGridBlockProps) {
    const primary = config.colors?.primary || config.buttonColor || '#000000'

    return (
        <div className="flex flex-row flex-wrap justify-center gap-6 mb-4 w-full">
            {content.links?.map((link, i) => {
                const Icon = SOCIAL_ICONS_MAP[link.icon] || Globe
                return (
                    <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:scale-105 hover:shadow-md transition-all border border-gray-100"
                        style={{ color: primary }}
                    >
                        <Icon className="h-5 w-5" />
                    </a>
                )
            })}
        </div>
    )
}
