import { useEffect } from "react";

/**
 * @function useOnClickOutside
 * @description Handles the click outside logic and returns the `onOutsideClick` callback to handle the logic after the component is unmounted
 */
export const useOnClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  onOutsideClick: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const touchListener = <U extends MouseEvent | TouchEvent>(event: U) => {
      if (!ref.current || ref.current.contains(event?.target as Node)) {
        // if clicked element is inside the ref element, do nothing
        return;
      }
      onOutsideClick(event);
    };

    document.addEventListener("mousedown", touchListener); // for desktop
    document.addEventListener("touchstart", touchListener); // for mobile

    return () => {
      document.removeEventListener("mousedown", touchListener);
      document.removeEventListener("touchstart", touchListener);
    };
  }, [ref, onOutsideClick]);
};
