use anchor_lang::prelude::*;

declare_id!("3HghJSSrCCTuW63nhMintkNatfMsqEFgUAGvJNHtADMa");

#[program]
pub mod article_registry {
    use super::*;

    /// Creates a new article entry as a PDA seeded by [title, owner].
    /// The owner pays for rent and is permanently stored on the account.
    /// Title and published_date are immutable after creation.
    pub fn create_article_entry(
        ctx: Context<CreateEntry>,
        title: String,
        description: String,
        content: String,
        references: Vec<String>,
    ) -> Result<()> {
        // Validate inputs before writing any state
        require!(!title.is_empty(), ArticleError::TitleEmpty);
        require!(title.len() <= 50, ArticleError::TitleTooLong);
        require!(!description.is_empty(), ArticleError::DescriptionEmpty);
        require!(description.len() <= 2000, ArticleError::DescriptionTooLong);
        require!(!content.is_empty(), ArticleError::ContentEmpty);
        require!(content.len() <= 5000, ArticleError::ContentTooLong);
        require!(references.len() <= 5, ArticleError::TooManyReferences);
        for r in &references {
            require!(r.len() <= 200, ArticleError::ReferenceTooLong);
        }

        let article_entry = &mut ctx.accounts.article_entry;
        article_entry.owner = ctx.accounts.owner.key();
        article_entry.title = title;
        article_entry.description = description;
        article_entry.content = content;
        article_entry.references = references;
        article_entry.published_date = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Updates the mutable fields of an existing article entry.
    /// The `_title` parameter is intentionally unused in the function body —
    /// it is only required by the `UpdateEntry` accounts struct to derive the
    /// correct PDA via the `#[instruction(title)]` attribute. Title and
    /// published_date are immutable because title forms part of the PDA seed.
    pub fn update_article_entry(
        ctx: Context<UpdateEntry>,
        title: String,
        description: String,
        content: String,
        references: Vec<String>,
    ) -> Result<()> {
        require!(!description.is_empty(), ArticleError::DescriptionEmpty);
        require!(description.len() <= 2000, ArticleError::DescriptionTooLong);
        require!(!content.is_empty(), ArticleError::ContentEmpty);
        require!(content.len() <= 5000, ArticleError::ContentTooLong);
        require!(references.len() <= 5, ArticleError::TooManyReferences);
        for r in &references {
            require!(r.len() <= 200, ArticleError::ReferenceTooLong);
        }

        let article_entry = &mut ctx.accounts.article_entry;
        article_entry.description = description;
        article_entry.content = content;
        article_entry.references = references;

        Ok(())
    }

    /// Closes the article entry account and returns all lamports to the owner.
    /// The `_title` parameter is only needed to derive and verify the correct
    /// PDA; the `close = owner` constraint handles the actual lamport transfer.
    pub fn delete_article_entry(_ctx: Context<DeleteEntry>, title: String) -> Result<()> {
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

    /// Short abstract / summary of the article. Max 2000 characters.
    #[max_len(2000)]
    pub description: String,

    /// Full article content / body. Max 5000 characters.
    #[max_len(5000)]
    pub content: String,

    /// Optional reference URLs or citations. Up to 5 entries, each max 200 characters.
    #[max_len(5, 200)]
    pub references: Vec<String>,

    /// Unix timestamp (seconds) set at creation time. Immutable after creation.
    pub published_date: i64,
}

/// Custom error codes for the article-registry program.
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

    #[msg("Content cannot be empty")]
    ContentEmpty,

    #[msg("Content exceeds the maximum length of 5000 characters")]
    ContentTooLong,

    #[msg("References list exceeds the maximum of 5 entries")]
    TooManyReferences,

    #[msg("A reference entry exceeds the maximum length of 200 characters")]
    ReferenceTooLong,

    #[msg("You are not authorized to modify or delete this article")]
    Unauthorized,
}
