import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import BN from 'bn.js'
import { TokenProgramService } from './token_program.service'
import { TokenAccountInfo, TokenProgramInstructionService, TOKEN_PROGRAM_ID } from './token_program_instruction.service'

export class MigrateSplTokenAccountsServerSide {
  instructions: ServerSideInstruction[]
  pubkey: string
  recentBlockhash: string
  signatureBs64: string
}

export class ServerSideInstruction {
  type: number
  params: any
}

export class ServerSideService {

  static async migrateSplTokenAccounts(
    connection: Connection,
    payerAccount: Keypair,
    userAddress: PublicKey,
  ): Promise<MigrateSplTokenAccountsServerSide> {
    const result = new MigrateSplTokenAccountsServerSide()
    const userTokenAccountsResult = await connection.getTokenAccountsByOwner(
      userAddress,
      {
        programId: TOKEN_PROGRAM_ID,
      },
    )
    const instructions: TransactionInstruction[] = []
    const serverSideInstructions: ServerSideInstruction[] = []
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
        userAddress,
        tokenMintAddress,
      )
      if (!filteredTokenAccountInfos.some(accountInfo => accountInfo.address.toBase58() === associatedTokenAccountAddress.toBase58())) {
        const transaction = await TokenProgramInstructionService.createAssociatedTokenAccountTransaction(
          payerAccount.publicKey,
          userAddress,
          tokenMintAddress,
        )
        instructions.push(transaction.instructions[0])
        serverSideInstructions.push({
          type: 300,
          params: {
            payer: payerAccount.publicKey.toBase58(),
            owner: userAddress.toBase58(),
            mint: tokenMintAddress.toBase58(),
          }
        })
      }
      for(let j = 0; j < filteredTokenAccountInfos.length; j++) {
        const tokenAccountInfo = filteredTokenAccountInfos[j]
        if (tokenAccountInfo.address.toBase58() !== associatedTokenAccountAddress.toBase58()) {
          if (tokenAccountInfo.amount.gt(new BN(0))) {
            const transaction = await TokenProgramInstructionService.createTransferTransaction(
              userAddress,
              tokenAccountInfo.address,
              associatedTokenAccountAddress,
              tokenAccountInfo.amount.toNumber(),
            )
            instructions.push(transaction.instructions[0])
            serverSideInstructions.push({
              type: 203,
              params: {
                owner: userAddress.toBase58(),
                from: tokenAccountInfo.address.toBase58(),
                to: associatedTokenAccountAddress.toBase58(),
                amount: tokenAccountInfo.amount.toNumber(),
              }
            })
          }
          const transaction = await TokenProgramInstructionService.createCloseAccountTransaction(
            userAddress,
            tokenAccountInfo.address,
          )
          instructions.push(transaction.instructions[0])
          serverSideInstructions.push({
            type: 209,
            params: {
              owner: userAddress.toBase58(),
              account: tokenAccountInfo.address.toBase58(),
            }
          })
        }
      }
    }
    if (instructions.length > 0) {
      const transaction: Transaction = new Transaction()
      const getRecentBlockhash = await connection.getRecentBlockhash()
      transaction.recentBlockhash = getRecentBlockhash.blockhash
      result.recentBlockhash = getRecentBlockhash.blockhash
      transaction.feePayer = payerAccount.publicKey
      transaction.instructions = instructions
      result.instructions = serverSideInstructions
      transaction.sign(payerAccount)
      for (let i = 0; i < transaction.signatures.length; i++) {
        if (transaction.signatures[i].publicKey.toBase58() === payerAccount.publicKey.toBase58()) {
          result.pubkey = payerAccount.publicKey.toBase58()
          result.signatureBs64 = transaction.signatures[i].signature.toString('base64')
        }
      }
      return result
    }
    return null
  }
}
