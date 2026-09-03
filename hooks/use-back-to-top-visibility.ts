"use client";

import { useEffect, useState } from "react";

/**
 * Returns whether the "Back to Top" button should be visible.
 *
 * Rules:
 * - Hidden when the user is within `showAfterPx` px of the top (default 300).
 * - Hidden when the footer is visible in the viewport (the user is near the bottom).
 * - Animates smoothly via a CSS transition on the consumer side.
 */
export function useBackToTopVisibility(showAfterPx = 300): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(
      "[data-store-chrome=\"footer\"]",
    );

    function evaluate() {
      const scrollY = window.scrollY;

      // Below the threshold?
      const belowThreshold = scrollY > showAfterPx;

      setVisible(belowThreshold);
    }

    evaluate();
    window.addEventListener("scroll", evaluate, { passive: true });
    window.addEventListener("resize", evaluate, { passive: true });

    return () => {
      window.removeEventListener("scroll", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, [showAfterPx]);

  return visible;
}

/**
 * Returns whether the footer is currently visible in the viewport.
 */
export function useFooterVisibility(): boolean {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(
      "[data-store-chrome=\"footer\"]",
    );

    function evaluate() {
      if (!footer) {
        setFooterVisible(false);
        return;
      }
      const rect = footer.getBoundingClientRect();
      // Footer is "visible" when its top edge enters the viewport
      setFooterVisible(rect.top < window.innerHeight);
    }

    evaluate();
    window.addEventListener("scroll", evaluate, { passive: true });
    window.addEventListener("resize", evaluate, { passive: true });

    return () => {
      window.removeEventListener("scroll", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  return footerVisible;
}
