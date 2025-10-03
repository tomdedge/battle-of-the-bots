const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async createUser(googleProfile, tokens) {
    const query = `
      INSERT INTO users (google_id, email, name, picture, access_token, refresh_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (google_id) 
      DO UPDATE SET 
        access_token = $5,
        refresh_token = $6,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      googleProfile.id,
      googleProfile.emails[0].value,
      googleProfile.displayName,
      googleProfile.photos?.[0]?.value,
      tokens.accessToken,
      tokens.refreshToken
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getUserByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await this.pool.query(query, [googleId]);
    return result.rows[0];
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async saveChatMessage(userId, message, response, model, sessionId = null) {
    const query = `
      INSERT INTO chat_messages (user_id, message, response, model, session_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [userId, message, response, model, sessionId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getChatHistory(userId, limit = 50, offset = 0) {
    const query = `
      SELECT id, message, response, model, timestamp, session_id
      FROM chat_messages 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.reverse(); // Return chronological order
  }

  async clearChatHistory(userId) {
    const query = 'DELETE FROM chat_messages WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  async deleteChatMessage(userId, messageId) {
    const query = 'DELETE FROM chat_messages WHERE user_id = $1 AND id = $2';
    await this.pool.query(query, [userId, messageId]);
  }

  // NEW MESSAGES TABLE METHODS
  async saveMessage(userId, content, sender, model = null, sessionId = null, conversationId = null) {
    const query = `
      INSERT INTO messages (user_id, content, sender, model, session_id, conversation_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [userId, content, sender, model, sessionId, conversationId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getMessages(userId, limit = 50, offset = 0) {
    const query = `
      SELECT id, content, sender, model, timestamp, session_id, conversation_id, reply_to_id
      FROM messages 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.reverse(); // Return chronological order
  }

  async deleteMessage(userId, messageId) {
    const query = 'DELETE FROM messages WHERE user_id = $1 AND id = $2';
    await this.pool.query(query, [userId, messageId]);
  }

  async clearMessages(userId) {
    const query = 'DELETE FROM messages WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  // Conversion helper for backward compatibility
  convertMessagesToChatHistory(messages) {
    const chatHistory = [];
    let currentChat = null;
    
    for (const msg of messages) {
      if (msg.sender === 'user') {
        // Start new chat entry
        currentChat = {
          id: msg.id,
          message: msg.content,
          response: null,
          model: null,
          timestamp: msg.timestamp,
          session_id: msg.session_id
        };
        chatHistory.push(currentChat);
      } else if (msg.sender === 'aurora' && currentChat) {
        // Add response to current chat
        currentChat.response = msg.content;
        currentChat.model = msg.model;
      } else if (msg.sender === 'aurora' && !currentChat) {
        // Standalone Aurora message (inject_aurora_message case)
        chatHistory.push({
          id: msg.id,
          message: '', // Empty user message
          response: msg.content,
          model: msg.model,
          timestamp: msg.timestamp,
          session_id: msg.session_id
        });
      }
    }
    
    return chatHistory;
  }

  async getUserPreferences(userId) {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateUserPreferences(userId, preferences) {
    const query = `
      INSERT INTO user_preferences (user_id, preferred_model, theme, tts_enabled, tts_voice, tts_rate, tts_pitch)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        preferred_model = COALESCE(EXCLUDED.preferred_model, user_preferences.preferred_model),
        theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
        tts_enabled = COALESCE(EXCLUDED.tts_enabled, user_preferences.tts_enabled),
        tts_voice = COALESCE(EXCLUDED.tts_voice, user_preferences.tts_voice),
        tts_rate = COALESCE(EXCLUDED.tts_rate, user_preferences.tts_rate),
        tts_pitch = COALESCE(EXCLUDED.tts_pitch, user_preferences.tts_pitch),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      userId, 
      preferences.preferred_model, 
      preferences.theme,
      preferences.tts_enabled,
      preferences.tts_voice,
      preferences.tts_rate,
      preferences.tts_pitch
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateUserTokens(userId, tokens) {
    const query = `
      UPDATE users 
      SET access_token = $2, refresh_token = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [userId, tokens.access_token, tokens.refresh_token];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new DatabaseService();