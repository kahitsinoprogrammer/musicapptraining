import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAuth } from "../auth/AuthProvider";

export default function WaveformPlayer({ src, title, songID }) {
  const { token, user, secureFetch } = useAuth();
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasCountedPlay, setHasCountedPlay] = useState(false);

  const incrementPlayCount = async () => {
    try {
      await secureFetch(`http://localhost:3000/api/songs/${songID}/play`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to increment play count:", err.message);
    }
  };

  useEffect(() => {
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#a0aec0", // light gray
      progressColor: "#2563EB", // blue-600
      height: 80,
      responsive: true,
      normalize: true,
      fetchParams: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    wavesurferRef.current.load(`http://localhost:3000${src}`);
    wavesurferRef.current.on("ready", () => {
      setDuration(wavesurferRef.current.getDuration());
    });

    wavesurferRef.current.on("audioprocess", () => {
      setCurrentTime(wavesurferRef.current.getCurrentTime());
    });

    wavesurferRef.current.on("finish", () => {
      setIsPlaying(false);
    });

    return () => wavesurferRef.current.destroy();
  }, [src, token]);

  const togglePlay = async () => {
    if (wavesurferRef.current) {
      try {
        await wavesurferRef.current.playPause();
      } catch (err) {
        console.error("Unable to start playback:", err.message);
        return;
      }
      setIsPlaying(!isPlaying);

      if (user?.role === "listener" && !hasCountedPlay && !isPlaying) {
        incrementPlayCount();
        setHasCountedPlay(true);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60) || 0;
    const seconds = Math.floor(time % 60) || 0;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded shadow-md">
      <p className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">
        {title || "Now Playing"}
      </p>

      <div ref={waveformRef} className="mb-3" />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <span className="text-xs text-gray-700 dark:text-gray-300">
          {formatTime(currentTime)}
        </span>

        <span className="text-xs text-gray-700 dark:text-gray-300 ml-auto">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
