import { cn } from "@/lib/utils"

export function Badge({ 
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-500 text-[0.8rem] w-fit",
        className
      )}
      {...props}
    />
  );
}
