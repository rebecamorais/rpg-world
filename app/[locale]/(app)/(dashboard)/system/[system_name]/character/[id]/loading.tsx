import { LoadingState } from '@frontend/components/shared/LoadingState';

export default function CharacterLoading() {
  return (
    <div className="flex h-[calc(100vh-120px)] items-center justify-center p-4">
      <LoadingState thematic fullScreen={false} />
    </div>
  );
}
