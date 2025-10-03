const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class TTSService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async generateSpeech(text, voice = 'default') {
    const platform = os.platform();
    
    try {
      if (platform === 'darwin') {
        // macOS - use built-in 'say' command
        return await this.generateSpeechMacOS(text, voice);
      } else if (platform === 'linux') {
        // Linux - try espeak if available
        return await this.generateSpeechLinux(text, voice);
      } else {
        // Windows or other - return null to fallback to client
        throw new Error('Server TTS not supported on this platform');
      }
    } catch (error) {
      console.log('Server TTS failed, client will use Web Speech API fallback');
      throw error;
    }
  }

  async generateSpeechMacOS(text, voice) {
    const outputFile = path.join(this.tempDir, `tts_${Date.now()}.aiff`);
    
    return new Promise((resolve, reject) => {
      // Use macOS 'say' command with audio output
      const sayProcess = spawn('say', [
        '-v', this.mapVoiceToMacOS(voice),
        '-o', outputFile,
        text
      ]);

      sayProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            const audioBuffer = await fs.readFile(outputFile);
            // Clean up temp file
            await fs.unlink(outputFile).catch(() => {});
            resolve(audioBuffer);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`say command exited with code ${code}`));
        }
      });

      sayProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async generateSpeechLinux(text, voice) {
    // Simple espeak implementation - most Linux systems have this
    return new Promise((resolve, reject) => {
      const espeak = spawn('espeak', ['-s', '150', text]);
      
      espeak.on('close', (code) => {
        if (code === 0) {
          // espeak doesn't generate files easily, so we'll just signal success
          // and let the client handle it with Web Speech API
          reject(new Error('Linux TTS completed but no audio file generated'));
        } else {
          reject(new Error(`espeak exited with code ${code}`));
        }
      });

      espeak.on('error', (error) => {
        reject(error);
      });
    });
  }

  mapVoiceToMacOS(voice) {
    // Map common voice names to macOS voices
    const voiceMap = {
      'Aaron': 'Aaron',
      'Alice': 'Alice', 
      'Samantha': 'Samantha',
      'default': 'Samantha'
    };
    
    return voiceMap[voice] || 'Samantha';
  }

  async getAvailableVoices() {
    const platform = os.platform();
    
    if (platform === 'darwin') {
      return this.getMacOSVoices();
    } else {
      // Return empty array for other platforms - will use Web Speech API
      return [];
    }
  }

  async getMacOSVoices() {
    return new Promise((resolve, reject) => {
      const sayProcess = spawn('say', ['-v', '?']);
      let output = '';

      sayProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      sayProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const voices = this.parseMacOSVoices(output);
            resolve(voices);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`say -v ? exited with code ${code}`));
        }
      });

      sayProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  parseMacOSVoices(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const voices = [];

    for (const line of lines) {
      // Parse macOS voice list format: "VoiceName    language    # description"
      const match = line.match(/^(\w+)\s+([a-z]{2}_[A-Z]{2})\s+#\s*(.+)/);
      if (match) {
        voices.push({
          name: match[1],
          locale: match[2],
          description: match[3]
        });
      }
    }

    return voices;
  }
}

module.exports = new TTSService();
