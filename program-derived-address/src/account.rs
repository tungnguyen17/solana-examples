use borsh::{
  BorshDeserialize,
  BorshSerialize
};

#[repr(C)]
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, PartialEq)]
pub struct InvokeAccount {
  pub count: u64,
  pub timestamp: i64,
}
