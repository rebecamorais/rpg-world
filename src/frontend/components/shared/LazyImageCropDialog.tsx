import dynamic from 'next/dynamic';

// react-easy-crop is only needed once an image is picked: kept out of the page's first load
export const LazyImageCropDialog = dynamic(
  () => import('@frontend/components/shared/ImageCropDialog').then((m) => m.ImageCropDialog),
  { ssr: false },
);
