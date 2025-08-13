
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function RecipePagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      router.push(createPageURL(currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      router.push(createPageURL(currentPage + 1));
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Page précédente</span>
      </Button>
      <span className="text-sm font-medium">
        Page {currentPage} sur {totalPages}
      </span>
      <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Page suivante</span>
      </Button>
    </div>
  );
}
