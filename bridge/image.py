import sys,io,json,base64
from PIL import Image,ImageOps
try:
 from pillow_heif import register_heif_opener
 register_heif_opener()
except ImportError:pass
Image.MAX_IMAGE_PIXELS=40000000
im=ImageOps.exif_transpose(Image.open(io.BytesIO(sys.stdin.buffer.read())))
size=160 if len(sys.argv)>1 and sys.argv[1]=='avatar' else 1200
im.thumbnail((size,size))
b=io.BytesIO()
if im.mode in ('RGBA','LA'):
 im=im.convert('RGBA');im.save(b,format='PNG',optimize=True)
else:
 im=im.convert('RGB');im.save(b,format='JPEG',quality=85,optimize=True)
print(json.dumps({'width':im.width,'height':im.height,'data':base64.b64encode(b.getvalue()).decode()}))
