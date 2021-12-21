import * as borsh from '@project-serum/borsh';
import { AccountMeta, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { BorshService } from './borsh.service';

export const ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

class CreateAssociatedTokenAccountRequest {
}

const ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LAYOUT = {
  CREATE_ACCOUNT: borsh.struct<CreateAssociatedTokenAccountRequest>(
    []
  ),
}

export const INITIALIZE_ACCOUNT_SPAN = 165
export const INITIALIZE_MINT_SPAN = 82

export class ApproveRequest {
  instruction: number
  amount: BN
}

export class BurnRequest {
  instruction: number
  amount: BN
}

export class ChangeAuthority {
  instruction: number
  type: number
  authority?: PublicKey
}

export class CloseAccount {
  instruction: number
}

export class InitializeAccount {
  instruction: number
}

export class InitializeMint {
  instruction: number
  decimals: number
  mintAuthority: PublicKey
  freezeAuthority?: PublicKey
}

export class MintRequest {
  instruction: number
  amount: BN
}

export class TransferRequest {
  instruction: number
  amount: BN
}

// ref: https://github.com/solana-labs/solana-program-library/blob/cd63580b796319056edbbcca8690deb54c56581d/token/js/client/token.js#L149
class TokenAccountData {
  mint: PublicKey
  owner: PublicKey
  amount: BN
  delegateOption: number
  delegate: PublicKey
  state: number
  isNativeOption: number
  isNative: BN
  delegatedAmount: BN
  closeAuthorityOption: number
  closeAuthority: PublicKey
}

// ref: https://github.com/solana-labs/solana-program-library/blob/cd63580b796319056edbbcca8690deb54c56581d/token/js/client/token.js#L107
export class TokenMintData {
  mintAuthorityOption: number
  mintAuthority: PublicKey
  supply: BN
  decimals: number
  isInitialized: number
  freezeAuthorityOption: number
  freezeAuthority: PublicKey
}

export class TokenAccountInfo {
  address: PublicKey
  mint: PublicKey
  owner: PublicKey
  amount: BN
  decimals: number
  delegate: null | PublicKey
  delegatedAmount: BN
  isInitialized: boolean
  isFrozen: boolean
  isNative: boolean
  rentExemptReserve: null | BN
  closeAuthority: null | PublicKey
}

export class TokenMintInfo {
  address: PublicKey
  supply: BN
  decimals: number
  isInitialized: boolean
  mintAuthority: null | PublicKey
  freezeAuthority: null | PublicKey
}

export const TOKEN_PROGRAM_ID: PublicKey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const TOKEN_PROGRAM_LAYOUT = {
  APPROVE: borsh.struct<ApproveRequest>(
    [
      borsh.u8('instruction'),
      borsh.u64('amount'),
    ]
  ),
  BURN: borsh.struct<BurnRequest>(
    [
      borsh.u8('instruction'),
      borsh.u64('amount'),
    ]
  ),
  CHANGE_AUTHORITY: borsh.struct<ChangeAuthority>(
    [
      borsh.u8('instruction'),
      borsh.u8('type'),
      borsh.option(borsh.publicKey(), 'authority'),
    ]
  ),
  CLOSE_ACCOUNT: borsh.struct<CloseAccount>(
    [
      borsh.u8('instruction'),
    ]
  ),
  INITIALIZE_ACCOUNT: borsh.struct<InitializeAccount>(
    [
      borsh.u8('instruction'),
    ]
  ),
  INITIALIZE_MINT: borsh.struct<InitializeMint>(
    [
      borsh.u8('instruction'),
      borsh.u8('decimals'),
      borsh.publicKey('mintAuthority'),
      borsh.option(borsh.publicKey(), 'freezeAuthority')
    ]
  ),
  MINT: borsh.struct<MintRequest>(
    [
      borsh.u8('instruction'),
      borsh.u64('amount'),
    ]
  ),
  TOKEN_ACCOUNT: borsh.struct<TokenAccountData>(
    [
      borsh.publicKey('mint'),
      borsh.publicKey('owner'),
      borsh.u64('amount'),
      borsh.u32('delegateOption'),
      borsh.publicKey('delegate'),
      borsh.u8('state'),
      borsh.u32('isNativeOption'),
      borsh.u64('isNative'),
      borsh.u64('delegatedAmount'),
      borsh.u32('closeAuthorityOption'),
      borsh.publicKey('closeAuthority'),
    ]
  ),
  TOKEN_MINT: borsh.struct<TokenMintData>(
    [
      borsh.u32('mintAuthorityOption'),
      borsh.publicKey('mintAuthority'),
      borsh.u64('supply'),
      borsh.u8('decimals'),
      borsh.u8('isInitialized'),
      borsh.u32('freezeAuthorityOption'),
      borsh.publicKey('freezeAuthority'),
    ]
  ),
  TRANSFER: borsh.struct<TransferRequest>(
    [
      borsh.u8('instruction'),
      borsh.u64('amount'),
    ]
  ),
}

export class TokenProgramInstructionService {

  static async createApproveTransaction(
    ownerAddress: PublicKey,
    ownerTokenAddress: PublicKey,
    delegateAddress: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: ownerTokenAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: delegateAddress, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: true, isWritable: false },
    ]
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.APPROVE, <ApproveRequest>{ instruction: 4, amount: new BN(amount) }, 10)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID
    }))
    return transaction
  }

  static async createBurnTransaction(
    mintAddress: PublicKey,
    ownerAddress: PublicKey,
    userTokenAddress: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: userTokenAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: mintAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: true, isWritable: false },
    ]
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.BURN, <BurnRequest>{ instruction: 8, amount: new BN(amount) }, 10)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID
    }))
    return transaction
  }

  static async createAssociatedTokenAccountTransaction(
    payerAddress: PublicKey,
    ownerAddress: PublicKey,
    tokenMintAddress: PublicKey,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const tokenAccountAddress = await TokenProgramInstructionService.findAssociatedTokenAddress(ownerAddress, tokenMintAddress)
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: payerAddress, isSigner: true, isWritable: true },
      <AccountMeta>{ pubkey: tokenAccountAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: tokenMintAddress, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ]
    const data = BorshService.serialize(ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LAYOUT.CREATE_ACCOUNT, <CreateAssociatedTokenAccountRequest>{}, 10)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    }))
    return transaction
  }

  static async createChangeAuthorityTransaction(
    payerAddress: PublicKey,
    mintAddress: PublicKey,
    authorityType: number,
    authorityAddress: PublicKey | null,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: mintAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: payerAddress, isSigner: true, isWritable: false },
    ]
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.CHANGE_AUTHORITY, <ChangeAuthority>{ instruction: 6, type: authorityType, authority: authorityAddress }, 100)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID
    }))
    return transaction
  }

  static async createCloseAccountTransaction(
    ownerAddress: PublicKey,
    tokenAddressToClose: PublicKey,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: tokenAddressToClose, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: true, isWritable: false },
    ];
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.CLOSE_ACCOUNT, <CloseAccount>{ instruction: 9, }, 2)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID,
    }));
    return transaction
  }

  static async createInitializeAccountTransaction(
    payerAddress: PublicKey,
    ownerAddress: PublicKey,
    tokenMintAddress: PublicKey,
    tokenAccountAddress: PublicKey,
    lamportsToInitializeAccount: number,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerAddress,
        newAccountPubkey: tokenAccountAddress,
        lamports: lamportsToInitializeAccount,
        space: INITIALIZE_ACCOUNT_SPAN,
        programId: TOKEN_PROGRAM_ID,
      }),
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerAddress,
        toPubkey: tokenAccountAddress,
        lamports: 2039280,
      }),
    );

    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: tokenAccountAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: tokenMintAddress, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: false, isWritable: false },
      <AccountMeta>{ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.INITIALIZE_ACCOUNT, <InitializeAccount>{ instruction: 1, }, 2)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID,
    }));
    return transaction
  }

  static async createInitializeMintTransaction(
    payerAddress: PublicKey,
    tokenMintAddress: PublicKey,
    decimals: number,
    mintAuthorityAddress: PublicKey,
    freezeAuthorityAddress: PublicKey | null,
    lamportToInitializeMint: number,
    ): Promise<Transaction> {
    const transaction = new Transaction()
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerAddress,
        newAccountPubkey: tokenMintAddress,
        lamports: lamportToInitializeMint,
        space: INITIALIZE_MINT_SPAN,
        programId: TOKEN_PROGRAM_ID,
      }),
    )

    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: tokenMintAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ]
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.INITIALIZE_MINT, <InitializeMint>{
      instruction: 0,
      decimals,
      mintAuthority: mintAuthorityAddress,
      freezeAuthority: freezeAuthorityAddress,
    }, 67)
    transaction.add(
      new TransactionInstruction({
        keys,
        programId: TOKEN_PROGRAM_ID,
        data,
      })
    )

    return transaction
  }

  static async createTransferTransaction(
    ownerAddress: PublicKey,
    sourceTokenAddress: PublicKey,
    targetTokenAddress: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: sourceTokenAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: targetTokenAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: ownerAddress, isSigner: true, isWritable: false },
    ];
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.TRANSFER, <TransferRequest>{
      instruction: 3,
      amount: new BN(amount),
    }, 10)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID
    }))
    return transaction
  }

  static async createMintToTransaction(
    authorityAddress: PublicKey,
    tokenMintAddress: PublicKey,
    targetTokenAddress: PublicKey,
    amount: number,
  ): Promise<Transaction> {
    const transaction: Transaction = new Transaction()
    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: tokenMintAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: targetTokenAddress, isSigner: false, isWritable: true },
      <AccountMeta>{ pubkey: authorityAddress, isSigner: true, isWritable: false },
    ];
    const data = BorshService.serialize(TOKEN_PROGRAM_LAYOUT.MINT, <MintRequest>{
      instruction: 7,
      amount: new BN(amount),
    }, 10)
    transaction.add(new TransactionInstruction({
      keys,
      data,
      programId: TOKEN_PROGRAM_ID
    }))
    return transaction
  }

  static decodeTokenAccountInfo(
    data: Buffer
  ): TokenAccountInfo {
    const decodedData: TokenAccountData = BorshService.deserialize(TOKEN_PROGRAM_LAYOUT.TOKEN_ACCOUNT, data)
    return <TokenAccountInfo>{
      mint: decodedData.mint,
      owner: decodedData.owner,
      amount: decodedData.amount,
      delegate: decodedData.delegateOption === 0 ? null : decodedData.delegate,
      delegatedAmount: decodedData.delegateOption === 0 ? new BN(0) : decodedData.delegatedAmount,
      isInitialized: decodedData.state !== 0,
      isFrozen: decodedData.state === 2,
      isNative: decodedData.isNativeOption === 1,
      rentExemptReserve: decodedData.isNativeOption === 1 ? decodedData.isNative : null,
      closeAuthority: decodedData.closeAuthorityOption === 0 ? null : decodedData.closeAuthority,
    }
  }

  static decodeTokenMintInfo(
    data: Buffer
  ): TokenMintInfo {
    const decodedData: TokenMintData = BorshService.deserialize(TOKEN_PROGRAM_LAYOUT.TOKEN_MINT, data)
    return <TokenMintInfo>{
      supply: decodedData.supply,
      decimals: decodedData.decimals,
      isInitialized: decodedData.isInitialized !== 0,
      mintAuthority: decodedData.mintAuthorityOption === 0 ? null : decodedData.mintAuthority,
      freezeAuthority: decodedData.freezeAuthorityOption === 0 ? null : decodedData.freezeAuthority,
    }
  }

  static decodeTransferInstruction(
    data: Buffer,
  ): TransferRequest {
    return BorshService.deserialize(TOKEN_PROGRAM_LAYOUT.TRANSFER, data)
  }

  static async findAssociatedTokenAddress(
    walletAddress: PublicKey,
    tokenMintAddress: PublicKey,
  ): Promise<PublicKey> {
    const [address, ] = await PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        tokenMintAddress.toBuffer(),
      ],
      ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
    return address
  }
}

export class AuthorityTypes {
  static MintTokens = 0
  static FreezeAccount = 1
  static AccountOwner = 2
  static CloseAccount = 3
}
