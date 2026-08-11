'use client';

import { useEffect } from 'react';
import { useStudio } from '@/lib/store';
import { BriefChips } from './BriefChips';
import { CandidateGrid } from './CandidateGrid';
import { DescribeBox } from './DescribeBox';
import { EditorPanel } from './EditorPanel';
import { LockupEditor } from './LockupEditor';
import { PalettePanel } from './PalettePanel';

export function Studio() {
  const { selected, brief } = useStudio();

  useEffect(() => {
    const saved = window.localStorage.getItem('kiwari-tier');
    if (saved === 'paid') useStudio.getState().setTier('paid');
  }, []);

  return (
    <>
      <DescribeBox />
      <BriefChips />
      <CandidateGrid />
      {selected !== null && (
        <>
          <EditorPanel />
          <LockupEditor />
          {brief && <PalettePanel />}
        </>
      )}
    </>
  );
}
