"""Read Chromium RGB/RGBA PNG samples with Python standard library only."""
import json,struct,sys,zlib
raw=open(sys.argv[1],'rb').read()
assert raw[:8]==b'\x89PNG\r\n\x1a\n'
offset=8;compressed=b''
while offset<len(raw):
 size=struct.unpack('>I',raw[offset:offset+4])[0];kind=raw[offset+4:offset+8];chunk=raw[offset+8:offset+8+size];crc=struct.unpack('>I',raw[offset+8+size:offset+12+size])[0]
 assert zlib.crc32(kind+chunk)&0xffffffff==crc
 if kind==b'IHDR':width,height,bits,color,compression,filtering,interlace=struct.unpack('>IIBBBBB',chunk)
 if kind==b'IDAT':compressed+=chunk
 offset+=12+size
assert bits==8 and color in (2,6) and interlace==0
channels=3 if color==2 else 4;stride=width*channels;data=zlib.decompress(compressed);previous=bytearray(stride);rows=[];offset=0
for y in range(height):
 mode=data[offset];offset+=1;row=bytearray(data[offset:offset+stride]);offset+=stride
 for i in range(stride):
  left=row[i-channels] if i>=channels else 0;up=previous[i];corner=previous[i-channels] if i>=channels else 0
  if mode==0:predictor=0
  elif mode==1:predictor=left
  elif mode==2:predictor=up
  elif mode==3:predictor=(left+up)//2
  elif mode==4:
   p=left+up-corner;distances=[abs(p-left),abs(p-up),abs(p-corner)];predictor=[left,up,corner][distances.index(min(distances))]
  else:raise ValueError('Unsupported PNG filter')
  row[i]=(row[i]+predictor)&255
 rows.append(row);previous=row
points=json.loads(sys.argv[2]);print(json.dumps([list(rows[y][x*channels:x*channels+3]) for x,y in points]))
