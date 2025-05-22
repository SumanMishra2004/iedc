"use client"; // if you're using Next.js App Router, enable client component

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const result = await signIn("credentials", {
      redirect: false, // prevent automatic redirect
      email,
      password,
    });

    if (result?.error) {
      setErrorMsg("Invalid email or password");
    } else if (result?.ok) {
      // Successful sign-in, redirect or show something
      window.location.href = "/dashboard"; // or use router.push
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Sign In</h2>

      <label htmlFor="email" className="block mb-1">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full mb-4 px-3 py-2 border rounded"
      />

      <label htmlFor="password" className="block mb-1">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full mb-4 px-3 py-2 border rounded"
      />

      {errorMsg && (
        <p className="mb-4 text-red-600 font-medium">{errorMsg}</p>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sign In
      </button>
    </form>
  );
}
