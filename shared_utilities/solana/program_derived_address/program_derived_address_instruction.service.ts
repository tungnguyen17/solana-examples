import * as borsh from '@project-serum/borsh';
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} from '@solana/web3.js';
import { BorshService } from '../borsh.service';

interface CreateAccountRequest {
  instruction: number
  seeds: Buffer
  nonce: number
  space: number
}

const CREATE_ACCOUNT_LAYOUT = borsh.struct<CreateAccountRequest>(
  [
    borsh.u8('instruction'),
    borsh.vecU8('seeds'),
    borsh.u8('nonce'),
    borsh.u16('space'),
  ]
)

interface InvokeRequest {
  instruction: number
}

const INVOKE_LAYOUT = borsh.struct<CreateAccountRequest>(
  [
    borsh.u8('instruction'),
  ]
)

export class ProgramDerivedAddressInstructionService {
  static createAccount(
    payerAddress: PublicKey,
    seeds: Buffer,
    nonce: number,
    programDerivedAddress: PublicKey,
    space: number,
    programId: PublicKey
  ): TransactionInstruction {
    const request = <CreateAccountRequest>{
      instruction: 0,
      seeds,
      nonce,
      space,
    }
    const data: Buffer = BorshService.serialize(
      CREATE_ACCOUNT_LAYOUT,
      request,
      256,
    )
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: payerAddress, isSigner: true, isWritable: false },
      <AccountMeta>{ pubkey: programDerivedAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ]
    return new TransactionInstruction({
      keys,
      data,
      programId,
    })
  }

  static invoke(
    programDerivedAddress: PublicKey,
    programId: PublicKey
  ): TransactionInstruction {
    const request = <InvokeRequest>{
      instruction: 1,
    }
    const data: Buffer = BorshService.serialize(
      INVOKE_LAYOUT,
      request,
      256,
    )
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: programDerivedAddress, isSigner: false, isWritable: true },
    ]
    return new TransactionInstruction({
      keys,
      data,
      programId,
    })
  }
}
