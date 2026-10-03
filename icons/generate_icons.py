import zlib
import struct
import os

def create_png(width, height, path):
    # Colors (RGBA): Dark navy background (#0d1b2a) with cyan circle (#38bdf8) and puck/sticks
    # Background: (13, 27, 42, 255)
    # Primary accent: (56, 189, 248, 255)
    # Gold/Accent: (245, 158, 11, 255)
    # White: (255, 255, 255, 255)
    
    raw_data = bytearray()
    cx, cy = width / 2, height / 2
    r_outer = width * 0.44
    r_inner = width * 0.40
    puck_r = width * 0.18

    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist_sq = dx * dx + dy * dy
            dist = dist_sq ** 0.5

            if dist > r_outer:
                # outside outer circle -> deep navy
                raw_data.extend([13, 27, 42, 255])
            elif dist > r_inner:
                # cyan ring
                raw_data.extend([56, 189, 248, 255])
            elif dist < puck_r:
                # center puck (dark slate with gold border)
                if dist > puck_r - (width * 0.03):
                    raw_data.extend([245, 158, 11, 255])
                else:
                    raw_data.extend([15, 23, 42, 255])
            elif abs(dx - dy) < (width * 0.05) or abs(dx + dy) < (width * 0.05):
                # crossed stick lines
                raw_data.extend([248, 250, 252, 255])
            else:
                # inner ring fill
                raw_data.extend([26, 35, 58, 255])

    # Compress IDAT
    compressed = zlib.compress(raw_data)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # PNG Header
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr_data))
    # IDAT
    png.extend(chunk(b'IDAT', compressed))
    # IEND
    png.extend(chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png)

create_png(192, 192, '/Volumes/Kingston DataTraveler Max Media/Code/hockey-stats-tracker/icons/icon-192.png')
create_png(512, 512, '/Volumes/Kingston DataTraveler Max Media/Code/hockey-stats-tracker/icons/icon-512.png')
create_png(180, 180, '/Volumes/Kingston DataTraveler Max Media/Code/hockey-stats-tracker/icons/apple-touch-icon.png')
print("Generated PNG icons successfully!")
