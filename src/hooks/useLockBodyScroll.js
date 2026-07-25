import { useEffect } from "react";

// Locks background scroll while a full-screen modal is mounted. Without this,
// iOS Safari lets the body scroll underneath a `position: fixed` overlay,
// which desyncs the page's scroll position and layout once the modal closes.
// The cleanup always restores the exact previous scroll position, regardless
// of how the modal was closed (X button, backdrop click, back navigation).
function useLockBodyScroll() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);
}

export default useLockBodyScroll;
