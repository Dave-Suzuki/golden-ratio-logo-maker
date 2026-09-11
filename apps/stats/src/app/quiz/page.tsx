import { Suspense } from 'react';
import { QuizPage } from '@/components/QuizPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <QuizPage />
    </Suspense>
  );
}
