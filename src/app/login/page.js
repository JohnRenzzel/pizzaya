"use client";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import Spinner from "@/components/layout/Spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();

  async function handleFormSubmit(ev) {
    ev.preventDefault();
    setError("");
    setLoginInProgress(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials. Please check your email and password.");
    } else {
      window.location.href = "/";
    }
    setLoginInProgress(false);
  }

  if (status === "loading") {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  if (session) {
    window.location.href = "/";
    return null;
  }

  return (
    <section className="mt-8">
      <h1 className="text-center text-primary text-4xl mb-4">Login</h1>
      <form className="max-w-xs mx-auto" onSubmit={handleFormSubmit}>
        {error && (
          <div className="text-center w-full text-red-500 mb-4">{error}</div>
        )}
        <input
          type="email"
          name="email"
          placeholder="email"
          value={email}
          disabled={loginInProgress}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="password"
          value={password}
          disabled={loginInProgress}
          onChange={(ev) => setPassword(ev.target.value)}
        />
        <button disabled={loginInProgress} type="submit">
          Login
        </button>
        <div className="my-4 text-center text-gray-500">
          or login with provider
        </div>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex gap-4 justify-center"
        >
          <Image src={"/google.png"} alt={""} width={24} height={24} />
          Login with google
        </button>
      </form>
    </section>
  );
}
