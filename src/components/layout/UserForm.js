"use client";

import { useState, useEffect } from "react";
import EditableImage from "@/components/layout/EditableImage";
import useProfile from "../UseProfile";
import AddressInputs from "./AddressInputs";
import { useBranch } from "@/components/BranchContext";
import { usePathname } from "next/navigation";

export default function UserForm({ user, onSave }) {
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile";
  const [image, setImage] = useState(user?.image || "");
  const [userName, setUserName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || "");
  const [city, setCity] = useState(user?.city || "");
  const [postalCode, setPostalCode] = useState(user?.postalCode || "");
  const [province, setProvince] = useState(user?.province || "");
  const [admin, setAdmin] = useState(user?.isAdmin || false);
  const [staff, setStaff] = useState(user?.isStaff || false);
  const [selectedBranchId, setSelectedBranchId] = useState(
    user?.branchId || ""
  );
  const { data: loggedInUserData } = useProfile();
  const { selectedBranch } = useBranch();
  const [branches, setBranches] = useState([]);

  const isSuperAdmin = loggedInUserData?.superAdmin;
  const isBranchAdmin =
    loggedInUserData?.isAdmin &&
    selectedBranch &&
    loggedInUserData?.branchId === selectedBranch._id;

  useEffect(() => {
    if (isSuperAdmin || (admin && isSuperAdmin) || (staff && isBranchAdmin)) {
      fetch("/api/branches")
        .then((res) => res.json())
        .then((data) => setBranches(data));
    }
  }, [admin, staff, isSuperAdmin, isBranchAdmin]);

  function handleAddressChange(propName, value) {
    if (propName === "phone") setPhone(value);
    if (propName === "streetAddress") setStreetAddress(value);
    if (propName === "postalCode") setPostalCode(value);
    if (propName === "city") setCity(value);
    if (propName === "province") setProvince(value);
  }

  return (
    <div className="md:flex gap-4">
      <div>
        <div className="p-2 rounded-lg relative max-w-[120px]">
          <EditableImage link={image} setLink={setImage} />
        </div>
      </div>
      <form
        className="grow"
        onSubmit={(ev) => {
          ev.preventDefault();
          onSave(ev, {
            name: userName,
            image,
            phone,
            streetAddress,
            postalCode,
            city,
            province,
            isAdmin: admin,
            isStaff: staff,
            branchId: admin
              ? selectedBranchId
              : staff
              ? selectedBranch?._id
              : null,
          });
        }}
      >
        <label>First and Lastname</label>
        <input
          type="text"
          placeholder="First and Lastname"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <label>Email</label>
        <input
          type="email"
          value={user?.email}
          disabled={true}
          placeholder={"email"}
        />
        <AddressInputs
          addressProps={{ phone, streetAddress, city, postalCode, province }}
          setAddressProp={handleAddressChange}
        />

        {/* Only show admin checkbox for super admin and not on profile page */}
        {isSuperAdmin && !isProfilePage && (
          <label className="p-2 inline-flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={admin}
              onChange={(ev) => {
                setAdmin(ev.target.checked);
                if (ev.target.checked) setStaff(false);
              }}
            />
            <span>Branch Admin</span>
          </label>
        )}

        {/* Only show staff checkbox for branch admin and not on profile page */}
        {isBranchAdmin && !isProfilePage && (
          <label className="p-2 inline-flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={staff}
              onChange={(ev) => {
                setStaff(ev.target.checked);
                if (ev.target.checked) setAdmin(false);
              }}
            />
            <span>Branch Staff</span>
          </label>
        )}

        {/* Show branch selector for super admin when setting branch admin */}
        {isSuperAdmin && admin && (
          <div className="ml-4">
            <label>Select Branch for Admin</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full p-2 border rounded-md"
              required={admin}
            >
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Staff will automatically be assigned to the branch admin's branch */}
        {isBranchAdmin && staff && (
          <input type="hidden" name="branchId" value={selectedBranch._id} />
        )}

        <button type="submit" className="mt-4">
          Save
        </button>
      </form>
    </div>
  );
}
