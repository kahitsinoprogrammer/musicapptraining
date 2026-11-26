import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../auth/AuthProvider";

export default function EventImport({ onImported }) {
  const { secureFetch } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const download = () => {
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["title", "venue", "event_date", "ticket_price", "description"],
    ]);
    sheet["!cols"] = [30, 30, 18, 18, 60].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(book, sheet, "Events");
    const instructions = XLSX.utils.aoa_to_sheet([
      [
        "Fill in the Events sheet starting in row 2. Keep all column headers unchanged.",
      ],
      ["title", "Required, maximum 150 characters"],
      ["venue", "Required, maximum 255 characters"],
      ["event_date", "Required: YYYY-MM-DD, today or later (Singapore time)"],
      ["ticket_price", "PHP; blank or 0 for free; maximum two decimal places"],
      ["description", "Optional, maximum 5000 characters"],
      ["Up to 200 events per upload. Do not leave blank rows between events."],
      [
        "Imported events have no poster. Use Create an event for events with a poster.",
      ],
      ["Each upload creates new events. Do not upload the same events twice."],
    ]);
    instructions["!cols"] = [{ wch: 90 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(book, instructions, "Instructions");
    XLSX.writeFile(book, "events-template.xlsx");
  };

  const upload = async (event) => {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const file = new FormData(form).get("spreadsheet");
    setError("");
    setSuccess("");

    if (!file) {
      setError("Choose an Excel file first.");
      return;
    }

    setBusy(true);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets.Events;
      if (!sheet) throw new Error("Sheet named Events was not found.");

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });
      const events = rows.slice(1).map((row) => ({
        title: String(row[0] || ""),
        venue: String(row[1] || ""),
        event_date: String(row[2] || ""),
        ticket_price: String(row[3] || "0"),
        description: String(row[4] || ""),
      }));

      const response = await secureFetch("/api/events/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error([result.message, ...(result.errors || [])].join("\n"));

      setSuccess(result.message);
      form.reset();
      onImported();
    } catch (err) {
      setError(err.message || "Unable to read this spreadsheet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-5 mb-6 rounded bg-gray-100 dark:bg-gray-800 space-y-4">
      <h3 className="text-xl font-semibold">Import events from Excel</h3>
      <p>
        Download the template, fill in the Events sheet, and upload it below.
        Imported events have no poster.
      </p>
      <button
        type="button"
        onClick={download}
        className="border border-blue-600 rounded px-4 py-2"
      >
        Download Excel template
      </button>
      <form onSubmit={upload} className="space-y-3">
        <label className="block">
          Completed Excel file
          <input
            type="file"
            name="spreadsheet"
            accept=".xlsx"
            required
            disabled={busy}
            className="block mt-2"
          />
        </label>
        <p className="text-sm">
          The server will check each event before saving it.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Importing..." : "Import events"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-red-500 whitespace-pre-wrap">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-green-600">
          {success}
        </p>
      )}
    </section>
  );
}
