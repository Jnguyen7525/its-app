'use client';

import { load, trackPageview } from 'fathom-client';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

export function TrackPageview() {
  const pathname = usePathname();
  const search = useSearchParams();

  // Load the Fathom script on mount
  useEffect(() => {
    const fathomId = process.env.NEXT_PUBLIC_FATHOM_ID;

    if (!fathomId) {
      return;
    }

    load(fathomId, {
      auto: false,
    });
  }, []);

  // Record a Page View when route changes
  useEffect(() => {
    if (!pathname) {
      return;
    }

    const url: string = search ? `${pathname}?${search.toString()}` : pathname;

    trackPageview({
      url,
      referrer: document.referrer,
    });
  }, [search, pathname]);

  return null;
}

export function FathomAnalytics() {
  return (
    // A Suspense boundary is needed for `useSearchParams()`
    // https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
    <Suspense>
      <TrackPageview />
    </Suspense>
  );
}
