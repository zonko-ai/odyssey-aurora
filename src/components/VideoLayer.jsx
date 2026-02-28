import { useRef, useEffect, useState } from 'react';

export default function VideoLayer({ videoRef, frozenFrame, isTransitioning, anchorImageUrl }) {
  const canvasRef = useRef(null);
  const [videoLive, setVideoLive] = useState(false);

  // Draw the frozen frame onto the local canvas whenever it changes
  useEffect(() => {
    if (!frozenFrame || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = frozenFrame.width;
    canvas.height = frozenFrame.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(frozenFrame, 0, 0, canvas.width, canvas.height);
  }, [frozenFrame]);

  // Detect when video stream goes live (has frames)
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    function onPlaying() {
      // Once the video has real frames, crossfade from anchor image
      if (video.videoWidth > 0) setVideoLive(true);
    }

    video.addEventListener('playing', onPlaying);
    return () => video.removeEventListener('playing', onPlaying);
  }, [videoRef]);

  // Reset videoLive when anchor image changes (new scene loading)
  useEffect(() => {
    if (anchorImageUrl) setVideoLive(false);
  }, [anchorImageUrl]);

  return (
    <div className="absolute inset-0">
      {/* Anchor image background — shown while stream loads */}
      {anchorImageUrl && (
        <img
          src={anchorImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: videoLive ? 0 : 1 }}
        />
      )}

      {/* Frozen frame for transitions */}
      {frozenFrame && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: isTransitioning ? 1 : 0 }}
        />
      )}

      {/* Live video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: videoLive ? 1 : 0 }}
      />

      {/* Cinematic overlays */}
      <div className="absolute inset-0 scanlines" />
      <div className="absolute inset-0 vignette" />
    </div>
  );
}
