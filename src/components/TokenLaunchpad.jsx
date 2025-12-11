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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";

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
            setForm({ name: "", symbol: "", image: "", supply: "" }); // Reset form
        } catch (error) {
            console.error(error);
            alert("Token creation failed! Check console for details.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="w-full flex justify-center items-center p-4">
            <section className="flex flex-col items-center gap-8 w-full max-w-4xl py-12">
                <div className="page-heading animate-float">
                    <h1 className="text-center">Solana Token Launchpad</h1>
                    <p className="text-gray-400 text-lg max-w-xl text-center">
                        Launch your own Token-2022 on Solana with metadata in seconds.
                    </p>
                </div>

                <Card className="w-full max-w-4xl bg-dark-card/50 backdrop-blur-xl border-dark-border shadow-2xl">
                    <CardHeader>
                        <CardTitle>Token Details</CardTitle>
                        <CardDescription>Enter the specifications for your new token.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); createToken(); }} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Token Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="e.g. Super Solana"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="symbol">Symbol</Label>
                                <Input
                                    id="symbol"
                                    type="text"
                                    placeholder="e.g. SOL"
                                    value={form.symbol}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="image">Image URL</Label>
                                <Input
                                    id="image"
                                    type="url"
                                    placeholder="https://..."
                                    value={form.image}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="supply">Initial Supply</Label>
                                <Input
                                    id="supply"
                                    type="number"
                                    placeholder="1000000"
                                    value={form.supply}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || !wallet.publicKey}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : "Create Token"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
