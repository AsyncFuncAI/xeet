"""Convert Noto's open CBDT PNG strikes to the sbix format Xeet paints."""
import sys
from fontTools.ttLib import TTFont,newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph
font=TTFont(sys.argv[1])
if 'CBDT' not in font:
 if 'sbix' in font:sys.exit(0)
 raise ValueError('Expected Noto CBDT emoji font')
sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={}
for table,bitmap in zip(font['CBDT'].strikeData,font['CBLC'].strikes):
 strike=Strike(ppem=bitmap.bitmapSizeTable.ppemY,resolution=72)
 for name,glyph in table.items():
  glyph.ensureDecompiled()
  strike.glyphs[name]=Glyph(glyphName=name,originOffsetX=glyph.metrics.BearingX,originOffsetY=0,graphicType='png ',imageData=glyph.imageData)
 sbix.strikes[strike.ppem]=strike
font['sbix']=sbix;del font['CBDT'];del font['CBLC']
font.save(sys.argv[1])
