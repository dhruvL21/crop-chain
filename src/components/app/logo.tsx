import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  iconClassName,
  textClassName,
}: {
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <Leaf className={cn("h-7 w-7 text-primary", iconClassName)} />
      <span className={cn("text-2xl font-semibold", textClassName)}>
        CropChain
      </span>
    </div>
  );
}
