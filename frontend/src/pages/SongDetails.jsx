import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AudioPlayer from "../components/AudioPlayer";
export default function SongDetails() {
    const { secureFetch, user } = useAuth();
    const { id } = useParams();
    const [song, setSong] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    
  useEffect(() => {
    if (!user) return;

    const fetchSong = async () => {
      try {
        const res = await secureFetch(`http://localhost:3000/api/songs/${id}`, {
          method: "GET",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load song");
        setSong(data.song);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [user, id]);


    if (loading) return <p className="p-4">Loading song...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;
    if (!song) return <p className="p-4">Song not found.</p>;

      return (
        <div className="p-4 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">{song.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            by {song.artist_name || "Unknown Artist"} · {song.play_count} plays
          </p>

          {song.thumbnail && (
            <img
              src={`http://localhost:3000${song.thumbnail}`}
              alt={song.title}
              className="mb-6 w-full max-h-64 object-cover rounded"
            />
          )}

          <AudioPlayer
            key={song.id}
            src={song.audio_url}
            title={song.title}
            songID={song.id}
          />
        </div>
      );


}
