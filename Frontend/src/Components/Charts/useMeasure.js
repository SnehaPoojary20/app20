import { useLayoutEffect, useRef, useState } from "react";

/** Returns [ref, width] — width follows the element's size. */
export function useMeasure(initial = 800) {
  const ref = useRef(null);
  const [width, setWidth] = useState(initial);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(280, Math.floor(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}
