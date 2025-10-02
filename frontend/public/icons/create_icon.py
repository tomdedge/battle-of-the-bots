import struct
import zlib

def create_png(width, height, color):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr = struct.pack('>2I5B', width, height, 8, 2, 0, 0, 0)
    png += struct.pack('>I', 13) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr) & 0xffffffff)
    
    # IDAT chunk - solid color
    row = bytes([color[0], color[1], color[2]] * width)
    data = b''.join([b'\x00' + row for _ in range(height)])
    compressor = zlib.compressobj()
    compressed = compressor.compress(data) + compressor.flush()
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    
    # IEND chunk
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    
    return png

# Create icons
with open('icon-192x192.png', 'wb') as f:
    f.write(create_png(192, 192, (99, 102, 241)))  # #6366f1

with open('icon-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, (99, 102, 241)))  # #6366f1

print("Icons created successfully")
