import { LoadingState } from '@frontend/components/shared/LoadingState';

/**
 * Shown in the content area (the sidebar stays) while a dashboard page loads. Without a loading
 * boundary Next.js doesn't prefetch dynamic routes, so every link here would wait for the server
 * with no feedback.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <LoadingState thematic fullScreen={false} />
    </div>
  );
}
