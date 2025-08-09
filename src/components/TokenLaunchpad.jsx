import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    TOKEN_2022_PROGRAM_ID,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    TYPE_SIZE,
    LENGTH_SIZE,
    ExtensionType,
    getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { useState } from "react";

export function TokenLaunchpad() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        symbol: "",
        image: "",
        supply: ""
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    async function createToken() {
        if (!wallet.publicKey) {
            alert("Please connect your wallet");
            return;
        }
        setLoading(true);

        try {
            const mintKeypair = Keypair.generate();
            const metadata = {
                mint: mintKeypair.publicKey,
                name: form.name.trim(),
                symbol: form.symbol.trim().toUpperCase().slice(0, 10),
                uri: form.image.trim(),
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    9,
                    wallet.publicKey,
                    null,
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                })
            );

            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mintKeypair);
            const sig1 = await wallet.sendTransaction(transaction, connection, { signers: [mintKeypair] });
            await connection.confirmTransaction({ signature: sig1, ...(await connection.getLatestBlockhash()) }, 'confirmed');

            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID
            );

            const tx2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID
                )
            );
            tx2.feePayer = wallet.publicKey;
            tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            const sig2 = await wallet.sendTransaction(tx2, connection);
            await connection.confirmTransaction({ signature: sig2, ...(await connection.getLatestBlockhash()) }, 'confirmed');

            const tx3 = new Transaction().add(
                createMintToInstruction(
                    mintKeypair.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    Number(form.supply) * 10 ** 9,
                    [],
                    TOKEN_2022_PROGRAM_ID
                )
            );
            tx3.feePayer = wallet.publicKey;
            tx3.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            const sig3 = await wallet.sendTransaction(tx3, connection);
            await connection.confirmTransaction({ signature: sig3, ...(await connection.getLatestBlockhash()) }, 'confirmed');

            alert(`Token created at ${mintKeypair.publicKey.toBase58()}`);
        } catch (error) {
            console.error(error);
            alert("Token creation failed!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen w-full">
            <section className="main-section w-full">
                <div className="page-heading">
                    <h1>Solana Token Launchpad</h1>
                    <p className="text-dark-200 max-w-xl">
                        Create and mint your own Token-2022 with metadata instantly.
                    </p>
                </div>

                <div className="w-full max-w-2xl">
                    <div className="gradient-border rounded-2xl">
                        <div className="bg-white rounded-2xl p-8 shadow-lg">
                            <form onSubmit={(e) => { e.preventDefault(); createToken(); }}>
                                <div className="form-div">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="e.g. My Token"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="symbol">Symbol</label>
                                    <input
                                        id="symbol"
                                        type="text"
                                        placeholder="e.g. MTK"
                                        value={form.symbol}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="image">Image URL</label>
                                    <input
                                        id="image"
                                        type="url"
                                        placeholder="https://..."
                                        value={form.image}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="supply">Initial Supply</label>
                                    <input
                                        id="supply"
                                        type="number"
                                        placeholder="1000"
                                        value={form.supply}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <button type="submit" className="auth-button" disabled={loading}>
                                    {loading ? "Creating..." : "Create Token"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
