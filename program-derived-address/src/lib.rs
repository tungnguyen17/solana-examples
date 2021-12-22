pub mod account;
pub mod error;
pub mod instruction;
pub mod processor;

use crate::{
  processor::{
    Processor,
  },
};
use solana_program::{
  account_info::{
    AccountInfo
  },
  entrypoint,
  entrypoint::{
    ProgramResult,
  },
  msg,
  pubkey::{
    Pubkey,
  },
};

entrypoint!(process_instruction);

fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  msg!("process_instruction of program {:?}", &program_id);

  if let Err(error) = Processor::process(program_id, accounts, instruction_data) {
    return Err(error);
  }
  Ok(())
}
