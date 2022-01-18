import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Main, Trade } from "Routes";
import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { ItemAccount } from "Classes";
import { EscrowContext, IEscrowContext } from "Helper";

export default function App() {
  const wallet = useAnchorWallet();
  const network = "http://127.0.0.1:8899";
  const [program, setProgram] = useState<anchor.Program>();
  const [provider, setProvider] = useState<anchor.Provider>();
  const [itemAccounts, setItemAccounts] = useState<ItemAccount[]>();
  const escrowContextValue: IEscrowContext = {
    wallet,
    network,
    program,
    setProgram,
    provider,
    setProvider,
    itemAccounts,
    setItemAccounts,
  };

  return (
    <EscrowContext.Provider value={escrowContextValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/trade/:itemId" element={<Trade />} />
          <Route path="*" element={<Main />} />
        </Routes>
      </BrowserRouter>
    </EscrowContext.Provider>
  );
}
