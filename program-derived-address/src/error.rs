use solana_program::{
  decode_error:: {
    DecodeError,
  },
  program_error::{
    ProgramError,
  },
};
use thiserror::{
  Error
};

#[derive(Clone, Debug, Eq, Error, PartialEq)]
pub enum CustomError {
    #[error("Invalid instruction")]
    InvalidInstruction,
}

impl From<CustomError> for ProgramError {
  fn from(e: CustomError) -> Self {
      ProgramError::Custom(e as u32)
  }
}
impl<T> DecodeError<T> for CustomError {
  fn type_of() -> &'static str {
      "CustomError"
  }
}
