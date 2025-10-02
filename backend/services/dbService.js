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
      INSERT INTO users (google_id, email, name, access_token, refresh_token)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (google_id) 
      DO UPDATE SET 
        access_token = $4,
        refresh_token = $5,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      googleProfile.id,
      googleProfile.emails[0].value,
      googleProfile.displayName,
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
      SELECT message, response, model, timestamp, session_id
      FROM chat_messages 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.reverse(); // Return chronological order
  }

  async getUserPreferences(userId) {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateUserPreferences(userId, preferences) {
    const query = `
      INSERT INTO user_preferences (user_id, preferred_model, theme)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        preferred_model = COALESCE($2, preferred_model),
        theme = COALESCE($3, theme),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [userId, preferences.preferred_model, preferences.theme];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new DatabaseService();