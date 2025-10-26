import React from "react";
import Navbar from "../components/Navbar.tsx";
import CapsuleForm from "../components/CapsuleForm.tsx";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar />
      <CapsuleForm />
    </div>
  );
};

export default Home;