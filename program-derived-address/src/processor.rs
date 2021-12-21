use crate::{
  error::{
    CustomError,
  },
  instruction::{
    CustomInstruction
  },
};
use borsh::{
  BorshDeserialize,
};
use solana_program::{
  account_info::{
    AccountInfo
  },
  entrypoint::{
    ProgramResult,
  },
  msg,
  pubkey::{
    Pubkey,
  },
};

pub struct Processor {}

impl Processor {

  pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
    let instruction = CustomInstruction::try_from_slice(input)?;
    match instruction {
      CustomInstruction::CreateAccount {
        seeds,
        nonce,
      } => {
        msg!("{:?} {:?}", &seeds, &nonce);
        Ok(())
      }
      _ => return Err(CustomError::InvalidInstruction.into()),
    }
  }
}
