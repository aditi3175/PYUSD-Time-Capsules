import React from "react";
import Navbar from "../components/Navbar.tsx";
import CapsuleList from "../components/CapsuleList.tsx";

const MyCapsules: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar />
      <div className="container mx-auto p-8">
        <CapsuleList />
      </div>
    </div>
  );
};

export default MyCapsules;