import React, { useEffect, useRef, useState } from 'react';

import { copyDataToClipboard } from '../utilities/export/ExportUtil';

/** how long the acknowledgement stays up after a click */
const COPIED_MS = 1800;

/** The address as it reads to a person: no protocol, but never without the path. */
function currentAddress(): string {
  const { host, pathname, search } = window.location;

  return `${host}${pathname === '/' ? '' : pathname}${search}`;
}

/**
 * The live URL, shown in the tour step that explains a ranking is stored in its
 * address - and clicking it does the very thing that step is describing.
 *
 * Read when the step mounts rather than written into the step's copy: joyride
 * builds a step's tooltip fresh each time it's shown, and by then the tour has
 * finished assembling its example ranking, so what's on screen is that
 * ranking's actual address rather than a stand-in for one. The clipboard gets
 * the full link, protocol and all, since that's what's useful pasted somewhere.
 */
const TourUrlLink: React.FC = () => {
  const [address] = useState(currentAddress);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function copy() {
    await copyDataToClipboard(window.location.href);

    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <button
        type="button"
        onClick={copy}
        title="Copy this link"
        className="text-link break-all text-left underline-offset-2 hover:underline"
      >
        {address}
      </button>
      <span
        aria-live="polite"
        className="text-xs font-medium text-[var(--er-accent-success)] transition-opacity duration-200"
        style={{ opacity: copied ? 1 : 0 }}
      >
        {copied ? 'Copied!' : ''}
      </span>
    </span>
  );
};

export default TourUrlLink;
