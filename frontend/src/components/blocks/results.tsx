"use client";

import { Song, useGameState, Verse } from "@/context/game-state";
import { TriangleAlertIcon } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { uploadToIPFS } from "@/lib/web3-storage";
import { deployCollaborativeSongNFT } from "@/lib/deploy-contract";
import { mintNFT } from "@/lib/contract";
import React from "react";

export default function Results() {
  const { gameState } = useGameState();
  const [minting, setMinting] = React.useState(false);
  const [tokenId, setTokenId] = React.useState<number>();

  const handleMintNFT = async () => {
    if (!gameState.song) return;

    try {
      setMinting(true);
      
      // Upload to IPFS
      const { metadataIpfsHash } = await uploadToIPFS(
        gameState.song.url,
        {
          name: "Collaborative Song",
          description: "A song created from collaborative drawings",
          image: gameState.song.cover,
          animation_url: gameState.song.url,
          attributes: {
            genre: gameState.song.genre,
            verses: gameState.song.verses
          }
        }
      );
      
      // Mint NFT with the IPFS metadata URI
      const result = await mintNFT(metadataIpfsHash);
      if (result.success) {
        setTokenId(result.tokenId);
        // TODO: Show success message
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      // TODO: Show error message
    } finally {
      setMinting(false);
    }
  };

  if (gameState.isLoadingSong) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2  ">
        <div className="flex gap-2">
          <div className="h-4 animate-bounce [animation-delay:-0.3s]">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
          <div className="h-4 animate-bounce [animation-delay:-0.15s]">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
          <div className="h-4 animate-bounce">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
        </div>
        <p className="font-semibold leading-none tracking-tight">
          {gameState.allPlayersSubmitted
            ? "Processing your masterpiece"
            : "Waiting for others to finish drawing"}
        </p>
      </div>
    );
  }

  if (!gameState.song) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-destructive">
          <TriangleAlertIcon className="h-5 w-5" />
          <p className="font-semibold leading-none tracking-tight">
            Failed to load results
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl my-20 mx-auto flex flex-col gap-12">
          <SongCard song={gameState.song} />
          <div className="flex flex-col gap-12 items-center sm:items-start">
            {gameState.song.verses.map((verse, index) => (
              <VerseDisplay key={index} index={index} verse={verse} />
            ))}
          </div>
        </div>
      </div>
      <Button
        onClick={handleMintNFT}
        disabled={minting}
        className="fixed bottom-4 right-4 shadow-lg"
      >
        {minting ? 'Minting...' : tokenId ? `Minted #${tokenId}` : 'Mint as NFT'}
      </Button>
    </>
  );
}

const SongCard = ({ song }: { song: Song }) => {
  return (
    <Card className="flex flex-col sm:flex-row items-center border-none shadow-none">
      <div className="w-[150px] h-[150px] rounded-lg aspect-square shadow-lg">
        <Image
          src={song.cover}
          alt="Generated song image"
          width={150}
          height={150}
          className="object-cover rounded-lg w-[150px] h-full"
        />
      </div>
      <div>
        <CardHeader>
          <CardTitle>Song Title</CardTitle>
          <CardDescription>{song.genre}</CardDescription>
        </CardHeader>
        <CardContent>
          <audio src={song.url} controls className="" />
        </CardContent>
      </div>
    </Card>
  );
};

const VerseDisplay = ({ verse, index }: { verse: Verse; index: number }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
      <div className="w-full sm:w-[200px] sm:h-[200px] aspect-square border rounded-lg bg-white shadow-md flex justify-center items-center self-center">
        <Image
          src={verse.image}
          alt="Generated verse image"
          width={300}
          height={300}
          className="object-contain rounded-lg max-w-full max-h-full"
        />
      </div>
      <div className="flex flex-col">
        <h3 className="font-bold">
          Verse {index + 1} ({verse.author})
        </h3>
        <p className="whitespace-pre-wrap">{verse.lyrics}</p>
      </div>
    </div>
  );
};
