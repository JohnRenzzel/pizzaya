"use client";
import Hero from "@/components/layout/Hero";
import HomeMenu from "@/components/layout/HomeMenu";
import SectionHeaders from "@/components/layout/SectionHeaders";
import { motion } from "framer-motion";
import { useBranch } from "@/components/BranchContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "@/components/layout/Spinner";

export default function BranchHome() {
  const { branches, selectedBranch, selectBranch, loading, menuLoading } =
    useBranch();
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!loading && branches.length > 0) {
      const branch = branches.find((b) => b._id === params.branchId);
      if (!branch) {
        router.push("/");
      } else if (!selectedBranch || selectedBranch._id !== branch._id) {
        selectBranch(branch);
      }
    }
  }, [
    branches,
    params.branchId,
    loading,
    selectedBranch,
    router,
    selectBranch,
  ]);

  if (loading || menuLoading || !selectedBranch) {
    return <Spinner fullWidth={true} />;
  }

  return (
    <>
      <Hero />
      <HomeMenu />
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-6xl mx-auto px-4 py-20"
        id="about"
      >
        <SectionHeaders subHeader={"Our story"} mainHeader={"About us"} />
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300">
          <div className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-lg">
            {selectedBranch?.about ? (
              <p className="font-light">{selectedBranch.about}</p>
            ) : (
              <p className="font-light">
                No information available about this branch.
              </p>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="max-w-6xl mx-auto px-4 py-16 mb-8"
        id="contact"
      >
        <SectionHeaders
          subHeader={"Don't hesitate"}
          mainHeader={"Contact us"}
        />
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              Get in Touch
            </h3>
            <div className="space-y-6">
              {selectedBranch?.phone && (
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-primary"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                      />
                    </svg>
                  </div>
                  <a
                    href={`tel:${selectedBranch.phone}`}
                    className="text-xl text-gray-600 hover:text-primary transition-colors"
                  >
                    {selectedBranch.phone}
                  </a>
                </div>
              )}

              {selectedBranch?.email && (
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-primary"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <a
                    href={`mailto:${selectedBranch.email}`}
                    className="text-xl text-gray-600 hover:text-primary transition-colors"
                  >
                    {selectedBranch.email}
                  </a>
                </div>
              )}

              {selectedBranch?.location && (
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-primary"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                  </div>
                  <p className="text-xl text-gray-600">
                    {selectedBranch.location}
                  </p>
                </div>
              )}

              {!selectedBranch?.phone && !selectedBranch?.email && (
                <p className="text-gray-500">
                  No contact information available.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              Business Hours
            </h3>
            <div className="space-y-3">
              <p className="text-gray-600">
                Monday - Friday: 9:00 AM - 10:00 PM
              </p>
              <p className="text-gray-600">Saturday: 10:00 AM - 10:00 PM</p>
              <p className="text-gray-600">Sunday: 10:00 AM - 8:00 PM</p>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
