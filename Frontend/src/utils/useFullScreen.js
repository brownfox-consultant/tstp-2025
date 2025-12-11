import { useState, useEffect } from "react";

const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const goFullScreen = () => {
    const element = document.documentElement;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      /* Firefox */
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      /* IE/Edge */
      element.msRequestFullscreen();
    }

    setIsFullScreen(true);
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }

    setIsFullScreen(false);
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (!!document.fullscreenElement) {
        // Add a class to handle footer position when in fullscreen mode
        document.body.classList.add("fullscreen-mode");
      } else {
        // Remove the class when exiting fullscreen mode
        document.body.classList.remove("fullscreen-mode");
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  return { isFullScreen, goFullScreen, exitFullScreen };
};

export default useFullScreen;
