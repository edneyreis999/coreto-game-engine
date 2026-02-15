/**
 * Document Icon Component
 *
 * SVG document icon for NSD Generator portal.
 * Used in PortalButton and other documentation-related UI elements.
 *
 * @see Task 04 - NSD Document Icon Component
 */

import type { SVGProps } from 'react';

export interface DocumentIconProps extends SVGProps<SVGSVGElement> {
  /**
   * Optional CSS class name for styling.
   */
  className?: string;
}

/**
 * Document icon component representing NSD documentation.
 *
 * @param props - SVG props passed to the element
 * @returns SVG document icon element
 */
export function DocumentIcon(props: DocumentIconProps): React.ReactElement<DocumentIconProps> {
  const { className = '', ...rest } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* Document body - main rectangular shape */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

      {/* Folded corner - classic document page curl */}
      <polyline points="14 2 14 8 20 8" />

      {/* Content lines - representing text/document content */}
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
