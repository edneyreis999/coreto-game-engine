/**
 * Sword Icon Component
 *
 * SVG sword icon for TTK Validation portal.
 * Used in PortalButton and other combat-related UI elements.
 *
 * @see Task 03 - TTK Sword Icon Component
 */

import type { SVGProps } from 'react';

export interface SwordIconProps extends SVGProps<SVGSVGElement> {
  /**
   * Optional CSS class name for styling.
   */
  className?: string;
}

/**
 * Sword icon component representing combat/TTK validation.
 *
 * @param props - SVG props passed to the element
 * @returns SVG sword icon element
 */
export function SwordIcon(props: SwordIconProps): React.ReactElement<SwordIconProps> {
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
      {/* Sword blade */}
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      {/* Sword edge highlight */}
      <path d="M13 19l6-6" />
      {/* Sword guard */}
      <path d="M16 16l4 4" />
      {/* Sword handle */}
      <path d="M19 21l2-2" />
    </svg>
  );
}
