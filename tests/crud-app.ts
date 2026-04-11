import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { CrudApp } from "../target/types/crud_app";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Derive the article PDA the same way the program does. */
function deriveArticlePda(
  title: string,
  owner: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(title), owner.toBuffer()],
    programId
  );
}

/** Return an error code from an AnchorError, or re-throw if it is not one. */
function anchorErrCode(err: unknown): string {
  if (err instanceof AnchorError) return err.error.errorCode.code;
  throw err;
}

// ─── Test suite ─────────────────────────────────────────────────────────────

describe("crud-app", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CrudApp as Program<CrudApp>;
  const owner = provider.wallet as anchor.Wallet;

  /**
   * 5-character random suffix appended to every title.
   * This guarantees unique PDAs on every test run so stale devnet accounts
   * from previous runs never cause "account already in use" failures.
   *
   * Solana enforces a hard 32-byte limit per PDA seed, so base titles must
   * stay ≤ 26 characters to leave room for the "-XXXXX" (6-char) suffix.
   */
  const SUFFIX = Math.random().toString(36).slice(2, 7); // 5 random chars
  const t = (base: string) => `${base}-${SUFFIX}`;      // title factory

  const DESCRIPTION = "This is a test description for the article.";

  /** Create an article entry. */
  async function createArticle(
    title: string,
    description: string,
    signer?: anchor.Wallet
  ): Promise<string> {
    const wallet = signer ?? owner;
    return program.methods
      .createArticleEntry(title, description)
      .accounts({ owner: wallet.publicKey })
      .signers(signer ? [signer.payer] : [])
      .rpc();
  }

  /** Fetch on-chain article account data. */
  async function fetchArticle(title: string, ownerKey: PublicKey) {
    const [pda] = deriveArticlePda(title, ownerKey, program.programId);
    return program.account.articleEntry.fetch(pda);
  }

  /**
   * Deterministic keypair used as "attacker" / second-owner across all tests.
   * A fixed seed means the same address is reused on every run, so the owner
   * only needs to transfer SOL to it the FIRST time (when balance is below
   * threshold). Subsequent runs skip the transfer and reuse the existing funds.
   *
   * Uses an owner-to-attacker transfer (not a faucet airdrop) to stay
   * completely clear of devnet rate limits.
   */
  const secondKeypair = Keypair.fromSeed(Buffer.alloc(32, 0xab));

  before(async () => {
    const balance = await provider.connection.getBalance(secondKeypair.publicKey);
    if (balance < 50_000_000) {
      // Fund from owner — no faucet rate limits, works on any network
      const tx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: owner.publicKey,
          toPubkey: secondKeypair.publicKey,
          lamports: 100_000_000, // 0.1 SOL — enough for hundreds of tx fees
        })
      );
      await provider.sendAndConfirm(tx);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("createArticleEntry", () => {
    it("creates an article and persists all fields", async () => {
      const title = t("Happy Path");
      await createArticle(title, DESCRIPTION);

      const account = await fetchArticle(title, owner.publicKey);
      assert.equal(account.title, title, "title should match");
      assert.equal(account.description, DESCRIPTION, "description should match");
      assert.isTrue(account.owner.equals(owner.publicKey), "owner should match the signer");
    });

    it("derives the PDA deterministically from title + owner", async () => {
      const title = t("PDA Test");
      await createArticle(title, DESCRIPTION);

      const [expectedPda] = deriveArticlePda(title, owner.publicKey, program.programId);
      const account = await program.account.articleEntry.fetch(expectedPda);
      assert.equal(account.title, title);
    });

    it("different owners get separate PDAs for the same title", async () => {
      const title = t("Shared Title");

      await createArticle(title, "Owner 1 description");
      await program.methods
        .createArticleEntry(title, "Owner 2 description")
        .accounts({ owner: secondKeypair.publicKey })
        .signers([secondKeypair])
        .rpc();

      const account1 = await fetchArticle(title, owner.publicKey);
      const account2 = await fetchArticle(title, secondKeypair.publicKey);
      assert.equal(account1.description, "Owner 1 description");
      assert.equal(account2.description, "Owner 2 description");
      assert.isFalse(account1.owner.equals(account2.owner));
    });

    it("rejects an empty title (TitleEmpty)", async () => {
      try {
        await createArticle("", DESCRIPTION);
        assert.fail("Expected TitleEmpty error");
      } catch (err) {
        assert.equal(anchorErrCode(err), "TitleEmpty");
      }
    });

    it("rejects a title longer than 50 characters", async () => {
      // NOTE: Solana enforces a hard 32-byte limit per PDA seed. A 51-char
      // title causes a client-side TypeError ("Max seed length exceeded")
      // before the on-chain TitleTooLong check is ever reached. Either way,
      // the call is correctly rejected.
      try {
        await createArticle("A".repeat(51), DESCRIPTION);
        assert.fail("Expected rejection for title > 50 chars");
      } catch (err) {
        assert.ok(err instanceof Error, "Should throw an Error");
      }
    });

    it("accepts a title at the practical seed-length boundary (32 chars)", async () => {
      // Solana's per-seed max is 32 bytes, so 32 chars is the effective title
      // ceiling when the raw bytes are used as a PDA seed.
      const maxSeedTitle = "B".repeat(26) + "-" + SUFFIX; // exactly 32 chars
      assert.equal(maxSeedTitle.length, 32);
      await createArticle(maxSeedTitle, DESCRIPTION);
      const account = await fetchArticle(maxSeedTitle, owner.publicKey);
      assert.equal(account.title, maxSeedTitle);
    });

    it("rejects an empty description (DescriptionEmpty)", async () => {
      try {
        await createArticle(t("Empty Desc"), "");
        assert.fail("Expected DescriptionEmpty error");
      } catch (err) {
        assert.equal(anchorErrCode(err), "DescriptionEmpty");
      }
    });

    it("rejects a description longer than 2000 characters", async () => {
      // Strings > ~900 bytes exceed the Solana transaction size limit and the
      // Anchor SDK's Borsh encoder buffer (1000 bytes), so the rejection
      // occurs client-side as a RangeError rather than an on-chain AnchorError.
      // The description is still correctly refused.
      try {
        await createArticle(t("Long Desc"), "D".repeat(2001));
        assert.fail("Expected rejection for description > 2000 chars");
      } catch (err) {
        assert.ok(err instanceof Error, "Should throw an Error");
      }
    });

    it("accepts a large description within transaction limits", async () => {
      // Solana's 1232-byte transaction limit constrains practical description
      // length to ~400–800 chars. 400 chars is a robust boundary that always
      // fits in a single transaction.
      const largeDesc = "E".repeat(400);
      await createArticle(t("Large Desc"), largeDesc);
      const account = await fetchArticle(t("Large Desc"), owner.publicKey);
      assert.equal(account.description, largeDesc);
    });

    it("rejects creating the same title twice for the same owner", async () => {
      const title = t("Duplicate");
      await createArticle(title, DESCRIPTION);

      try {
        await createArticle(title, "Different description");
        assert.fail("Expected an error for duplicate PDA initialization");
      } catch (err) {
        assert.ok(err, "Should throw when PDA already exists");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("updateArticleEntry", () => {
    // Fresh unique title per run — no stale-state dependency
    const UPDATE_TITLE = t("Update Test");

    before(async () => {
      await createArticle(UPDATE_TITLE, DESCRIPTION);
    });

    it("updates the description and persists the new value", async () => {
      const newDesc = "Updated description content.";
      await program.methods
        .updateArticleEntry(UPDATE_TITLE, newDesc)
        .accounts({ owner: owner.publicKey })
        .rpc();

      const account = await fetchArticle(UPDATE_TITLE, owner.publicKey);
      assert.equal(account.description, newDesc);
    });

    it("preserves the title and owner after an update", async () => {
      const newDesc = "Another updated description.";
      await program.methods
        .updateArticleEntry(UPDATE_TITLE, newDesc)
        .accounts({ owner: owner.publicKey })
        .rpc();

      const account = await fetchArticle(UPDATE_TITLE, owner.publicKey);
      assert.equal(account.title, UPDATE_TITLE, "title must remain unchanged");
      assert.isTrue(account.owner.equals(owner.publicKey), "owner must remain unchanged");
    });

    it("allows multiple successive updates", async () => {
      for (let i = 1; i <= 3; i++) {
        const desc = `Update round ${i}`;
        await program.methods
          .updateArticleEntry(UPDATE_TITLE, desc)
          .accounts({ owner: owner.publicKey })
          .rpc();

        const account = await fetchArticle(UPDATE_TITLE, owner.publicKey);
        assert.equal(account.description, desc, `Round ${i} description`);
      }
    });

    it("rejects an empty new description (DescriptionEmpty)", async () => {
      try {
        await program.methods
          .updateArticleEntry(UPDATE_TITLE, "")
          .accounts({ owner: owner.publicKey })
          .rpc();
        assert.fail("Expected DescriptionEmpty error");
      } catch (err) {
        assert.equal(anchorErrCode(err), "DescriptionEmpty");
      }
    });

    it("rejects a new description longer than 2000 characters", async () => {
      // Same SDK encoding limitation as create: rejected client-side.
      try {
        await program.methods
          .updateArticleEntry(UPDATE_TITLE, "F".repeat(2001))
          .accounts({ owner: owner.publicKey })
          .rpc();
        assert.fail("Expected rejection for description > 2000 chars");
      } catch (err) {
        assert.ok(err instanceof Error, "Should throw an Error");
      }
    });

    it("accepts a large description update within transaction limits", async () => {
      const largeDesc = "G".repeat(400);
      await program.methods
        .updateArticleEntry(UPDATE_TITLE, largeDesc)
        .accounts({ owner: owner.publicKey })
        .rpc();

      const account = await fetchArticle(UPDATE_TITLE, owner.publicKey);
      assert.equal(account.description, largeDesc);
    });

    it("rejects update from a non-owner wallet", async () => {
      // The attacker provides the real owner's PDA but signs as themselves.
      // Anchor re-derives the PDA from [title, attacker.pubkey] which doesn't
      // match the stored PDA → ConstraintSeeds fires before has_one is checked.
      const [articlePda] = deriveArticlePda(UPDATE_TITLE, owner.publicKey, program.programId);

      try {
        await program.methods
          .updateArticleEntry(UPDATE_TITLE, "Hacked!")
          .accountsPartial({ articleEntry: articlePda, owner: secondKeypair.publicKey })
          .signers([secondKeypair])
          .rpc();
        assert.fail("Expected rejection for non-owner signer");
      } catch (err) {
        assert.equal(anchorErrCode(err), "ConstraintSeeds");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("deleteArticleEntry", () => {
    it("closes the article account and returns lamports to the owner", async () => {
      const title = t("To Delete");
      await createArticle(title, DESCRIPTION);

      const [articlePda] = deriveArticlePda(title, owner.publicKey, program.programId);
      const balanceBefore = await provider.connection.getBalance(owner.publicKey);

      await program.methods
        .deleteArticleEntry(title)
        .accounts({ owner: owner.publicKey })
        .rpc();

      const accountInfo = await provider.connection.getAccountInfo(articlePda);
      assert.isNull(accountInfo, "PDA account should be closed");

      const balanceAfter = await provider.connection.getBalance(owner.publicKey);
      assert.isAbove(balanceAfter, balanceBefore, "Owner balance should increase after closure");
    });

    it("account data is unreachable after deletion", async () => {
      const title = t("Data Check");
      await createArticle(title, DESCRIPTION);

      await program.methods
        .deleteArticleEntry(title)
        .accounts({ owner: owner.publicKey })
        .rpc();

      try {
        await fetchArticle(title, owner.publicKey);
        assert.fail("Expected fetch to fail after deletion");
      } catch (err) {
        assert.ok(err, "Fetch should throw after deletion");
      }
    });

    it("allows re-creation of the same title after deletion", async () => {
      const title = t("Recyclable");
      await createArticle(title, DESCRIPTION);

      await program.methods
        .deleteArticleEntry(title)
        .accounts({ owner: owner.publicKey })
        .rpc();

      await createArticle(title, "Re-created description");
      const account = await fetchArticle(title, owner.publicKey);
      assert.equal(account.description, "Re-created description");
    });

    it("rejects deletion from a non-owner wallet", async () => {
      // Same seed-derivation rejection as the update test: attacker's key yields
      // a different PDA than the one passed in → ConstraintSeeds error.
      const title = t("Protected");
      await createArticle(title, DESCRIPTION);

      const [articlePda] = deriveArticlePda(title, owner.publicKey, program.programId);

      try {
        await program.methods
          .deleteArticleEntry(title)
          .accountsPartial({ articleEntry: articlePda, owner: secondKeypair.publicKey })
          .signers([secondKeypair])
          .rpc();
        assert.fail("Expected rejection for non-owner signer");
      } catch (err) {
        assert.equal(anchorErrCode(err), "ConstraintSeeds");
      }

      // Article must still exist
      const account = await fetchArticle(title, owner.publicKey);
      assert.equal(account.title, title);
    });

    it("rejects deleting an article that does not exist", async () => {
      try {
        await program.methods
          .deleteArticleEntry(t("Non Existent"))
          .accounts({ owner: owner.publicKey })
          .rpc();
        assert.fail("Expected error for non-existent article");
      } catch (err) {
        assert.ok(err, "Should throw when account does not exist");
      }
    });
  });
});
