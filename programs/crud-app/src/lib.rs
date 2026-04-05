use anchor_lang::prelude::*;

declare_id!("C2jQxSe2fxmWr92eRUPmn14w2MPn6kj4y2GmnLKa3tT3");

#[program]
pub mod crud_app {
    use super::*;

    pub fn create_article_entry(ctx: Context<CreateEntry>, title: String, description: String) -> Result<()> {
        let article_entry = &mut ctx.accounts.article_entry;
        article_entry.owner = *ctx.accounts.owner.key;
        article_entry.title = title;
        article_entry.description = description;

        Ok(())
    }

    pub fn update_article_entry(ctx: Context<UpdateEntry>, title: String, description: String) -> Result<()> {
        let article_entry = &mut ctx.accounts.article_entry;
        article_entry.description = description;

        Ok(())
    }

    pub fn delete_article_entry(ctx: Context<DeleteEntry>, title: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateEntry<'info> {
    #[account(
        init,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        space = 8 + ArticleEntryState::INIT_SPACE,
        payer = owner,
    )]
    pub article_entry: Account<'info, ArticleEntryState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateEntry<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        realloc = 8 + ArticleEntryState::INIT_SPACE,
        realloc::payer = owner,
        realloc::zero = true,
    )]
    pub article_entry: Account<'info, ArticleEntryState>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteEntry<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        close = owner,
    )]
    pub article_entry: Account<'info, ArticleEntryState>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct ArticleEntryState {
    pub owner: Pubkey,
    #[max_len(50)]
    pub title: String,
    #[max_len(2000)]
    pub description: String,
}