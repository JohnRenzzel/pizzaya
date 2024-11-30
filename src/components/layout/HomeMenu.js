"use client";
import Image from "next/image";
import MenuItem from "../menu/MenuItem";
import SectionHeaders from "./SectionHeaders";
import { useBranch } from "@/components/BranchContext";
import Spinner from "@/components/layout/Spinner";

export default function HomeMenu() {
  const { selectedBranch, menuItems, menuLoading } = useBranch();

  if (menuLoading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  const bestSellers = menuItems
    .filter((item) => item.isAvailable && item.branchId === selectedBranch._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  if (!bestSellers?.length) {
    return null;
  }

  return (
    <section className="">
      <div className="absolute left-0 right-0 w-full justify-start">
        <div className="absolute lef-0 -top-[70px] text-left -z-10">
          <Image src={"/sallad1.png"} width={109} height={189} alt={"sallad"} />
        </div>
        <div className="absolute -top-[100px] right-0 -z-10">
          <Image src={"/sallad2.png"} width={107} height={195} alt={"sallad"} />
        </div>
      </div>
      <div className="text-center mb-4">
        <SectionHeaders
          subHeader={`Latest at ${selectedBranch.name}`}
          mainHeader={"New Arrivals"}
        />
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 auto-rows-fr">
        {bestSellers.map((item) => (
          <MenuItem key={item._id} {...item} />
        ))}
      </div>
    </section>
  );
}
