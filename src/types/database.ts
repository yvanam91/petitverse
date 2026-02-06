export type Profile = {
    id: string
    created_at: string
    email: string
}

export type BlockType = 'text' | 'image' | 'video' | 'button' | 'hero' | 'link' | 'file'

export interface Block {
    id: string
    type: BlockType
    content: Record<string, any>
    position: number
    page_id: string
}

export interface PageConfig {
    // Theme
    backgroundColor?: string
    buttonColor?: string
    buttonTextColor?: string
    buttonStyle?: 'rounded-none' | 'rounded-md' | 'rounded-full'
    fontFamily?: string
    [key: string]: any
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
