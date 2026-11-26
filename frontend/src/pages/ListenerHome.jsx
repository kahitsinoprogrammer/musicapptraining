import React, { useEffect, useState } from "react";
import SongCard from "../components/SongCard";
import { useAuth } from "../auth/AuthProvider";

export default function ListenerHome() {
  const { secureFetch, user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");

    const fetchSongs = async () => {
      try {
        const res = await secureFetch("http://localhost:3000/api/songs/", {
          method: "GET",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch songs");
        setSongs(data.songs || []);
        setFilteredSongs(data.songs || []);
      } catch (err) {
        setError(err.message || "Unable to load songs.");
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [user, retry]);

  useEffect(() => {
    const filtered = songs.filter(
      (song) =>
        (song.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (song.artist_name || "").toLowerCase().includes(search.toLowerCase()),
    );
    setFilteredSongs(filtered);
  }, [search, songs]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🎧 Listen & Discover</h2>

      <input
        type="text"
        placeholder="Search by title or artist..."
        className="w-full p-2 border rounded mb-6 bg-gray-50 dark:bg-gray-700"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading songs...</p>
      ) : error ? (
        <div role="alert">
          <p className="text-red-500">Unable to load songs: {error}</p>
          <button
            onClick={() => setRetry((value) => value + 1)}
            className="mt-2 underline"
          >
            Try again
          </button>
        </div>
      ) : filteredSongs.length === 0 ? (
        <p>No songs found.</p>
      ) : (
        <div className="space-y-4">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}


    </div>
  );
}
