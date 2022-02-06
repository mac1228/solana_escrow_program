import React, { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Main, Trade, Offers, MyItems } from "Routes";
import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { ItemAccount } from "Classes";
import { EscrowContext, IEscrowContext } from "Helper";

export default function App() {
  const wallet = useAnchorWallet();
  const network = "https://api.devnet.solana.com";
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
      <HashRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/trade/:itemId" element={<Trade />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/my-items" element={<MyItems />} />
          <Route path="*" element={<Main />} />
        </Routes>
      </HashRouter>
    </EscrowContext.Provider>
  );
}
