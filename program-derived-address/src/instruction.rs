use borsh::{
  BorshDeserialize,
  BorshSchema,
  BorshSerialize
};

#[repr(C)]
#[derive(BorshDeserialize, BorshSerialize, BorshSchema, Clone, Debug, PartialEq)]
pub enum CustomInstruction {
  CreateAccount {
    #[allow(dead_code)]
    seeds: Vec<u8>,
    #[allow(dead_code)]
    nonce: u8,
  }
}
