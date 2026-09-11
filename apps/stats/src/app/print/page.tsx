import { Suspense } from 'react';
import { PrintPage } from '@/components/PrintPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PrintPage />
    </Suspense>
  );
}
