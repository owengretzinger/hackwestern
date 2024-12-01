#[starknet::contract]
mod CollaborativeSongNFT {
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        owners: LegacyMap::<u256, ContractAddress>,
        token_uris: LegacyMap::<u256, felt252>,
        total_supply: u256
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        SongMinted: SongMinted,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SongMinted {
        token_id: u256,
        owner: ContractAddress,
        uri: felt252
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.total_supply.write(0);
    }

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        uri: felt252
    ) -> u256 {
        let caller = get_caller_address();
        let token_id = self.total_supply.read() + 1;

        // Store token data
        self.owners.write(token_id, caller);
        self.token_uris.write(token_id, uri);
        self.total_supply.write(token_id);

        // Emit events
        self.emit(Event::Transfer(Transfer {
            from: 0.try_into().unwrap(),
            to: caller,
            token_id,
        }));

        self.emit(Event::SongMinted(SongMinted {
            token_id,
            owner: caller,
            uri
        }));

        token_id
    }

    #[external(v0)]
    fn get_song_details(self: @ContractState, token_id: u256) -> (ContractAddress, felt252) {
        (
            self.owners.read(token_id),
            self.token_uris.read(token_id)
        )
    }
}