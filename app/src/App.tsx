import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Main, Trade } from "Routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/trade" element={<Trade />} />
      </Routes>
    </BrowserRouter>
  );
}
