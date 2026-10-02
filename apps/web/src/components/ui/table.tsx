import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SortDirection = 'asc' | 'desc';

/** Band-header table. Scrolls with the page sheet, so the header sticks to its top. */
export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-body', className)} {...rest} />;
}

export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('h-[2.8125rem] border-b border-edge transition-colors hover:bg-subtle', className)}
      {...rest}
    />
  );
}

type Align = 'start' | 'end';

const ALIGN: Record<Align, string> = { start: 'text-start', end: 'text-end' };

export interface ThProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: Align;
  /** Current sort of this column, or undefined when the column is not sortable. */
  sort?: SortDirection | 'none';
  onSort?: () => void;
}

export function Th({ align = 'start', sort, onSort, className, children, ...rest }: ThProps) {
  const ariaSort = sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : undefined;
  const Icon = sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        'sticky top-0 z-10 h-[1.875rem] bg-subtle px-5 text-label font-normal text-fg',
        ALIGN[align],
        className,
      )}
      {...rest}
    >
      {sort !== undefined ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            'group -mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:bg-hover',
            align === 'end' && 'flex-row-reverse',
          )}
        >
          {children}
          <Icon
            aria-hidden
            className={cn(
              'size-3 text-fg-tertiary transition-opacity',
              sort === 'none' && 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
            )}
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export interface TdProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: Align;
  children?: ReactNode;
}

export function Td({ align = 'start', className, ...rest }: TdProps) {
  return <td className={cn('px-5 align-middle', ALIGN[align], className)} {...rest} />;
}
