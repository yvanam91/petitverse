export type Profile = {
    id: string
    created_at: string
    email: string
    username: string | null
    full_name: string | null
}


export type BlockType = 'text' | 'image' | 'video' | 'button' | 'hero' | 'link' | 'double-link' | 'file' | 'header' | 'social_grid' | 'separator' | 'title' | 'embed'

export interface Block {
    id: string
    type: BlockType
    content: Record<string, any>
    position: number
    is_visible?: boolean
    page_id: string
}

export interface PageConfig {
    // Legacy support (to be deprecated)
    backgroundColor?: string
    buttonColor?: string
    buttonTextColor?: string
    buttonStyle?: 'rounded-none' | 'rounded-md' | 'rounded-full'
    buttonVariant?: 'fill' | 'outline' | 'soft-shadow'
    fontFamily?: string
    secondaryColor?: string
    textColor?: string
    linkColor?: string
    headerBackgroundImage?: string

    // Phase 1 New Structure
    colors?: {
        background: string
        primary: string
        secondary: string
        text: string
        link: string
        buttonText: string
    }
    typography?: {
        fontFamily: string
    }
    borders?: {
        radius: string // e.g., '8px', '9999px'
        width: string // e.g., '1px', '2px'
        style: 'solid' | 'dashed' | 'dotted' | 'none'
    }
    dividers?: {
        style: 'solid' | 'dashed' | 'dotted' | 'zigzag' | 'wave'
        width: string
        color: string
    }
    shadows?: {
        style: 'none' | 'hard' | 'soft'
        opacity: number // de 0 à 1
    }
    [key: string]: any
}

export interface Theme {
    id: string
    name: string
    config: PageConfig
    user_id: string
    project_id: string
    created_at: string
}

export type Page = {
    id: string
    created_at: string
    project_id: string
    theme_id?: string | null
    title: string
    slug: string
    description?: string
    is_published?: boolean
    meta_title?: string
    config?: PageConfig
    theme?: Theme
    blocks?: Block[]
}

export type Project = {
    id: string
    created_at: string
    user_id: string
    name: string
    slug: string
    default_theme_id?: string
}
