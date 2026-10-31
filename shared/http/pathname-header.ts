/**
 * Request header the proxy sets with the path asked for (path + query). Layouts don't receive the
 * pathname; the dashboard reads this one to send someone back after an onboarding step.
 */
export const PATHNAME_HEADER = 'x-pathname';
