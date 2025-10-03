-- Add TTS preferences to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tts_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tts_voice VARCHAR(100) DEFAULT 'default';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tts_rate DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tts_pitch DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tts_provider VARCHAR(20) DEFAULT 'web';