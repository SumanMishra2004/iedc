"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/auth/verify", {
        email,
        code: otp,
      });

      if (res.status === 200) {
        setMessage("OTP verified successfully! Redirecting to sign-in...");
        setTimeout(() => {
          router.push("/login"); // Or wherever your sign-in page is
        }, 1500);
      } else {
        setMessage(res.data.message || "Verification failed.");
      }
    } catch (err: any) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Something went wrong while verifying."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleVerify}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm text-black"
      >
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>

        <label htmlFor="otp" className="block text-sm font-medium mb-2">
          Enter the OTP sent to your email
        </label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          placeholder="123456"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        {message && (
          <p className="text-sm text-center text-red-500 mt-4">{message}</p>
        )}
      </form>
    </div>
  );
}
