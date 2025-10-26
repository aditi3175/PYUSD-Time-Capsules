import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import MyCapsules from "./pages/MyCapsules.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import { ContractProvider } from "./context/ContractContext.tsx";

const App: React.FC = () => {
  return (
    <ContractProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-capsules" element={<MyCapsules />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </ContractProvider>
  );
};

export default App;
