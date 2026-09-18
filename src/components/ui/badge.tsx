import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        surface: "bg-[var(--surface)] text-white",
        accent: "bg-[var(--accent)] text-[#1A1209]",
        outline: "border-border text-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        // Estados de cita
        solicitada: "bg-[#9AA6E0]/20 text-[#9AA6E0] border-[#9AA6E0]/40",
        confirmada: "bg-[#E070C4]/20 text-[#E070C4] border-[#E070C4]/40",
        en_curso: "bg-[#B4476E]/30 text-[#FFFFFF] border-[#B4476E]/60",
        completada: "bg-[#3F9D6B]/20 text-[#5eead4] border-[#3F9D6B]/40",
        cancelada: "bg-[#6B6259]/20 text-[#a8a29e] border-[#6B6259]/40",
        inasistencia: "bg-[#C1524F]/20 text-[#fca5a5] border-[#C1524F]/40",
        // Semáforo inventario
        stockOk: "bg-[#3F9D6B]/20 text-[#5eead4] border-[#3F9D6B]/40",
        stockBajo: "bg-[#D97706]/20 text-[#fcd34d] border-[#D97706]/40",
        stockCritico: "bg-[#C1524F]/20 text-[#fca5a5] border-[#C1524F]/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
