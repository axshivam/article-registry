use anchor_lang::prelude::*;

declare_id!("C2jQxSe2fxmWr92eRUPmn14w2MPn6kj4y2GmnLKa3tT3");

#[program]
pub mod crud_app {
    use super::*;

    /// Creates a new article entry as a PDA seeded by [title, owner].
    /// The owner pays for rent and is permanently stored on the account.
    /// Title is immutable after creation since it is part of the PDA seed.
     pub fn create_article_entry(
        ctx: Context<CreateEntry>,
        title: String,
        description: String,
    ) -> Result<()> {
        // Validate inputs before writing any state
        require!(!title.is_empty(), ArticleError::TitleEmpty);
        require!(title.len() <= 50, ArticleError::TitleTooLong);
        require!(!description.is_empty(), ArticleError::DescriptionEmpty);
        require!(description.len() <= 2000, ArticleError::DescriptionTooLong);

        let article_entry = &mut ctx.accounts.article_entry;
        article_entry.owner = ctx.accounts.owner.key();
        article_entry.title = title;
        article_entry.description = description;

        Ok(())
    }

    /// Updates the description of an existing article entry.
    /// The `_title` parameter is intentionally unused in the function body —
    /// it is only required by the `UpdateEntry` accounts struct to derive the
    /// correct PDA via the `#[instruction(title)]` attribute. Title itself is
    /// immutable because changing it would yield a different PDA address.
    pub fn update_article_entry(
        ctx: Context<UpdateEntry>,
        _title: String,
        description: String,
    ) -> Result<()> {
        // Validate the new description before overwriting stored data
        require!(!description.is_empty(), ArticleError::DescriptionEmpty);
        require!(description.len() <= 2000, ArticleError::DescriptionTooLong);

        let article_entry = &mut ctx.accounts.article_entry;
        article_entry.description = description;

        Ok(())
    }

    /// Closes the article entry account and returns all lamports to the owner.
    /// The `_title` parameter is only needed to derive and verify the correct
    /// PDA; the `close = owner` constraint handles the actual lamport transfer.
    pub fn delete_article_entry(_ctx: Context<DeleteEntry>, _title: String) -> Result<()> {
        Ok(())
    }
}

/// Accounts required to create a new article entry.
#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateEntry<'info> {
    /// The article PDA account, initialized fresh.
    /// Seeded by [title, owner] to ensure each owner has a unique entry per title.
    /// Space is calculated using `ArticleEntry::INIT_SPACE` plus the 8-byte discriminator.
    #[account(
        init,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        space = 8 + ArticleEntry::INIT_SPACE,
        payer = owner,
    )]
    pub article_entry: Account<'info, ArticleEntry>,

    /// The signer who creates and owns this article. Pays for account rent.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Required by Anchor to initialize the PDA account.
    pub system_program: Program<'info, System>,
}

/// Accounts required to update an existing article entry.
#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateEntry<'info> {
    /// The existing article PDA, derived from the same [title, owner] seeds.
    /// `has_one = owner` ensures the signer matches the stored owner field,
    /// preventing any other wallet from modifying this entry.
    /// No `realloc` needed because `max_len` allocates the maximum size upfront.
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        has_one = owner @ ArticleError::Unauthorized,
    )]
    pub article_entry: Account<'info, ArticleEntry>,

    /// Must match `article_entry.owner`; enforced by the `has_one` constraint above.
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// Accounts required to delete (close) an article entry.
#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteEntry<'info> {
    /// The article PDA to close. The `close = owner` constraint transfers all
    /// remaining lamports back to the owner and zeroes the account data.
    /// `has_one = owner` ensures only the original creator can delete this entry.
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        close = owner,
        has_one = owner @ ArticleError::Unauthorized,
    )]
    pub article_entry: Account<'info, ArticleEntry>,

    /// Receives the reclaimed lamports from the closed account.
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// On-chain state stored for each article entry.
#[account]
#[derive(InitSpace)]
pub struct ArticleEntry {
    /// The public key of the wallet that created and owns this article.
    pub owner: Pubkey,

    /// The article title. Max 50 characters.
    /// Immutable after creation — it forms part of the PDA seed.
    #[max_len(50)]
    pub title: String,

    /// The article body / description. Max 2000 characters.
    #[max_len(2000)]
    pub description: String,
}

/// Custom error codes for the crud-app program.
/// Anchor assigns codes starting at 6000 for user-defined errors.
#[error_code]
pub enum ArticleError {
    #[msg("Title cannot be empty")]
    TitleEmpty,

    #[msg("Title exceeds the maximum length of 50 characters")]
    TitleTooLong,

    #[msg("Description cannot be empty")]
    DescriptionEmpty,

    #[msg("Description exceeds the maximum length of 2000 characters")]
    DescriptionTooLong,

    #[msg("You are not authorized to modify or delete this article")]
    Unauthorized,
}
