"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { signIn } from "next-auth/react";

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
        const code = otp;
        
      const res = await axios.post("/api/auth/verify", {
        email,
        code,
      });
console.log(res.data);

      if (res.status === 200) { 
        setMessage("OTP verified! Logging in...");

        // Automatically sign in the user
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password: res.data.password, // Use only if you send it back safely, else ask user to enter it
        });
        console.log("res data", res.data);
        
        if (loginRes?.ok) {
          router.push(`/dashboard`);
        } else {
          setMessage("Verification succeeded but login failed.");
        }
      } else {
        setMessage(res.data.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while verifying.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleVerify} className="bg-white p-6 rounded shadow-md w-full max-w-sm text-black">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>

        <label htmlFor="otp" className="block text-sm font-medium mb-2 text-black">
          Enter the OTP sent to your email
        </label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-black"
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
