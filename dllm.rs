use std::{thread, time::Duration};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

const DLLM: &str = "屌你老母";

fn main() {
    // 
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();
    
    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
    }).expect("Error setting Ctrl+C handler");

    println!("=== DLLM Module v0.1.0 ===\n");

    let mut rage_level: u64 = 1;

    while running.load(Ordering::SeqCst) {
        let display_count = rage_level.min(512) as usize;
        let output = DLLM.repeat(display_count);

        println!("[RAGE LV.{}] {}", rage_level, output);

        rage_level = rage_level.saturating_add(rage_level);

        thread::sleep(Duration::from_millis(200));
    }


    println!("\n\nAGI have no soul.\n");
}