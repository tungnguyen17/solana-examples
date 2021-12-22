import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from '@solana/web3.js';
import { HashService } from '../../hash.service';
import { ProgramDerivedAddressInstructionService } from './program_derived_address_instruction.service';

export class ProgramDerivedAddressService {
  static async createAccount(
    connection: Connection,
    payerAccount: Keypair,
    name: string,
    size: number,
    programId: PublicKey,
  ) {
    const transaction: Transaction = new Transaction()

    const derivationPath = await this.findPDADerivationPath(name)
    const [address, nonce]: [PublicKey, number] = await PublicKey.findProgramAddress(
      [derivationPath],
      programId,
    )

    const createAccountInstruction = ProgramDerivedAddressInstructionService.createAccount(
      payerAccount.publicKey,
      derivationPath,
      nonce,
      address,
      size,
      programId,
    )
    transaction.add(createAccountInstruction)

    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerAccount],
    )
    console.info(`Created Account ${address.toBase58()}`, '---', txSignature, '\n')
  }

  static async findPDADerivationPath(
    identifier: string
  ): Promise<Buffer> {
    return HashService.sha256(identifier)
  }
}
