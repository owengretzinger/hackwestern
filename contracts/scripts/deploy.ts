import { Account, Contract, json, RpcProvider } from "starknet";
import * as fs from 'fs';

async function main() {
    // Connect to local devnet
    const provider = new RpcProvider({ nodeUrl: "http://localhost:5050" });
    
    // Use your funded ArgentX devnet wallet
    const privateKey = "0x02f3480efc48e0a1d8f106deebbf60bde5a53a1f7d063dd6d607c2a646148ff4";
    const accountAddress = "0x004d886f12de77D2397a50754A582ab2c4798100531B7744202C5f5beec11d4d";
    
    const account = new Account(provider, accountAddress, privateKey, "1");
    
    // Read the contract artifact
    const compiledContract = json.parse(fs.readFileSync('./target/dev/collaborative_song_nft_CollaborativeSongNFT.contract_class.json').toString('ascii'));
    
    console.log('Declaring contract...');
    const declareResponse = await account.declareIfNot({
        contract: compiledContract,
        classHash: compiledContract.class_hash,
    });
    
    console.log('Contract declared with class hash:', declareResponse.class_hash);
    
    console.log('Deploying contract...');
    const deployResponse = await account.deploy({
        classHash: declareResponse.class_hash,
        constructorCalldata: [],
    });
    
    console.log('Contract deployed at:', deployResponse.contract_address);
    
    // Save the contract address
    const envContent = `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${deployResponse.contract_address}\n`;
    fs.writeFileSync('../frontend/.env.local', envContent);
    
    console.log('Deployment complete! Contract address saved to frontend/.env.local');
}

main().catch(console.error); 