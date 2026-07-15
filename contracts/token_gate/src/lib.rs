#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    GateConfig(Symbol),    // room_id -> GateConfig
    Admin(Symbol),         // room_id -> Address
}

#[derive(Clone)]
#[contracttype]
pub struct GateConfig {
    pub token_asset_code: Symbol,
    pub token_asset_issuer: Address,
    pub min_balance: i128,
    pub is_native: bool,
}

#[contract]
pub struct TokenGate;

#[contractimpl]
impl TokenGate {
    /// Create a token gate for a room
    pub fn create_gate(
        env: Env,
        admin: Address,
        room_id: Symbol,
        token_asset_code: Symbol,
        token_asset_issuer: Address,
        min_balance: i128,
        is_native: bool,
    ) -> bool {
        admin.require_auth();

        let admin_key = DataKey::Admin(room_id.clone());
        if env.storage().instance().has(&admin_key) {
            panic!("Gate already exists for this room");
        }

        let config = GateConfig {
            token_asset_code,
            token_asset_issuer,
            min_balance,
            is_native,
        };

        env.storage().instance().set(&admin_key, &admin);

        let config_key = DataKey::GateConfig(room_id);
        env.storage().instance().set(&config_key, &config);

        true
    }

    /// Check if a user has access to a room based on token balance
    pub fn check_access(env: Env, user: Address, room_id: Symbol) -> bool {
        let config_key = DataKey::GateConfig(room_id);
        let config: GateConfig = env
            .storage()
            .instance()
            .get(&config_key)
            .unwrap_or_else(|| panic!("No gate configured for this room"));

        // In a real implementation, this would query the Stellar ledger
        // for the user's balance of the specified token.
        // For now, we return true as a placeholder.
        // The frontend will handle the actual balance check via Stellar SDK.
        let _ = (user, config, env);
        true
    }

    /// Update gate configuration (admin only)
    pub fn update_gate(
        env: Env,
        admin: Address,
        room_id: Symbol,
        new_min_balance: i128,
    ) -> bool {
        admin.require_auth();

        let admin_key = DataKey::Admin(room_id.clone());
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&admin_key)
            .unwrap_or_else(|| panic!("No gate for this room"));

        if admin != stored_admin {
            panic!("Only admin can update gate");
        }

        let config_key = DataKey::GateConfig(room_id);
        let mut config: GateConfig = env
            .storage()
            .instance()
            .get(&config_key)
            .unwrap();

        config.min_balance = new_min_balance;
        env.storage().instance().set(&config_key, &config);

        true
    }

    /// Remove token gate (admin only)
    pub fn remove_gate(env: Env, admin: Address, room_id: Symbol) -> bool {
        admin.require_auth();

        let admin_key = DataKey::Admin(room_id.clone());
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&admin_key)
            .unwrap_or_else(|| panic!("No gate for this room"));

        if admin != stored_admin {
            panic!("Only admin can remove gate");
        }

        env.storage().instance().remove(&admin_key);
        env.storage()
            .instance()
            .remove(&DataKey::GateConfig(room_id));

        true
    }
}
