use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Deserialize, Serialize)]
pub struct Reaction {
    id: String,
    created_at: f64,
    emotion: String,
    dialogue: String,
    animation: String,
    should_speak: bool,
    source_pid: u32,
    source_window_title: Option<String>,
}

impl Reaction {
    fn valid(&self, now: f64) -> bool {
        self.created_at.is_finite()
            && (0.0..30.0).contains(&(now - self.created_at))
            && !self.id.is_empty()
            && self.id.len() <= 128
            && self.dialogue.chars().count() <= 240
            && matches!(
                self.emotion.as_str(),
                "happy"
                    | "coding"
                    | "panic"
                    | "music"
                    | "jealous"
                    | "love"
                    | "concerned"
                    | "curious"
                    | "neutral"
            )
            && matches!(
                self.animation.as_str(),
                "idle" | "working" | "dancing" | "bounce"
            )
    }
}

#[tauri::command]
pub fn get_companion_reaction() -> Option<Reaction> {
    let runtime = std::env::var_os("XDG_RUNTIME_DIR")?;
    let runtime = std::path::PathBuf::from(runtime);
    let path = runtime.join("rodela-reaction.json");
    if std::fs::metadata(&path).ok()?.len() > 8192 {
        return None;
    }
    let reaction: Reaction = serde_json::from_slice(&std::fs::read(path).ok()?).ok()?;
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()?
        .as_secs_f64();
    let context: serde_json::Value =
        serde_json::from_slice(&std::fs::read(runtime.join("rodela-context.json")).ok()?).ok()?;
    if context.get("paused")?.as_bool()?
        || !(0.0..8.0).contains(&(now - context.get("captured_at")?.as_f64()?))
        || context.get("pid")?.as_u64()? != u64::from(reaction.source_pid)
        || context.get("window_title")?.as_str() != reaction.source_window_title.as_deref()
    {
        return None;
    }
    reaction.valid(now).then_some(reaction)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reject_stale_future_and_invalid_reactions() {
        let mut reaction = Reaction {
            id: "test".into(),
            created_at: 100.0,
            emotion: "coding".into(),
            dialogue: "dynamic reply".into(),
            animation: "working".into(),
            should_speak: true,
            source_pid: 123,
            source_window_title: Some("Editor".into()),
        };
        assert!(reaction.valid(110.0));
        assert!(!reaction.valid(131.0));
        assert!(!reaction.valid(99.0));
        reaction.emotion = "unsupported".into();
        assert!(!reaction.valid(110.0));
    }
}
