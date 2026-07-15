#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Reputation(Address),
    TotalReputation,
}

#[derive(Clone)]
#[contracttype]
pub struct ReputationData {
    pub score: i128,
    pub messages_sent: u32,
    pub rooms_created: u32,
    pub last_active: u64,
}

#[contract]
pub struct Reputation;

#[contractimpl]
impl Reputation {
    /// Initialize or get a user's reputation
    pub fn get_reputation(env: Env, user: Address) -> ReputationData {
        let key = DataKey::Reputation(user);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(ReputationData {
                score: 0,
                messages_sent: 0,
                rooms_created: 0,
                last_active: 0,
            })
    }

    /// Award reputation for sending a message (+1 point)
    pub fn award_message(env: Env, user: Address) -> i128 {
        let key = DataKey::Reputation(user.clone());
        let mut data: ReputationData = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(ReputationData {
                score: 0,
                messages_sent: 0,
                rooms_created: 0,
                last_active: 0,
            });

        data.messages_sent += 1;
        data.score += 1;
        data.last_active = env.ledger().timestamp();

        env.storage().persistent().set(&key, &data);
        data.score
    }

    /// Award reputation for creating a room (+5 points)
    pub fn award_room_creation(env: Env, user: Address) -> i128 {
        let key = DataKey::Reputation(user.clone());
        let mut data: ReputationData = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(ReputationData {
                score: 0,
                messages_sent: 0,
                rooms_created: 0,
                last_active: 0,
            });

        data.rooms_created += 1;
        data.score += 5;
        data.last_active = env.ledger().timestamp();

        env.storage().persistent().set(&key, &data);
        data.score
    }

    /// Manual reputation award (admin use)
    pub fn award_points(env: Env, user: Address, points: i128) -> i128 {
        let key = DataKey::Reputation(user.clone());
        let mut data: ReputationData = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(ReputationData {
                score: 0,
                messages_sent: 0,
                rooms_created: 0,
                last_active: 0,
            });

        data.score += points;
        data.last_active = env.ledger().timestamp();

        env.storage().persistent().set(&key, &data);
        data.score
    }

    /// Get total reputation across all users
    pub fn get_total_reputation(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalReputation)
            .unwrap_or(0)
    }
}
