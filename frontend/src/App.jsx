//import { useState } from 'react'
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import ThemeProvider from "./context/ThemeContext";
import AuthProvider from "./auth/AuthProvider";
import Navbar from "./components/Navbar";
import Register from "./auth/Register";
import Login from "./auth/Login";
import ArtistDashboard from "./pages/ArtistDashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import UploadSong from "./pages/UploadSong";
import SongDetails from "./pages/SongDetails";
import ListenerHome from "./pages/ListenerHome";
import Events from "./pages/Events";
import Summary from "./pages/Summary";

function App() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
              <Navbar />
              <Routes>
                <Route
                  path="/"
                  element={
                    <main className="max-w-4xl mx-auto px-6 py-20 text-center">
                      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-4">
                        Music for every moment
                      </p>
                      <h2 className="text-4xl font-bold mb-5">
                        Discover music made by independent artists.
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                        Join as a member to explore the catalogue and listen to
                        every track. Artists can upload and manage their own
                        music.
                      </p>
                      <div className="flex justify-center gap-4">
                        <Link
                          to="/login"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                        >
                          Log in to listen
                        </Link>
                        <Link
                          to="/register"
                          className="border border-blue-600 text-blue-600 dark:text-blue-300 px-5 py-2 rounded"
                        >
                          Create an account
                        </Link>
                      </div>
                    </main>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/songs"
                  element={
                    <ProtectedRoute role="listener">
                      <ListenerHome />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/song/:id"
                  element={
                    <ProtectedRoute>
                      <SongDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/events"
                  element={
                    <ProtectedRoute role="listener">
                      <Events />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artist/events"
                  element={
                    <ProtectedRoute role="artist">
                      <Events />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/artist/dashboard"
                  element={
                    <ProtectedRoute role="artist">
                      <ArtistDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artist/upload"
                  element={
                    <ProtectedRoute role="artist">
                      <UploadSong />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/artist/summary"
                  element={
                    <ProtectedRoute role="artist">
                      <Summary />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
