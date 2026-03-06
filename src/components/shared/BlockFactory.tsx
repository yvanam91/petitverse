import React from 'react'
import { Block, ThemeConfig } from '@/types/database'
import { HeaderBlock } from './blocks/HeaderBlock'
import { SocialGridBlock } from './blocks/SocialGridBlock'
import { LinkBlock } from './blocks/LinkBlock'
import { DoubleLinkBlock } from './blocks/DoubleLinkBlock'
import { EmbedBlock } from './blocks/EmbedBlock'
import { TitleBlock } from './blocks/TitleBlock'
import { TextBlock } from './blocks/TextBlock'
import { SeparatorBlock } from './blocks/SeparatorBlock'
import { HeroBlock } from './blocks/HeroBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { FileBlock } from './blocks/FileBlock'

interface BlockFactoryProps {
    block: Block
    config: ThemeConfig
}

export function BlockFactory({ block, config }: BlockFactoryProps) {
    if (block.is_visible === false) return null

    // Support rendering for different block types
    switch (block.type) {
        case 'header':
            return <HeaderBlock content={block.content as any} config={config} />

        case 'social_grid':
            return <SocialGridBlock content={block.content as any} config={config} />

        case 'separator':
            return <SeparatorBlock config={config} />

        case 'title':
            return <TitleBlock content={block.content as any} config={config} />

        case 'text':
            return <TextBlock content={block.content as any} config={config} />

        case 'double-link':
            return <DoubleLinkBlock content={block.content as any} config={config} />

        case 'hero':
            return <HeroBlock content={block.content as any} config={config} />

        case 'link':
            return <LinkBlock content={block.content as any} config={config} />

        case 'embed':
            return <EmbedBlock content={block.content as any} config={config} />

        case 'file':
            return <FileBlock content={block.content as any} config={config} />

        case 'image':
            return <ImageBlock content={block.content as any} config={config} />

        default:
            console.warn(`Type de bloc inconnu: ${block.type}`)
            return null
    }
}
