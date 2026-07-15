#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Proposals(Symbol),      // room_id -> Vec<Proposal>
    Votes(Symbol),          // proposal_id -> Vec<Vote>
    ProposalCount,
}

#[derive(Clone)]
#[contracttype]
pub struct Proposal {
    pub id: u32,
    pub room_id: Symbol,
    pub action: Symbol,        // "kick", "ban", "rule_change"
    pub target_user: Address,
    pub proposer: Address,
    pub votes_for: u32,
    pub votes_against: u32,
    pub executed: bool,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct Vote {
    pub voter: Address,
    pub support: bool,  // true = for, false = against
}

#[contract]
pub struct Governance;

#[contractimpl]
impl Governance {
    /// Create a new proposal
    pub fn propose(
        env: Env,
        proposer: Address,
        room_id: Symbol,
        action: Symbol,
        target_user: Address,
    ) -> u32 {
        proposer.require_auth();

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);

        let proposal = Proposal {
            id: count,
            room_id: room_id.clone(),
            action,
            target_user,
            proposer: proposer.clone(),
            votes_for: 0,
            votes_against: 0,
            executed: false,
            created_at: env.ledger().timestamp(),
        };

        let proposals_key = DataKey::Proposals(room_id);
        let mut proposals: Vec<Proposal> = env
            .storage()
            .persistent()
            .get(&proposals_key)
            .unwrap_or(Vec::new(&env));

        proposals.push_back(proposal);
        env.storage()
            .persistent()
            .set(&proposals_key, &proposals);

        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &(count + 1));

        count
    }

    /// Cast a vote on a proposal
    pub fn vote(
        env: Env,
        voter: Address,
        room_id: Symbol,
        proposal_index: u32,
        support: bool,
    ) -> bool {
        voter.require_auth();

        let proposals_key = DataKey::Proposals(room_id.clone());
        let mut proposals: Vec<Proposal> = env
            .storage()
            .persistent()
            .get(&proposals_key)
            .unwrap_or(Vec::new(&env));

        if proposal_index >= proposals.len() {
            panic!("Invalid proposal index");
        }

        let mut proposal = proposals.get(proposal_index).unwrap();

        if proposal.executed {
            panic!("Proposal already executed");
        }

        if support {
            proposal.votes_for += 1;
        } else {
            proposal.votes_against += 1;
        }

        // Store vote
        let vote = Vote {
            voter: voter.clone(),
            support,
        };

        let votes_key = DataKey::Votes(symbol_short!(&proposal.id.to_string()));
        let mut votes: Vec<Vote> = env
            .storage()
            .persistent()
            .get(&votes_key)
            .unwrap_or(Vec::new(&env));
        votes.push_back(vote);
        env.storage().persistent().set(&votes_key, &votes);

        // Update proposal
        proposals.set(proposal_index, proposal.clone());
        env.storage()
            .persistent()
            .set(&proposals_key, &proposals);

        // Check if majority reached (simple majority for now)
        proposal.votes_for > proposal.votes_against
    }

    /// Execute a proposal if majority reached
    pub fn execute(
        env: Env,
        room_id: Symbol,
        proposal_index: u32,
    ) -> bool {
        let proposals_key = DataKey::Proposals(room_id);
        let mut proposals: Vec<Proposal> = env
            .storage()
            .persistent()
            .get(&proposals_key)
            .unwrap_or(Vec::new(&env));

        if proposal_index >= proposals.len() {
            panic!("Invalid proposal index");
        }

        let mut proposal = proposals.get(proposal_index).unwrap();

        if proposal.executed {
            panic!("Proposal already executed");
        }

        if proposal.votes_for <= proposal.votes_against {
            panic!("Majority not reached");
        }

        proposal.executed = true;
        proposals.set(proposal_index, proposal);
        env.storage()
            .persistent()
            .set(&proposals_key, &proposals);

        // Emit event for frontend to handle actual enforcement
        env.events().publish(
            symbol_short!("EXECUTED"),
            (room_id, proposal_index),
        );

        true
    }

    /// Get proposal count
    pub fn get_proposal_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0)
    }
}
