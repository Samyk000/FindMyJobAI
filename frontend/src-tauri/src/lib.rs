use std::sync::Mutex;
use std::time::{Duration, Instant};
use std::thread;

use tauri::{Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

// ======================================================
// STATE
// ======================================================

/// Holds the backend child process handle for cleanup on exit.
struct BackendState {
    child: Mutex<Option<CommandChild>>,
}

// ======================================================
// HEALTH CHECK
// ======================================================

/// Check if the backend is responding on /health.
fn is_backend_healthy() -> bool {
    let client = match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    matches!(
        client.get("http://127.0.0.1:8000/health").send(),
        Ok(resp) if resp.status().is_success()
    )
}

/// Wait up to `timeout_secs` for the backend to become healthy.
fn wait_for_backend(timeout_secs: u64) -> bool {
    let start = Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    println!("[FindMyJobAI] Waiting for backend to start (timeout: {}s)...", timeout_secs);

    while start.elapsed() < timeout {
        if is_backend_healthy() {
            println!(
                "[FindMyJobAI] Backend ready in {:.1}s",
                start.elapsed().as_secs_f32()
            );
            return true;
        }
        thread::sleep(Duration::from_millis(500));
    }

    eprintln!("[FindMyJobAI] Backend did NOT start within {}s", timeout_secs);
    false
}

// ======================================================
// PORT CHECK
// ======================================================

/// Returns true if port 8000 is free (not in use).
fn is_port_available() -> bool {
    std::net::TcpListener::bind(("127.0.0.1", 8000)).is_ok()
}

// ======================================================
// RUN
// ======================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();

            // ----- Case 1: Backend already running (dev mode or second instance) -----
            if is_backend_healthy() {
                println!("[FindMyJobAI] Backend already running — reusing");
                app.manage(BackendState {
                    child: Mutex::new(None),
                });
                let _ = handle.emit("backend-ready", true);
                return Ok(());
            }

            // ----- Case 2: Port occupied by something else -----
            if !is_port_available() {
                eprintln!("[FindMyJobAI] Port 8000 is in use by another application!");
                let _ = handle.emit(
                    "backend-error",
                    "Port 8000 is already in use by another application. Please close it and restart FindMyJobAI.",
                );
                app.manage(BackendState {
                    child: Mutex::new(None),
                });
                return Ok(());
            }

            // ----- Case 3: Launch the sidecar -----
            println!("[FindMyJobAI] Starting backend sidecar...");

            let sidecar_cmd = app
                .shell()
                .sidecar("backend")
                .map_err(|e| {
                    eprintln!("[FindMyJobAI] Failed to create sidecar command: {}", e);
                    e
                })?;

            let (mut rx, child) = sidecar_cmd.spawn().map_err(|e| {
                eprintln!("[FindMyJobAI] Failed to spawn sidecar: {}", e);
                e
            })?;

            app.manage(BackendState {
                child: Mutex::new(Some(child)),
            });

            // Read stdout/stderr in background (prevents pipe buffer deadlock)
            let handle_for_output = handle.clone();
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let text = String::from_utf8_lossy(&line);
                            print!("[Backend] {}", text);
                        }
                        CommandEvent::Stderr(line) => {
                            let text = String::from_utf8_lossy(&line);
                            eprint!("[Backend] {}", text);
                        }
                        CommandEvent::Error(err) => {
                            eprintln!("[Backend Error] {}", err);
                            let _ = handle_for_output.emit(
                                "backend-error",
                                format!("Backend error: {}", err),
                            );
                        }
                        CommandEvent::Terminated(status) => {
                            eprintln!("[Backend] Process terminated: {:?}", status);
                            let _ = handle_for_output.emit(
                                "backend-error",
                                "Backend stopped unexpectedly. Please restart FindMyJobAI.",
                            );
                            break;
                        }
                        _ => {}
                    }
                }
            });

            // Wait for health check in a separate thread
            let handle_for_health = handle.clone();
            thread::spawn(move || {
                if wait_for_backend(45) {
                    let _ = handle_for_health.emit("backend-ready", true);
                } else {
                    let _ = handle_for_health.emit(
                        "backend-error",
                        "Backend failed to start within 45 seconds. Please restart FindMyJobAI.",
                    );
                }
            });

            Ok(())
        })
        // ----- Cleanup on window close -----
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                println!("[FindMyJobAI] Window closing — shutting down backend...");
                let state = window.app_handle().state::<BackendState>();

                if let Ok(mut guard) = state.child.lock() {
                    if let Some(child) = guard.take() {
                        match child.kill() {
                            Ok(_) => println!("[FindMyJobAI] Backend process killed"),
                            Err(e) => eprintln!("[FindMyJobAI] Failed to kill backend: {}", e),
                        }
                    } else {
                        println!("[FindMyJobAI] No sidecar to kill (was using external backend)");
                    }
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("Fatal: failed to run FindMyJobAI");
}
