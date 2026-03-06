import { ThemeConfig } from '@/types/database'

interface SeparatorBlockProps {
    config: ThemeConfig
}

export function SeparatorBlock({ config }: SeparatorBlockProps) {
    return (
        <hr className="pico-separator" />
    )
}
