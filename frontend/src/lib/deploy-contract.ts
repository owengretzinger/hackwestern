import { Contract, Provider, Account, json } from 'starknet';

export async function deployCollaborativeSongNFT() {
  try {
    // Get the compiled contract
    const compiledContract = json.parse(CONTRACT_ARTIFACT);
    
    // Get the provider (ArgentX will inject this)
    const provider = new Provider({ sequencer: { network: 'goerli-alpha' } });
    
    // Get the user's account from ArgentX
    const connectedWallet = await window.starknet.enable();
    if (!connectedWallet) throw new Error('No wallet connected');
    
    const account = new Account(
      provider,
      connectedWallet.selectedAddress,
      connectedWallet
    );

    // Declare the contract class
    console.log('Declaring contract...');
    const declareResponse = await account.declare({
      contract: compiledContract,
      classHash: compiledContract.class_hash,
    });
    
    await provider.waitForTransaction(declareResponse.transaction_hash);
    console.log('Contract declared:', declareResponse);

    // Deploy an instance
    console.log('Deploying contract...');
    const deployResponse = await account.deploy({
      classHash: declareResponse.class_hash,
      constructorCalldata: [], // No constructor arguments needed
    });

    await provider.waitForTransaction(deployResponse.transaction_hash);
    console.log('Contract deployed at:', deployResponse.contract_address);

    return {
      success: true,
      contractAddress: deployResponse.contract_address,
      transactionHash: deployResponse.transaction_hash,
    };
  } catch (error) {
    console.error('Error deploying contract:', error);
    return {
      success: false,
      error: error.message,
    };
  }
} 