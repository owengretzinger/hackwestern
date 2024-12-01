import axios from 'axios';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

if (!PINATA_JWT) {
  throw new Error('PINATA_JWT is not defined in environment variables');
}

async function uploadFileToPinata(file: Blob, name: string) {
  const formData = new FormData();
  formData.append('file', file, name);

  const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'multipart/form-data'
    },
    maxBodyLength: Infinity
  });

  return res.data.IpfsHash;
}

async function uploadJsonToPinata(json: any) {
  const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', json, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json'
    }
  });

  return res.data.IpfsHash;
}

export async function uploadToIPFS(audioUrl: string, metadata: any) {
  try {
    console.log('Fetching audio file...');
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    console.log('Uploading audio to IPFS...');
    const audioCid = await uploadFileToPinata(audioBlob, 'song.mp3');
    console.log('Audio uploaded, CID:', audioCid);

    // Update metadata with audio CID
    const metadataWithAudio = {
      ...metadata,
      animation_url: `ipfs://${audioCid}`
    };

    console.log('Uploading metadata to IPFS...');
    const metadataCid = await uploadJsonToPinata(metadataWithAudio);
    console.log('Metadata uploaded, CID:', metadataCid);

    return {
      audioIpfsHash: `ipfs://${audioCid}`,
      metadataIpfsHash: `ipfs://${metadataCid}`
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    if (axios.isAxiosError(error)) {
      console.error('Pinata API error:', error.response?.data);
    }
    throw error;
  }
} 