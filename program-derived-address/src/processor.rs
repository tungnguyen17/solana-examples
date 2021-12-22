use crate::{
  instruction::{
    CustomInstruction
  },
};
use borsh::{
  BorshDeserialize,
};
use solana_program::{
  account_info::{
    next_account_info,
    AccountInfo
  },
  entrypoint::{
    ProgramResult,
  },
  msg,
  program,
  pubkey::{
    Pubkey,
  },
  system_instruction,
  sysvar::{
    clock::{
      Clock,
    },
    rent::{
      Rent,
   },
   Sysvar,
  },
};

pub struct Processor {}

impl Processor {

  fn process_create_account(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    seeds: Vec<u8>,
    nonce: u8,
    space: u16,
  ) -> ProgramResult {
    msg!("Processor::process_create_account");

    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let pda_account_info = next_account_info(account_info_iter)?;
    let rent_sysvar_info = next_account_info(account_info_iter)?;
    let rent: Rent = Rent::from_account_info(&rent_sysvar_info)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let lamports = rent.minimum_balance(space.into());

    let instruction = system_instruction::create_account(
      &payer_account_info.key,
      &pda_account_info.key,
      lamports,
      space.into(),
      &program_id,
    );

    program::invoke_signed(
      &instruction,
      &[
        payer_account_info.clone(),
        pda_account_info.clone(),
        system_program_info.clone(),
      ],
      &[&[&seeds[..], &[nonce]]],
    )?;

    Ok(())
  }

  pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
  ) -> ProgramResult {
    let instruction = CustomInstruction::try_from_slice(input)
      .expect("Invalid instruction");
    match instruction {
      CustomInstruction::CreateAccount {
        seeds,
        nonce,
        space,
      } => {
        Self::process_create_account(
          &program_id,
          &accounts,
          seeds,
          nonce,
          space
        )
      },
    }
  }
}
