import { NFTStorage, File } from 'nft.storage';

const NFT_STORAGE_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY;

if (!NFT_STORAGE_KEY) {
  throw new Error('NFT_STORAGE_KEY is not defined in environment variables');
}

const client = new NFTStorage({ token: NFT_STORAGE_KEY });

export async function uploadToIPFS(audioUrl: string, metadata: any) {
  try {
    // First, fetch the audio file
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Create an audio file with proper name and type
    const audioFile = new File([audioBlob], 'song.mp3', { type: 'audio/mpeg' });

    // Create a metadata file
    const metadataFile = new File(
      [JSON.stringify(metadata, null, 2)],
      'metadata.json',
      { type: 'application/json' }
    );

    // Store files and get IPFS CID (Content Identifier)
    console.log('Uploading to IPFS...');
    const audioCid = await client.storeBlob(audioFile);
    console.log('Audio uploaded, CID:', audioCid);

    // Update metadata with audio CID
    metadata.animation_url = `ipfs://${audioCid}`;
    const updatedMetadataFile = new File(
      [JSON.stringify(metadata, null, 2)],
      'metadata.json',
      { type: 'application/json' }
    );

    // Store metadata
    const metadataCid = await client.storeBlob(updatedMetadataFile);
    console.log('Metadata uploaded, CID:', metadataCid);

    return {
      audioIpfsHash: `ipfs://${audioCid}`,
      metadataIpfsHash: `ipfs://${metadataCid}`
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
} 