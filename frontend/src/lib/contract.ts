import { Contract, Provider, constants } from 'starknet';

// Use local devnet for development
const DEVNET_URL = 'http://localhost:5050';
const provider = new Provider({ sequencer: { baseUrl: DEVNET_URL } });

// We'll update this after deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

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

export async function mintNFT(uri: string) {
    try {
        // Connect to user's wallet
        const wallet = await window.starknet?.enable();
        if (!wallet) throw new Error('No wallet connected');

        const provider = new Provider({ sequencer: { network: 'goerli-alpha' } });
        const contract = new Contract(abi, CONTRACT_ADDRESS!, provider);
        
        // Connect the contract to the user's wallet
        contract.connect(wallet);

        // Call mint function
        const result = await contract.mint(uri);
        await provider.waitForTransaction(result.transaction_hash);

        return {
            success: true,
            tokenId: result.token_id,
            transactionHash: result.transaction_hash
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
        const provider = new Provider({ sequencer: { network: 'goerli-alpha' } });
        const contract = new Contract(abi, CONTRACT_ADDRESS!, provider);
        
        const result = await contract.get_song_details(tokenId);
        return {
            success: true,
            owner: result.owner,
            uri: result.uri
        };
    } catch (error: any) {
        console.error('Error getting song details:', error);
        return {
            success: false,
            error: error.message
        };
    }
} 