import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';

const searchInputClassName =
  'h-11 w-full min-w-0 rounded-[16px] border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 md:h-10';

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, 'className'> & {
  containerClassName?: string;
};

function SearchInput({
  containerClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative min-w-0', containerClassName)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
      />
      <Input {...props} className={searchInputClassName} />
    </div>
  );
}

export { SearchInput };
