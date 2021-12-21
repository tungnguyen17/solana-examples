import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import BN from 'bn.js'
import { SolanaService } from './solana.service'
import { ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, INITIALIZE_ACCOUNT_SPAN, INITIALIZE_MINT_SPAN, TokenAccountInfo, TokenMintInfo, TokenProgramInstructionService, TOKEN_PROGRAM_ID } from './token_program_instruction.service'

export class TokenProgramService {

  static async approve(
    connection: Connection,
    payerAccount: Keypair,
    payerTokenAddress: PublicKey,
    delegateAddress: PublicKey,
    amount: number,
  ): Promise<boolean> {
    const transaction = await TokenProgramInstructionService.createApproveTransaction(
      payerAccount.publicKey,
      payerTokenAddress,
      delegateAddress,
      amount,
    )
    const signers = [
      payerAccount
    ]
    const txSign = await sendAndConfirmTransaction(connection, transaction, signers)
    console.log(`Delegated ${amount} token units to ${delegateAddress.toBase58()}`, '---', txSign, '\n')
    return true
  }

  static async checkAddressType(
    connection: Connection,
    address: PublicKey,
  ): Promise<number> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo.owner.toBase58() === SystemProgram.programId.toBase58()) {
      return 1
    }
    if (accountInfo.owner.toBase58() === TOKEN_PROGRAM_ID.toBase58()) {
      return 2
    }
    return 0
  }

  static async createTokenAccount(
    connection: Connection,
    payerAccount: Keypair,
    userAddress: PublicKey,
    tokenMintAddress: PublicKey,
  ): Promise<Keypair> {
    const tokenAccountAccount = Keypair.generate()
    const lamportsToInitializeAccount = await connection.getMinimumBalanceForRentExemption(INITIALIZE_ACCOUNT_SPAN)
    const transaction = await TokenProgramInstructionService.createInitializeAccountTransaction(
      payerAccount.publicKey,
      userAddress,
      tokenMintAddress,
      tokenAccountAccount.publicKey,
      lamportsToInitializeAccount,
    )
    const txSign = await sendAndConfirmTransaction(connection, transaction, [
      payerAccount,
      tokenAccountAccount,
    ])
    console.info(`Created Token Account ${tokenAccountAccount.publicKey.toBase58()}`, '---', txSign, '\n')
    return tokenAccountAccount
  }

  static async createTokenMint(
    connection: Connection,
    payerAccount: Keypair,
    tokenMintAccount: Keypair,
    decimals: number,
    mintAuthorityAddress: PublicKey,
    freezeAuthorityAddress: PublicKey | null,
  ): Promise<Keypair> {
    if (await SolanaService.isAddressInUse(connection, tokenMintAccount.publicKey)) {
      console.info(`SKIPPED: Token Mint ${tokenMintAccount.publicKey.toBase58()} is already existed`, '\n')
      return tokenMintAccount
    }
    const lamportsToInitializeMint = await connection.getMinimumBalanceForRentExemption(INITIALIZE_MINT_SPAN)
    const transaction = await TokenProgramInstructionService.createInitializeMintTransaction(
      payerAccount.publicKey,
      tokenMintAccount.publicKey,
      decimals,
      mintAuthorityAddress,
      freezeAuthorityAddress,
      lamportsToInitializeMint,
    )
    const txSign = await sendAndConfirmTransaction(connection, transaction, [
      payerAccount,
      tokenMintAccount,
    ])
    console.info(`Created Token Mint ${tokenMintAccount.publicKey.toBase58()}`, '---', txSign, '\n')
    return tokenMintAccount
  }

  static async createTokenMintUnique(
    connection: Connection,
    payerAccount: Keypair,
    tokenMintAccount: Keypair,
    initialOwnerAddress: PublicKey,
  ): Promise<Keypair> {
    if (await SolanaService.isAddressInUse(connection, tokenMintAccount.publicKey)) {
      console.info(`SKIPPED: Token Mint ${tokenMintAccount.publicKey.toBase58()} is already existed`, '\n')
      return tokenMintAccount
    }
    const lamportsToInitializeMint = await connection.getMinimumBalanceForRentExemption(INITIALIZE_MINT_SPAN)
    const transaction = await TokenProgramInstructionService.createInitializeMintTransaction(
      payerAccount.publicKey,
      tokenMintAccount.publicKey,
      0,
      payerAccount.publicKey,
      null,
      lamportsToInitializeMint,
    )
    const initialOwnerTokenAddress = await TokenProgramService.findAssociatedTokenAddress(
      initialOwnerAddress,
      tokenMintAccount.publicKey,
    )
    const createATATransaction = await TokenProgramInstructionService.createAssociatedTokenAccountTransaction(
      payerAccount.publicKey,
      initialOwnerAddress,
      tokenMintAccount.publicKey,
    )
    transaction.add(createATATransaction.instructions[0])
    const mintToTransaction = await TokenProgramInstructionService.createMintToTransaction(
      payerAccount.publicKey,
      tokenMintAccount.publicKey,
      initialOwnerTokenAddress,
      1,
    )
    transaction.add(mintToTransaction.instructions[0])
    const disableMintAuthority = await TokenProgramInstructionService.createChangeAuthorityTransaction(
      payerAccount.publicKey,
      tokenMintAccount.publicKey,
      0,
      null,
    )
    transaction.add(disableMintAuthority.instructions[0])
    const txSign = await sendAndConfirmTransaction(connection, transaction, [
      payerAccount,
      tokenMintAccount,
    ])
    console.info(`Created Token Mint ${tokenMintAccount.publicKey.toBase58()}`, '---', txSign, '\n')
    return tokenMintAccount
  }

  static async createAssociatedTokenAccountAddress(
    connection: Connection,
    payerAccount: Keypair,
    ownerAddress: PublicKey,
    tokenMintAddress: PublicKey,
  ): Promise<PublicKey> {
    const tokenAccountAddress = await TokenProgramService.findAssociatedTokenAddress(ownerAddress, tokenMintAddress)
    if (await SolanaService.isAddressInUse(connection, tokenAccountAddress)) {
      console.log(`SKIPPED: Associated Token Account ${tokenAccountAddress.toBase58()} of Account ${ownerAddress.toBase58()} is already existed`, '\n')
      return tokenAccountAddress
    }
    const transaction = await TokenProgramInstructionService.createAssociatedTokenAccountTransaction(
      payerAccount.publicKey,
      ownerAddress,
      tokenMintAddress,
    )
    const txSign = await sendAndConfirmTransaction(connection, transaction, [
      payerAccount,
    ])
    console.log(`Created Associated Token Account ${tokenAccountAddress.toBase58()} for Account ${ownerAddress.toBase58()}`, '---', txSign, '\n')
    return tokenAccountAddress
  }

  static async getTokenAccountInfo(
    connection: Connection,
    address: PublicKey
  ): Promise<TokenAccountInfo> {
    const accountInfo = await connection.getAccountInfo(address)
    const data = TokenProgramInstructionService.decodeTokenAccountInfo(accountInfo.data)
    data.address = address
    return data
  }

  static async getTokenMintInfo(
    connection: Connection,
    address: PublicKey
  ): Promise<TokenMintInfo> {
    const accountInfo = await connection.getAccountInfo(address)
    const data = TokenProgramInstructionService.decodeTokenMintInfo(accountInfo.data)
    data.address = address
    return data
  }

  static async migrateSplTokenAccounts(
    connection: Connection,
    payerAccount: Keypair,
    userAccount: Keypair,
  ): Promise<boolean> {
    const userTokenAccountsResult = await connection.getTokenAccountsByOwner(
      userAccount.publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      },
    )
    const instructions: TransactionInstruction[] = []
    const tokenAccountInfos: TokenAccountInfo[] = userTokenAccountsResult.value.map(tokenAccount => {
      const result = TokenProgramInstructionService.decodeTokenAccountInfo(tokenAccount.account.data)
      result.address = tokenAccount.pubkey
      return result
    })
    const tokenMintAddresses: PublicKey[] = tokenAccountInfos.map(account => account.mint)
      .filter((value, index, self) => {
        return self.findIndex(subValue => subValue.toBase58() === value.toBase58()) === index;
      })
    for(let i = 0; i < tokenMintAddresses.length; i++) {
      const tokenMintAddress = tokenMintAddresses[i]
      const filteredTokenAccountInfos = tokenAccountInfos.filter(accountInfo => accountInfo.mint.toBase58() === tokenMintAddress.toBase58())
      const associatedTokenAccountAddress = await TokenProgramService.findAssociatedTokenAddress(
        userAccount.publicKey,
        tokenMintAddress,
      )
      if (!filteredTokenAccountInfos.some(accountInfo => accountInfo.address.toBase58() === associatedTokenAccountAddress.toBase58())) {
        const transaction = await TokenProgramInstructionService.createAssociatedTokenAccountTransaction(
          payerAccount.publicKey,
          userAccount.publicKey,
          tokenMintAddress,
        )
        instructions.push(transaction.instructions[0])
      }
      for(let j = 0; j < filteredTokenAccountInfos.length; j++) {
        const tokenAccountInfo = filteredTokenAccountInfos[j]
        if (tokenAccountInfo.address.toBase58() !== associatedTokenAccountAddress.toBase58()) {
          if (tokenAccountInfo.amount.gt(new BN(0))) {
            const transaction = await TokenProgramInstructionService.createTransferTransaction(
              userAccount.publicKey,
              tokenAccountInfo.address,
              associatedTokenAccountAddress,
              tokenAccountInfo.amount.toNumber(),
            )
            instructions.push(transaction.instructions[0])
          }
          const transaction = await TokenProgramInstructionService.createCloseAccountTransaction(
            userAccount.publicKey,
            tokenAccountInfo.address,
          )
          instructions.push(transaction.instructions[0])
        }
      }
    }
    if (instructions.length > 0) {
      const transaction: Transaction = new Transaction()
      transaction.instructions = instructions
      const signers = [
        payerAccount,
        userAccount,
      ]
      const txSign = await sendAndConfirmTransaction(connection, transaction, signers)
      console.info(`Migrated SPL-Token accounts for ${userAccount.publicKey.toBase58()}`, '---', txSign, '\n')
      return true
    }
    console.info('Migrated SPL-Token: Nothing to do', '\n')
    return false
  }

  static async mint(
    connection: Connection,
    payerAccount: Keypair,
    tokenMintAddress: PublicKey,
    recipientAddress: PublicKey,
    amount: number,
  ): Promise<boolean> {
    const transaction = new Transaction()
    let recipientTokenAddress = recipientAddress
    const recepientType = await this.checkAddressType(connection, recipientAddress)
    if (recepientType === 1) {
      const associatedTokenAccountAddress = await this.findAssociatedTokenAddress(
        recipientAddress,
        tokenMintAddress,
      )
      if (!await SolanaService.isAddressInUse(connection, associatedTokenAccountAddress)) {
        const createATATransaction = await TokenProgramInstructionService.createAssociatedTokenAccountTransaction(
          payerAccount.publicKey,
          recipientAddress,
          tokenMintAddress,
        )
        transaction.add(createATATransaction.instructions[0])
      }
      recipientTokenAddress = associatedTokenAccountAddress
    }
    const mintTransaction = await TokenProgramInstructionService.createMintToTransaction(
      payerAccount.publicKey,
      tokenMintAddress,
      recipientTokenAddress,
      amount,
    )
    transaction.add(mintTransaction.instructions[0])
    const signers = [
      payerAccount
    ]

    const txSign = await sendAndConfirmTransaction(connection, transaction, signers)
    console.log(`Minted ${amount} token units to ${recipientTokenAddress.toBase58()}`, '---', txSign, '\n')
    return true
  }

  static async transfer(
    connection: Connection,
    payerAccount: Keypair,
    payerTokenAddress: PublicKey,
    recipientTokenAddress: PublicKey,
    amount: number,
  ): Promise<boolean> {
    const transaction = await TokenProgramInstructionService.createTransferTransaction(
      payerAccount.publicKey,
      payerTokenAddress,
      recipientTokenAddress,
      amount,
    )
    const signers = [
      payerAccount
    ]
    const txSign = await sendAndConfirmTransaction(connection, transaction, signers)
    console.log(`Transferred ${amount} token units from ${payerTokenAddress.toBase58()} to ${recipientTokenAddress.toBase58()}`, '---', txSign, '\n')
    return true
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

// Re-export
export { ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_PROGRAM_ID } from './token_program_instruction.service'
