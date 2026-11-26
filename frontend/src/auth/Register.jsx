import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "./AuthProvider";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();



  const location = useLocation();
  const [error, setError] = useState("");
  const [message, setMessage] = useState(() => location.state?.message || "");
  const [verificationEmail, setVerificationEmail] = useState(
    () => location.state?.verificationEmail || "",
  );
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    // Teaching: registration starts email verification; it does not log the user in yet.
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Registration failed");
      }

      setVerificationEmail(data.email.trim().toLowerCase());
      setMessage(result.message || "Verification code sent to your email.");
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const verifyOtp = async (event) => {
    // Teaching: prevent the normal HTML form reload and verify the one-time code with Flask.
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "http://localhost:3000/api/auth/verify-registration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: verificationEmail, otp }),
        },
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Verification failed");
      }

      const token = result.token;
      if (!token || typeof token !== "string") {
        throw new Error("Invalid or missing token from server.");
      }

      login(token);


      const decoded = JSON.parse(atob(token.split(".")[1]));

      if (decoded.role === "artist") {
        navigate("/artist/dashboard");
      } else {
        navigate("/songs");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  if (verificationEmail) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 shadow-md rounded">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Verify your email
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Enter the six-digit code sent to {verificationEmail}.
        </p>
        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={verifyOtp} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded"
          >
            Verify and create account
          </button>
          <button
            type="button"
            onClick={() => {
              setVerificationEmail("");
              setOtp("");
              setError("");
              setMessage("");
            }}
            className="w-full text-sm text-blue-600 hover:underline"
          >
            Use a different email
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Role</label>
          <select
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
            {...register("role", { required: "Role is required" })}
          >
            <option value="artist">Artist</option>
            <option value="listener">Listener</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm">{errors.role.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded"
        >
          Register
        </button>
      </form>
    </div>
  );
}