"use client";
import { CartContext } from "@/components/AppContext";
import Bars2 from "@/components/icons/Bars2";
import Cart from "@/components/icons/Cart";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useContext, useState } from "react";
import { useBranch } from "@/components/BranchContext";
import { usePathname } from "next/navigation";

function AuthLinks({ status, userName, isHomePage }) {
  if (status === "authenticated") {
    return (
      <>
        {!isHomePage && (
          <Link href={"/profile"} className="whitespace-nowrap">
            Hello, {userName}
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-primary rounded-full text-white px-8 py-2"
        >
          Logout
        </button>
      </>
    );
  }
  if (status === "unauthenticated") {
    return (
      <>
        <Link href={"/login"}>Login</Link>
        <Link
          href={"/register"}
          className="bg-primary rounded-full text-white px-8 py-2"
        >
          Register
        </Link>
      </>
    );
  }
}

export default function Header() {
  const session = useSession();
  const status = session?.status;
  const userData = session.data?.user;
  let userName = userData?.name || userData?.email;
  const { cartProducts } = useContext(CartContext);
  const { selectedBranch } = useBranch();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Calculate branch-specific cart count
  const branchCartCount = cartProducts?.filter(
    (product) => product.branchId === selectedBranch?._id
  ).length;

  if (userName && userName.includes(" ")) {
    userName = userName.split(" ")[0];
  }

  const isHomePage = pathname === "/";

  // Only show cart if we have a selected branch and not on homepage
  const showCart = selectedBranch && !isHomePage;

  const navigationLinks = !isHomePage && (
    <>
      <Link href={selectedBranch ? `/${selectedBranch._id}` : "/"}>Home</Link>
      {selectedBranch && (
        <>
          <Link href={"/menu"}>Menu</Link>
          <Link href={`/${selectedBranch._id}/#about`}>About</Link>
          <Link href={`/${selectedBranch._id}/#contact`}>Contact</Link>
        </>
      )}
    </>
  );

  return (
    <header>
      <div className="flex items-center md:hidden justify-between">
        <Link className="text-primary font-semibold text-2xl" href={"/"}>
          PIZZAYA
        </Link>
        <div className="flex gap-8 items-center">
          {showCart && (
            <Link href={"/cart"} className="relative">
              <Cart />
              {branchCartCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-primary text-white text-xs py-1 px-1 rounded-full leading-3">
                  {branchCartCount}
                </span>
              )}
            </Link>
          )}
          <button
            className="p-1 border"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <Bars2 />
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden p-4 bg-gray-200 rounded-lg mt-2 flex flex-col gap-2 text-center"
        >
          {navigationLinks}
          <AuthLinks
            status={status}
            userName={userName}
            isHomePage={isHomePage}
          />
        </div>
      )}
      <div className="hidden md:flex items-center justify-between">
        <nav className="flex items-center gap-8 text-gray-500 font-semibold">
          <Link className="text-primary font-semibold text-2xl" href={"/"}>
            PIZZAYA
          </Link>
          {navigationLinks}
        </nav>
        <nav className="flex items-center gap-4 text-gray-500 font-semibold">
          <AuthLinks
            status={status}
            userName={userName}
            isHomePage={isHomePage}
          />
          {showCart && (
            <Link href={"/cart"} className="relative">
              <Cart />
              {branchCartCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-primary text-white text-xs py-1 px-1 rounded-full leading-3">
                  {branchCartCount}
                </span>
              )}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
