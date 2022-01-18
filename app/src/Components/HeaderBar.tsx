import React from "react";
import { Toolbar, Typography, AppBar } from "@mui/material";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-material-ui";
import DisconnectIcon from "@mui/icons-material/LinkOff";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";

export function HeaderBar() {
  const wallet = useAnchorWallet();
  const navigate = useNavigate();

  const onTitleClick = () => {
    navigate("/");
  };

  return (
    <AppBar position="static" style={{ marginBottom: " 2rem" }}>
      <Toolbar style={{ display: "flex" }}>
        <Typography
          component="h1"
          variant="h6"
          style={{ flexGrow: 1, cursor: "pointer" }}
          onClick={onTitleClick}
        >
          Solana Escrow Program
        </Typography>
        <WalletMultiButton />
        {wallet && (
          <WalletDisconnectButton
            startIcon={<DisconnectIcon />}
            style={{ marginLeft: 8 }}
          />
        )}
      </Toolbar>
    </AppBar>
  );
}
