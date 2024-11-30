#[starknet::contract]
mod CollaborativeNFT {
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        // Mapping from song ID to IPFS hash where the song is stored
        songs: LegacyMap::<u256, felt252>,
        // Mapping from song ID to array of participants
        participants: LegacyMap::<u256, Array<ContractAddress>>,
        // Current owner of each song
        owners: LegacyMap::<u256, ContractAddress>,
        // Total number of songs created
        total_songs: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        SongCreated: SongCreated,
        Transfer: Transfer,
    }

    #[derive(Drop, starknet::Event)]
    struct SongCreated {
        song_id: u256,
        ipfs_hash: felt252,
        participants: Array<ContractAddress>,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.total_songs.write(0);
    }

    #[external(v0)]
    fn create_song(
        ref self: ContractState,
        ipfs_hash: felt252,
        participants: Array<ContractAddress>
    ) -> u256 {
        let song_id = self.total_songs.read();
        
        // Store song data
        self.songs.write(song_id, ipfs_hash);
        self.participants.write(song_id, participants.clone());
        
        // Set initial owner (could be contract deployer or first participant)
        let owner = starknet::get_caller_address();
        self.owners.write(song_id, owner);

        // Emit event
        self.emit(Event::SongCreated(SongCreated {
            song_id,
            ipfs_hash,
            participants,
        }));

        // Increment total songs
        self.total_songs.write(song_id + 1);
        song_id
    }

    #[external(v0)]
    fn get_song_details(self: @ContractState, song_id: u256) -> (felt252, Array<ContractAddress>, ContractAddress) {
        (
            self.songs.read(song_id),
            self.participants.read(song_id),
            self.owners.read(song_id)
        )
    }

    #[external(v0)]
    fn transfer(ref self: ContractState, to: ContractAddress, token_id: u256) {
        assert(self.owners.read(token_id) == starknet::get_caller_address(), 'Not token owner');
        let from = self.owners.read(token_id);
        self.owners.write(token_id, to);
        
        self.emit(Event::Transfer(Transfer { from, to, token_id }));
    }
} 