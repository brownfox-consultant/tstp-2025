import { useState, useEffect, useCallback } from "react";

const getFullscreenElement = () => {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
};

const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const goFullScreen = useCallback(async () => {
    const element = document.documentElement;

    try {
      // Already fullscreen
      if (getFullscreenElement()) {
        setIsFullScreen(true);
        return true;
      }

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        console.warn("Fullscreen API is not supported");
        return false;
      }

      // Do not blindly set true before Safari confirms fullscreen.
      // Check actual fullscreen state after request.
      const fullscreenActive = !!getFullscreenElement();

      setIsFullScreen(fullscreenActive);

      return fullscreenActive;
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
      setIsFullScreen(false);
      return false;
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (!getFullscreenElement()) {
        setIsFullScreen(false);
        return true;
      }

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      setIsFullScreen(false);

      return true;
    } catch (error) {
      console.error("Failed to exit fullscreen:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenActive = !!getFullscreenElement();

      console.log(
        "Fullscreen state changed:",
        fullscreenActive
      );

      setIsFullScreen(fullscreenActive);

      if (fullscreenActive) {
        document.body.classList.add("fullscreen-mode");
      } else {
        document.body.classList.remove("fullscreen-mode");
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    // Safari / iPad compatibility
    document.addEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener(
      "mozfullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener(
      "MSFullscreenChange",
      handleFullscreenChange
    );

    // Initial state
    handleFullscreenChange();

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );

      document.body.classList.remove("fullscreen-mode");
    };
  }, []);

  return {
    isFullScreen,
    goFullScreen,
    exitFullScreen,
  };
};

export default useFullScreen;