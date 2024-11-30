import { useBranch } from "../BranchContext";
import Spinner from "./Spinner";

export default function BranchSelector() {
  const { branches, selectedBranch, selectBranch, loading } = useBranch();

  if (loading) return <Spinner />;

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500">Select Branch:</span>
      <select
        value={selectedBranch?._id || ""}
        onChange={(e) => {
          const branch = branches.find((b) => b._id === e.target.value);
          selectBranch(branch);
        }}
        className="border p-2 rounded-md"
      >
        <option value="">Select a branch</option>
        {branches.map((branch) => (
          <option key={branch._id} value={branch._id}>
            {branch.name} - {branch.city}
          </option>
        ))}
      </select>
    </div>
  );
}
