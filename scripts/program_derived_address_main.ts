import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import path from 'path';
import { ProgramDerivedAddressService } from '../shared_utilities/solana/program_derived_address/program_derived_address.service';
import { SolanaConfigService } from '../shared_utilities/solana/solana_config.service';

const PROGRAM_KEYPAIR_FILE_PATH: string = path.join('target', 'deploy', 'program_derived_address-keypair.json');

(async function main() {
  const rpcUrl: string = await SolanaConfigService.getRpcUrl()
  const connection: Connection = new Connection(rpcUrl, 'finalized')
  const defaultAccount: Keypair = await SolanaConfigService.getDefaultAccount()
  const programAccount: Keypair = await SolanaConfigService.readAccountFromFile(PROGRAM_KEYPAIR_FILE_PATH)

  await ProgramDerivedAddressService.invoke(
    connection,
    defaultAccount,
    'hello_world',
    100,
    programAccount.publicKey,
  )
})()
