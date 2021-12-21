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

pub fn process_instruction(
  program_id: &Pubkey,
  _accounts: &[AccountInfo],
  _instruction_data: &[u8],
) -> ProgramResult {
  msg!("process_instruction of program {:?}", &program_id);

  Ok(())
}
