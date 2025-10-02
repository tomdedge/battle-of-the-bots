const fs = require('fs');
const path = require('path');
const https = require('https');

class ImageCacheService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../public/avatars');
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async cacheProfileImage(userId, imageUrl) {
    if (!imageUrl) return null;

    const filename = `${userId}.jpg`;
    const filepath = path.join(this.cacheDir, filename);
    
    // Return cached path if already exists
    if (fs.existsSync(filepath)) {
      return `/avatars/${filename}`;
    }

    try {
      await this.downloadImage(imageUrl, filepath);
      return `/avatars/${filename}`;
    } catch (error) {
      console.error('Failed to cache profile image:', error);
      return imageUrl; // Fallback to original URL
    }
  }

  downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filepath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', reject);
      }).on('error', reject);
    });
  }
}

module.exports = new ImageCacheService();