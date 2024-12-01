import { Contract, Provider, AccountInterface, constants, TransactionFinalityStatus, num } from 'starknet';
import { saveNFTMapping, getNFTMapping, getNextTokenId } from './firebase';

// Use local devnet
const provider = new Provider({ sequencer: { baseUrl: 'http://localhost:5050' } });

// Use the deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS is not defined in environment variables');
}

const abi = [
    {
        "name": "mint",
        "type": "function",
        "inputs": [
            {
                "name": "uri",
                "type": "felt252"
            }
        ],
        "outputs": [
            {
                "name": "token_id",
                "type": "u256"
            }
        ]
    },
    {
        "name": "get_song_details",
        "type": "function",
        "inputs": [
            {
                "name": "token_id",
                "type": "u256"
            }
        ],
        "outputs": [
            {
                "name": "owner",
                "type": "ContractAddress"
            },
            {
                "name": "uri",
                "type": "felt252"
            }
        ]
    }
];

function stringToFelt252(str: string): string {
    // Convert string to hex, padding each character to 2 digits
    const hex = Array.from(str)
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
    return '0x' + hex;
}

export async function mintNFT(metadataUri: string, audioUri: string) {
    try {
        // Connect to user's wallet
        const wallet = await window.starknet?.enable();
        if (!wallet || !wallet[0]) throw new Error('No wallet connected');

        // Get next token ID from Firebase
        const tokenId = await getNextTokenId();
        console.log('Creating NFT with:', { 
            tokenId,
            metadata: metadataUri,
            audio: audioUri
        });

        // Create contract instance
        const contract = new Contract(abi, CONTRACT_ADDRESS as string, provider);
        
        // Connect the contract to the user's wallet account
        const account = wallet[0] as unknown as AccountInterface;
        contract.connect(account);

        // Create a simple identifier and convert to felt252 hex
        const simpleId = `nft${tokenId}`;
        const feltValue = stringToFelt252(simpleId);
        console.log('Using felt252 value:', feltValue);

        // Call mint with minimal parameters
        const { transaction_hash } = await contract.mint(
            feltValue,
            { 
                maxFee: BigInt('900000000000000')
            }
        );
        
        console.log('Transaction submitted:', transaction_hash);
        console.log('Waiting for transaction to be mined (this may take a while)...');
        
        // Wait for transaction with a longer timeout
        const receipt = await provider.waitForTransaction(transaction_hash);
        console.log('Transaction mined:', receipt);

        // Save mapping to Firebase
        await saveNFTMapping(
            tokenId.toString(),
            audioUri.replace('ipfs://', ''),
            metadataUri.replace('ipfs://', '')
        );

        console.log('Saved mapping to Firebase:', {
            tokenId: tokenId.toString(),
            audio: audioUri,
            metadata: metadataUri
        });

        return {
            success: true,
            transactionHash: transaction_hash,
            tokenId: tokenId.toString()
        };
    } catch (error: any) {
        console.error('Error minting NFT:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getSongDetails(tokenId: number) {
    try {
        if (!CONTRACT_ADDRESS) {
            throw new Error('CONTRACT_ADDRESS is not defined');
        }
        const contract = new Contract(abi, CONTRACT_ADDRESS, provider);
        
        const result = await contract.get_song_details(tokenId);

        // Get mapping from Firebase
        const mapping = await getNFTMapping(tokenId.toString());
        if (!mapping) {
            throw new Error(`No mapping found for token ID ${tokenId}`);
        }

        return {
            success: true,
            owner: result.owner,
            metadataUri: `ipfs://${mapping.metadataCid}`,
            audioUri: `ipfs://${mapping.ipfsCid}`
        };
    } catch (error: any) {
        console.error('Error getting song details:', error);
        return {
            success: false,
            error: error.message
        };
    }
} 