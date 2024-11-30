"use client";
import { useBranch } from "../components/BranchContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SectionHeaders from "@/components/layout/SectionHeaders";
import Spinner from "@/components/layout/Spinner";
import useProfile from "@/components/UseProfile";

export default function BranchSelectionPage() {
  const { branches, loading } = useBranch();
  const { loading: profileLoading, data: profile } = useProfile();
  const router = useRouter();

  function handleBranchSelect(branchId) {
    if (profile?.isStaff || profile?.isAdmin) {
      if (profile.branchId === branchId) {
        router.push(`/${branchId}`);
      } else {
        alert("You are not authorized to access this branch");
        return;
      }
    } else {
      router.push(`/${branchId}`);
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }
  const displayBranches = branches?.filter((branch) => {
    if (profile?.isStaff || profile?.isAdmin) {
      return branch._id === profile.branchId;
    }
    return true;
  });

  return (
    <div className="min-h-screen mt-8">
      <section className="px-6">
        <div className="text-center mb-12 space-y-8">
          <SectionHeaders
            subHeader={
              <span className="font-medium text-lg text-primary">
                Experience Pizza Excellence
              </span>
            }
            mainHeader={
              <span className="text-gray-900 text-4xl md:text-5xl">
                Find Your Local Branch
              </span>
            }
          />
          <p className="text-gray-600 mt-8 max-w-2xl mx-auto leading-relaxed text-lg">
            Discover our artisanal pizzas at a location near you. Each branch
            offers a
            <span className="font-medium text-gray-800 px-1">
              unique dining experience
            </span>
            with the same commitment to quality.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div
            className={`grid gap-10 ${
              displayBranches?.length === 1
                ? "place-items-center"
                : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {displayBranches?.map((branch) => (
              <div
                key={branch._id}
                onClick={() => handleBranchSelect(branch._id)}
                className="group bg-white shadow-lg hover:shadow-2xl p-6 rounded-[2rem] cursor-pointer 
                          transition-all duration-500 w-full max-w-sm transform hover:-translate-y-2
                          border border-gray-200"
              >
                <div className="relative w-full h-64 mb-6 overflow-hidden rounded-[1.5rem]">
                  <Image
                    src={branch.image || "/default-branch.jpg"}
                    alt={branch.name}
                    fill
                    style={{ objectFit: "cover" }}
                    className="transform transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-bold text-2xl mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                  {branch.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-700">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-base">{branch.location}</p>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <p className="text-base">{branch.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
