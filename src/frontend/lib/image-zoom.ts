export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 0.5;
export const PAN_STEP = 40;

/** `x` and `y` are how far the image's center moved from the center of the viewport. */
export type ZoomState = { zoom: number; x: number; y: number };
export type Size = { width: number; height: number };

export const INITIAL_ZOOM: ZoomState = { zoom: MIN_ZOOM, x: 0, y: 0 };

/** Keeps the viewport covered by the image: at most half of what the zoom added on each side. */
function limitPan(offset: number, zoom: number, side: number) {
  const limit = ((zoom - 1) * side) / 2;
  return limit === 0 ? 0 : Math.min(Math.max(offset, -limit), limit);
}

function withinViewport(zoom: number, x: number, y: number, viewport: Size): ZoomState {
  return {
    zoom,
    x: limitPan(x, zoom, viewport.width),
    y: limitPan(y, zoom, viewport.height),
  };
}

/** `focus`, measured from the viewport's center, is the point that stays in place. */
export function zoomTo(
  state: ZoomState,
  zoom: number,
  viewport: Size,
  focus: { x: number; y: number } = { x: 0, y: 0 },
): ZoomState {
  const next = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
  const ratio = next / state.zoom;
  return withinViewport(
    next,
    focus.x - (focus.x - state.x) * ratio,
    focus.y - (focus.y - state.y) * ratio,
    viewport,
  );
}

export function panBy(state: ZoomState, dx: number, dy: number, viewport: Size): ZoomState {
  return withinViewport(state.zoom, state.x + dx, state.y + dy, viewport);
}
