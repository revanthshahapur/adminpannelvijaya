import { Outlet } from "react-router-dom";

const Finance = () => {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Finance</h1>

      {/* ✅ THIS IS REQUIRED */}
      <Outlet />
    </div>
  );
};

export default Finance;