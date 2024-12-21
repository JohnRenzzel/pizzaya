"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  async function handleFormSubmit(ev) {
    ev.preventDefault();
    setCreatingUser(true);
    setError(false);
    setErrorMessage("");
    setUserCreated(false);
    setIsGoogleAuth(false);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();

        if (response.ok) {
          resolve();
          setUserCreated(true);
        } else {
          reject(data.error || "Error creating account");
          setError(true);
          setErrorMessage(data.error || "Error creating account");
        }
      } catch (err) {
        reject("Error creating account");
        setError(true);
        setErrorMessage("Error creating account");
      }
      setCreatingUser(false);
    });

    await toast.promise(promise, {
      loading: "Creating your account...",
      success: "Account created successfully!",
      error: (err) => err.toString(),
    });
  }

  async function handleGoogleRegistration() {
    try {
      setIsGoogleAuth(true);
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError(true);
      setErrorMessage("Error registering with Google");
      toast.error("Failed to register with Google");
      setIsGoogleAuth(false);
    }
  }

  return (
    <section className="mt-8">
      <h1 className="text-center text-primary text-4xl mb-4">Register</h1>
      {userCreated && !isGoogleAuth && (
        <div className="my-4 text-center bg-green-50 p-4 rounded-lg border border-green-200 max-w-xs mx-auto">
          <div className="text-green-700 font-semibold mb-2">
            Account created successfully!
          </div>
          <Link
            className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium"
            href={"/login"}
          >
            Continue to login
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      )}
      {error && (
        <div className="my-4 text-center p-4 bg-red-100 border border-red-400 text-red-700">
          <strong>Error:</strong> {errorMessage || "An error has occurred."}
        </div>
      )}
      <form className="block max-w-xs mx-auto" onSubmit={handleFormSubmit}>
        <input
          type="email"
          placeholder="email"
          value={email}
          disabled={creatingUser}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          disabled={creatingUser}
          onChange={(ev) => setPassword(ev.target.value)}
        />
        <button type="submit" disabled={creatingUser}>
          Register
        </button>
        <div className="my-4 text-center text-gray-500">
          or register with provider
        </div>
        <button
          type="button"
          onClick={handleGoogleRegistration}
          className="flex gap-4 justify-center"
        >
          <Image src={"/google.png"} alt={""} width={24} height={24} />
          Register with Google
        </button>
        <div className="text-center my-4 text-gray-500 border-t pt-4">
          Existing account?{" "}
          <Link className="underline" href={"/login"}>
            Login here &raquo;
          </Link>
        </div>
      </form>
    </section>
  );
}
