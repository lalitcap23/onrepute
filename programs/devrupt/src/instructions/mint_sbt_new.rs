use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{mint_to, MintTo};
use mpl_token_metadata::types::DataV2;

#[derive(Accounts)]
#[instruction(cid: String)]
pub struct MintSbt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer.key(),
        mint::freeze_authority = payer.key(),
        mint::token_program = token_program,
        seeds = [b"mint", payer.key().as_ref()],
        bump,
    )]
    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program,
    )]
    pub token_account: InterfaceAccount<'info, anchor_spl::token_interface::TokenAccount>,

    /// CHECK: Metadata account derived from mint
    #[account(
        mut,
        seeds = [
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        seeds::program = mpl_token_metadata::ID
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: This is the Token Metadata Program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<MintSbt>, cid: String) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let token_account = &ctx.accounts.token_account;

    // Mint 1 SBT to user's token account
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: mint.to_account_info(),
                to: token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        1,
    )?;

    // Create metadata
    let data_v2 = DataV2 {
        name: format!("Soulbound Cert {}", cid),
        symbol: "SBT".to_string(),
        uri: format!("https://gateway.pinata.cloud/ipfs/{}", cid),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    // Create metadata using direct instruction call
    let instruction = mpl_token_metadata::instructions::create_metadata_account_v3(
        mpl_token_metadata::ID,
        ctx.accounts.metadata.key(),
        ctx.accounts.mint.key(),
        ctx.accounts.payer.key(),
        ctx.accounts.payer.key(),
        ctx.accounts.payer.key(),
        data_v2.name,
        data_v2.symbol,
        data_v2.uri,
        data_v2.creators,
        data_v2.seller_fee_basis_points,
        false,
        true,
        data_v2.collection,
        data_v2.uses,
        None,
    );

    anchor_lang::solana_program::program::invoke(
        &instruction,
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    Ok(())
}
