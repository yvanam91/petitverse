import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode
    containerClassName?: string
}

export function Section({ children, className, containerClassName, ...props }: SectionProps) {
    return (
        <section className={cn("py-24 sm:py-32", className)} {...props}>
            <div className={cn("mx-auto max-w-7xl px-6 lg:px-8", containerClassName)}>
                {children}
            </div>
        </section>
    )
}
