export type Profile = {
    id: string
    created_at: string
    email: string
}

export type BlockType = 'text' | 'image' | 'video' | 'button' | 'hero' | 'link' | 'file' | 'header' | 'social_grid' | 'separator' | 'title'

export interface Block {
    id: string
    type: BlockType
    content: Record<string, any>
    position: number
    is_visible?: boolean
    page_id: string
}

export interface PageConfig {
    // Theme
    backgroundColor?: string
    secondaryColor?: string // New
    textColor?: string // New
    linkColor?: string // New
    headerBackgroundImage?: string // New

    buttonColor?: string
    buttonTextColor?: string
    buttonStyle?: 'rounded-none' | 'rounded-md' | 'rounded-full'
    buttonVariant?: 'fill' | 'outline' | 'soft-shadow'
    fontFamily?: string
    [key: string]: any
}

export interface Theme {
    id: string
    name: string
    config: PageConfig
    user_id: string
    created_at: string
}

export type Page = {
    id: string
    created_at: string
    project_id: string
    title: string
    slug: string
    config?: PageConfig
    blocks?: Block[]
}

export type Project = {
    id: string
    created_at: string
    user_id: string
    name: string
}
