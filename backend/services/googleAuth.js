const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const dbService = require('./dbService');

class GoogleAuthService {
  constructor() {
    this.initializeStrategy();
  }

  initializeStrategy() {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      accessType: 'offline',
      prompt: 'consent',
      includeGrantedScopes: true,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks']
    }, this.handleGoogleCallback.bind(this)));
  }

  async handleGoogleCallback(accessToken, refreshToken, profile, done) {
    try {
      console.log('Google OAuth callback received:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        profileId: profile.id
      });
      
      if (!refreshToken) {
        console.warn('No refresh token received from Google. This may cause authentication issues.');
      }
      
      // Store user and tokens in database
      const user = await dbService.createUser(profile, { accessToken, refreshToken });
      return done(null, user);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return done(error, null);
    }
  }

  generateJWT(user) {
    return jwt.sign(
      { 
        userId: user.id, // Use database ID, not Google ID
        googleId: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new GoogleAuthService();