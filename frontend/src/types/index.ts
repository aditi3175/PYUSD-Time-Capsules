import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

export interface Capsule {
  owner: string;
  amount: bigint; // BigInt for PYUSD amount
  message: string;
  fileHash?: string; // optional
  unlockTime: number;
  opened: boolean;
}
