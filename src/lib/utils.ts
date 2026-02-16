import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const getBoxShadow = (style: string, color: string, opacity: number) => {
    if (style === 'none') return 'none';
    const rgba = color.startsWith('#')
        ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`
        : color;
    const blur = style === 'soft' ? '4px' : '0px';
    return `4px 4px ${blur} 0px ${rgba}`;
}
