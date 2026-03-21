use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;

// --- Data Structures ---

#[derive(Clone, Debug, PartialEq)]
pub enum Symbol {
    Cherry, Banana, Lemon, Orange, Grape, Strawberry, Apple, Watermelon, Star, Five, Wild
}

#[derive(Clone, Debug)]
pub struct SymbolData {
    pub id: String, // Unique ID for frontend animations
    pub name: Symbol,
}

pub type Grid = Vec<Vec<SymbolData>>;

#[derive(Clone, Debug)]
pub struct CascadeStep {
    pub grid: Grid,
    pub winning_lines: Vec<Vec<usize>>, // [row, col, row, col, row, col]
    pub step_win: u64,
    pub multiplier: u32,
}

#[derive(Clone, Debug)]
pub struct SpinReceipt {
    pub initial_grid: Grid,
    pub cascades: Vec<CascadeStep>,
    pub total_win: u64,
    pub free_spins_awarded: u32,
    pub jackpot_won: bool,
}

// --- Constants ---

const LINES: [[[usize; 2]; 3]; 8] = [
    [[0,0], [0,1], [0,2]], [[1,0], [1,1], [1,2]], [[2,0], [2,1], [2,2]], // Horizontals
    [[0,0], [1,0], [2,0]], [[0,1], [1,1], [2,1]], [[0,2], [1,2], [2,2]], // Verticals
    [[0,0], [1,1], [2,2]], [[2,0], [1,1], [0,2]]                         // Diagonals
];

// --- Engine Implementation ---

pub struct SlotEngine;

impl SlotEngine {
    /// Main entry point for the game algorithm. 
    /// Takes a 32-byte seed from the blockchain VRF, the bet amount, and held columns.
    pub fn play_spin(
        seed: [u8; 32], 
        bet: u64, 
        held_cols: Vec<bool>, 
        previous_grid: &Grid
    ) -> Result<SpinReceipt, String> {
        
        // --- BACKEND VALIDATION LOGIC ---
        if held_cols.len() != 3 {
            return Err("Invalid hold configuration: must specify exactly 3 columns.".to_string());
        }

        let held_count = held_cols.iter().filter(|&&h| h).count();
        if held_count > 2 {
            return Err("Cannot hold all 3 columns. Maximum 2 columns can be held.".to_string());
        }

        if held_count > 0 {
            if previous_grid.len() != 3 || previous_grid.iter().any(|col| col.len() != 3) {
                return Err("Cannot hold columns without a valid previous spin grid.".to_string());
            }
            // Note: In a real backend, you would also validate that the `bet` matches the previous spin's bet.
        }
        // --------------------------------

        let mut prng = ChaCha20Rng::from_seed(seed);
        
        // 1. Generate Initial Grid
        let mut current_grid = Self::generate_initial_grid(&mut prng, &held_cols, previous_grid);
        let initial_grid_clone = current_grid.clone();
        
        let mut cascades = Vec::new();
        let mut total_win = 0;
        let mut multiplier = 1;
        let mut free_spins_awarded = 0;
        let mut jackpot_won = false;

        // 2. Synchronous Cascade Loop
        loop {
            let (step_win, winning_lines, won_jackpot) = 
                Self::evaluate_grid(&current_grid, bet, multiplier);
            
            if winning_lines.is_empty() {
                break; // No wins, end cascade sequence
            }

            total_win += step_win;
            if won_jackpot { jackpot_won = true; }

            // Apply gravity and fill empty spaces
            let next_grid = Self::apply_gravity_and_refill(&current_grid, &winning_lines, &mut prng);

            cascades.push(CascadeStep {
                grid: next_grid.clone(),
                winning_lines,
                step_win,
                multiplier,
            });

            current_grid = next_grid;
            multiplier += 1;

            // Safety break
            if cascades.len() > 50 { break; }
        }

        Ok(SpinReceipt {
            initial_grid: initial_grid_clone,
            cascades,
            total_win,
            free_spins_awarded,
            jackpot_won,
        })
    }

    // --- Helper Methods ---

    fn generate_initial_grid(prng: &mut ChaCha20Rng, held_cols: &[bool], prev_grid: &Grid) -> Grid {
        let mut grid = vec![vec![]; 3];
        for r in 0..3 {
            for c in 0..3 {
                if held_cols.get(c).copied().unwrap_or(false) && !prev_grid.is_empty() {
                    grid[r].push(prev_grid[r][c].clone());
                } else {
                    grid[r].push(Self::draw_symbol(prng));
                }
            }
        }
        grid
    }

    fn evaluate_grid(grid: &Grid, bet: u64, multiplier: u32) -> (u64, Vec<Vec<usize>>, bool) {
        let mut step_win = 0;
        let mut winning_lines = Vec::new();
        let mut jackpot_won = false;

        // Check lines
        for line in LINES.iter() {
            let s1 = &grid[line[0][0]][line[0][1]].name;
            let s2 = &grid[line[1][0]][line[1][1]].name;
            let s3 = &grid[line[2][0]][line[2][1]].name;

            let mut winning_symbol = None;
            let mut is_win = true;

            for s in [s1, s2, s3] {
                if *s != Symbol::Wild {
                    if let Some(ref ws) = winning_symbol {
                        if ws != s { is_win = false; break; }
                    } else {
                        winning_symbol = Some(s.clone());
                    }
                }
            }

            if is_win {
                let win_sym = winning_symbol.unwrap_or(Symbol::Wild);
                let payout = Self::get_payout(&win_sym);
                step_win += bet * payout * (multiplier as u64);
                
                if win_sym == Symbol::Five { jackpot_won = true; }
                
                winning_lines.push(vec![
                    line[0][0], line[0][1],
                    line[1][0], line[1][1],
                    line[2][0], line[2][1],
                ]);
            }
        }

        (step_win, winning_lines, jackpot_won)
    }

    fn apply_gravity_and_refill(
        grid: &Grid, 
        winning_lines: &[Vec<usize>], 
        prng: &mut ChaCha20Rng
    ) -> Grid {
        let mut new_grid = grid.clone();
        let mut to_remove = vec![vec![false; 3]; 3];

        for line in winning_lines {
            for i in (0..line.len()).step_by(2) {
                to_remove[line[i]][line[i+1]] = true;
            }
        }

        for c in 0..3 {
            let mut remaining = Vec::new();
            for r in 0..3 {
                if !to_remove[r][c] {
                    remaining.push(grid[r][c].clone());
                }
            }
            
            let needed = 3 - remaining.len();
            let mut new_col = Vec::new();
            for _ in 0..needed {
                new_col.push(Self::draw_symbol(prng));
            }
            new_col.extend(remaining);

            for r in 0..3 {
                new_grid[r][c] = new_col[r].clone();
            }
        }

        new_grid
    }

    fn draw_symbol(prng: &mut ChaCha20Rng) -> SymbolData {
        // Simplified weight logic for example
        let rand_val = prng.gen_range(0..1000);
        let name = if rand_val < 420 { Symbol::Cherry }
            else if rand_val < 640 { Symbol::Banana }
            else { Symbol::Wild }; // ... full paytable logic here

        SymbolData {
            id: format!("{:x}", prng.gen::<u64>()), // Unique ID
            name
        }
    }

    fn get_payout(sym: &Symbol) -> u64 {
        match sym {
            Symbol::Cherry => 1,
            Symbol::Banana => 2,
            Symbol::Five => 1000,
            Symbol::Wild => 2000,
            _ => 0,
        }
    }
}
