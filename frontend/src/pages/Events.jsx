import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import EventImport from "../components/EventImport";

const singaporeToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function Events() {
  const { user, secureFetch } = useAuth();
  const isArtist = user?.role === "artist";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [success, setSuccess] = useState("");
  const [revision, setRevision] = useState(0);
  const today = singaporeToday();

  useEffect(() => {
    setLoading(true);
    setListError("");

    const load = async () => {
      try {
        const response = await secureFetch(
          `http://localhost:3000/api/events${isArtist ? "/artist-events" : ""}`,
          { method: "GET" },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load events.");
        setEvents(data.events || []);
      } catch (err) {
        setListError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [secureFetch, isArtist, revision]);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await secureFetch("http://localhost:3000/api/events", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to create event.");

      form.reset();
      setSuccess("Event created.");
      setRevision((value) => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full p-2 border rounded bg-gray-50 dark:bg-gray-700";
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">
        {isArtist ? "My events" : "Upcoming events"}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {isArtist
          ? "Create an event and share its poster with your listeners."
          : "Discover live music happening today and beyond."}{" "}
      </p>
      {isArtist && (
        <EventImport onImported={() => setRevision((value) => value + 1)} />
      )}
      {isArtist && (
        <form
          onSubmit={submit}
          className="p-5 mb-8 rounded bg-gray-100 dark:bg-gray-800 space-y-4"
        >
          <h3 className="text-xl font-semibold">Create an event</h3>
          {error && (
            <p role="alert" className="text-red-500">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-green-600">
              {success}
            </p>
          )}
          <fieldset disabled={saving} className="space-y-4">
            <label className="block">
              Event title
              <input
                name="title"
                required
                maxLength={150}
                className={inputClass}
              />
            </label>
            <label className="block">
              Venue
              <input
                name="venue"
                required
                maxLength={255}
                className={inputClass}
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                Event date
                <input
                  type="date"
                  name="event_date"
                  required
                  min={today}
                  className={inputClass}
                />
              </label>
              <label className="block">
                Ticket price (PHP)
                <input
                  type="number"
                  name="ticket_price"
                  required
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  defaultValue="0"
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block">
              Description
              <textarea
                name="description"
                maxLength={5000}
                rows={3}
                className={inputClass}
              />
            </label>
            <label className="block">
              Poster (JPEG, PNG or WebP; max 5 MB)
              <input
                type="file"
                name="poster"
                accept="image/jpeg,image/png,image/webp"
                required
                className="block mt-2 w-full"
              />
            </label>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
              type="submit"
            >
              {saving ? "Creating event..." : "Create event"}
            </button>
          </fieldset>
        </form>
      )}
      
      
      {loading ? (
        <p>Loading events...</p>
      ) : listError ? (
        <div role="alert">
          <p className="text-red-500">{listError}</p>
          <button
            onClick={() => setRevision((value) => value + 1)}
            className="underline mt-2"
          >
            Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <p>
          {isArtist
            ? "You haven't created any events yet."
            : "There are no upcoming events yet. Check back soon."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded shadow bg-gray-100 dark:bg-gray-800 overflow-hidden"
            >
              {event.poster_url ? (
                <img
                  src={`http://localhost:3000${event.poster_url}`}
                  alt={`Poster for ${event.title}`}
                  className="w-full h-72 object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No poster provided
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="text-xl font-semibold">{event.title}</h3>
                <p>By {event.artist_name}</p>
                <p>
                  <time dateTime={event.event_date}>
                    {new Date(
                      `${event.event_date}T00:00:00+08:00`,
                    ).toLocaleDateString("en-SG", {
                      timeZone: "Asia/Singapore",
                      dateStyle: "long",
                    })}
                  </time>
                  {event.event_date < today && " · Past event"}
                </p>
                <p>{event.venue}</p>
                <p>
                  {Number(event.ticket_price) === 0
                    ? "Free admission"
                    : new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(Number(event.ticket_price))}
                </p>
                <p className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
