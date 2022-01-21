import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";

export interface IItemAccount {
  itemPublicKey: web3.PublicKey;
  mintPublicKey: web3.PublicKey;
  tokenAccountPublicKey: web3.PublicKey;
  name: string;
  market: string;
  seller: web3.PublicKey;
}

export class ItemAccount {
  private itemPublicKey: web3.PublicKey;
  private mintPublicKey: web3.PublicKey;
  private tokenAccountPublicKey: web3.PublicKey;
  private name: string;
  private market: string;
  private seller: web3.PublicKey;

  constructor(account: IItemAccount) {
    this.itemPublicKey = account.itemPublicKey;
    this.mintPublicKey = account.mintPublicKey;
    this.tokenAccountPublicKey = account.tokenAccountPublicKey;
    this.name = account.name;
    this.market = account.market;
    this.seller = account.seller;
  }

  async getSupply(provider: anchor.Provider): Promise<number> {
    const supply = await provider.connection.getTokenAccountBalance(
      this.tokenAccountPublicKey
    );
    return supply.value.uiAmount || 0;
  }

  getItemPublicKey(): web3.PublicKey {
    return this.itemPublicKey;
  }

  getMintPublicKey(): web3.PublicKey {
    return this.mintPublicKey;
  }

  getTokenAccountPublicKey(): web3.PublicKey {
    return this.tokenAccountPublicKey;
  }

  getName(): string {
    return this.name;
  }

  getMarket(): string {
    return this.market;
  }

  getSeller(): web3.PublicKey {
    return this.seller;
  }
}
