const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class TTSService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
    this.edgeTTSAvailable = null; // Cache availability check
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async checkEdgeTTSAvailability() {
    if (this.edgeTTSAvailable !== null) {
      return this.edgeTTSAvailable;
    }

    return new Promise((resolve) => {
      // Try edge-tts command first
      const edgeTTS = spawn('edge-tts', ['--help']);
      
      edgeTTS.on('close', (code) => {
        if (code === 0) {
          this.edgeTTSAvailable = true;
          this.edgeTTSCommand = 'edge-tts';
          console.log(`edge-tts availability: ${this.edgeTTSAvailable}`);
          resolve(this.edgeTTSAvailable);
        } else {
          // Try python module fallback
          const pythonTTS = spawn('python3', ['-m', 'edge_tts', '--help']);
          pythonTTS.on('close', (pythonCode) => {
            this.edgeTTSAvailable = pythonCode === 0;
            this.edgeTTSCommand = pythonCode === 0 ? ['python3', '-m', 'edge_tts'] : null;
            console.log(`edge-tts availability: ${this.edgeTTSAvailable} (using ${this.edgeTTSCommand})`);
            resolve(this.edgeTTSAvailable);
          });
          pythonTTS.on('error', () => {
            this.edgeTTSAvailable = false;
            console.log('edge-tts not available, will use fallback');
            resolve(false);
          });
        }
      });

      edgeTTS.on('error', () => {
        // Try python module fallback
        const pythonTTS = spawn('python3', ['-m', 'edge_tts', '--help']);
        pythonTTS.on('close', (pythonCode) => {
          this.edgeTTSAvailable = pythonCode === 0;
          this.edgeTTSCommand = pythonCode === 0 ? ['python3', '-m', 'edge_tts'] : null;
          console.log(`edge-tts availability: ${this.edgeTTSAvailable} (using python module)`);
          resolve(this.edgeTTSAvailable);
        });
        pythonTTS.on('error', () => {
          this.edgeTTSAvailable = false;
          console.log('edge-tts not available, will use fallback');
          resolve(false);
        });
      });
    });
  }

  async generateSpeech(text, voice = 'en-US-AriaNeural') {
    console.log('🎤 TTS generateSpeech called with voice:', voice);
    
    // Check if edge-tts is available
    const edgeAvailable = await this.checkEdgeTTSAvailability();
    console.log('🎤 Edge-TTS available:', edgeAvailable);
    
    if (edgeAvailable) {
      try {
        console.log('🎤 Attempting Edge-TTS generation...');
        return await this.generateSpeechEdgeTTS(text, voice);
      } catch (error) {
        console.log('🎤 Edge-TTS failed, trying system TTS:', error.message);
      }
    }

    // Fallback to system TTS
    const platform = os.platform();
    console.log('🎤 Trying system TTS on platform:', platform);
    if (platform === 'darwin') {
      return await this.generateSpeechMacOS(text, voice);
    }
    
    // If no TTS available, throw error to trigger client fallback
    throw new Error('No server TTS available');
  }

  async generateSpeechEdgeTTS(text, voice) {
    const outputFile = path.join(this.tempDir, `tts_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
      const args = [
        '--voice', voice,
        '--text', text,
        '--write-media', outputFile
      ];
      
      const edgeTTS = Array.isArray(this.edgeTTSCommand) 
        ? spawn(this.edgeTTSCommand[0], [...this.edgeTTSCommand.slice(1), ...args])
        : spawn(this.edgeTTSCommand, args);

      let stderr = '';
      edgeTTS.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      edgeTTS.on('close', async (code) => {
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
          reject(new Error(`edge-tts failed with code ${code}: ${stderr}`));
        }
      });

      edgeTTS.on('error', (error) => {
        reject(error);
      });
    });
  }

  async generateSpeechMacOS(text, voice) {
    const outputFile = path.join(this.tempDir, `tts_${Date.now()}.aiff`);
    
    return new Promise((resolve, reject) => {
      const sayProcess = spawn('say', [
        '-v', this.mapVoiceToMacOS(voice),
        '-o', outputFile,
        text
      ]);

      sayProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            const audioBuffer = await fs.readFile(outputFile);
            await fs.unlink(outputFile).catch(() => {});
            resolve(audioBuffer);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`say command failed with code ${code}`));
        }
      });

      sayProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  mapVoiceToMacOS(voice) {
    const voiceMap = {
      'en-US-AriaNeural': 'Samantha',
      'en-US-JennyNeural': 'Samantha',
      'Samantha': 'Samantha',
      'Alice': 'Alice',
      'default': 'Samantha'
    };
    
    return voiceMap[voice] || 'Samantha';
  }

  async getAvailableVoices() {
    const edgeAvailable = await this.checkEdgeTTSAvailability();
    
    if (edgeAvailable) {
      return this.getEdgeTTSVoices();
    }
    
    const platform = os.platform();
    if (platform === 'darwin') {
      return this.getMacOSVoices();
    }
    
    return [];
  }

  async getEdgeTTSVoices() {
    return new Promise((resolve, reject) => {
      const args = ['--list-voices'];
      const edgeTTS = Array.isArray(this.edgeTTSCommand) 
        ? spawn(this.edgeTTSCommand[0], [...this.edgeTTSCommand.slice(1), ...args])
        : spawn(this.edgeTTSCommand, args);
      let output = '';

      edgeTTS.stdout.on('data', (data) => {
        output += data.toString();
      });

      edgeTTS.on('close', (code) => {
        if (code === 0) {
          try {
            const voices = this.parseEdgeTTSVoices(output);
            resolve(voices);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`edge-tts list-voices failed with code ${code}`));
        }
      });

      edgeTTS.on('error', (error) => {
        reject(error);
      });
    });
  }

  parseEdgeTTSVoices(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const voices = [];

    for (const line of lines) {
      // Parse edge-tts voice list format
      const match = line.match(/Name: (.+?), ShortName: (.+?), Gender: (.+?), Locale: (.+)/);
      if (match) {
        voices.push({
          name: match[2], // Use ShortName for compatibility
          fullName: match[1],
          gender: match[3],
          locale: match[4]
        });
      }
    }

    return voices;
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
          reject(new Error(`say -v ? failed with code ${code}`));
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
