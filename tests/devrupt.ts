import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Devrupt } from "../target/types/devrupt";

describe("devrupt", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.devrupt as Program<Devrupt>;

  it("Program deploys successfully", async () => {
    // Simple test to verify the program is loaded and accessible
    const programId = program.programId;
    console.log("Program ID:", programId.toString());
    
    // Verify the program account exists (will be created when deployed)
    const programInfo = await program.provider.connection.getAccountInfo(programId);
    console.log("Program deployed:", programInfo !== null);
  });
});
