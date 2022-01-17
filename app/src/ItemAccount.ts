import { web3 } from "@project-serum/anchor";

export interface IItemAccount {
  mintPublicKey: web3.PublicKey;
  name: string;
  market: string;
}

export class ItemAccount {
  itemPublicKey: web3.PublicKey;
  mintPublicKey: web3.PublicKey;
  name: string;
  market: string;

  constructor(publicKey: web3.PublicKey, account: IItemAccount) {
    this.itemPublicKey = publicKey;
    this.mintPublicKey = account.mintPublicKey;
    this.name = account.name;
    this.market = account.market;
  }
}
