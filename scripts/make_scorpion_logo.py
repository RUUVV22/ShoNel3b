from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import math, random

root=Path(__file__).resolve().parent.parent
source=root/'assets'/'game-logos'/'werewolf_logo.png'
img=Image.open(source).convert('RGB')
s=3
w,h=img.size
base=img.resize((w*s,h*s),Image.Resampling.LANCZOS).convert('RGBA')
panel=Image.new('RGBA',base.size,(0,0,0,0))
d=ImageDraw.Draw(panel)

def P(xy):
    return tuple(round(c*s) for c in xy)

# Night-sky medallion replaces the wolf painting while retaining the original
# wood-and-parchment branding frame below.
d.ellipse(P((195,14,521,241)),fill='#122435',outline='#A96931',width=4*s)
d.ellipse(P((205,22,511,236)),outline='#D3A15C',width=2*s)
d.ellipse(P((348,42,486,182)),fill='#F8DA9A')
d.ellipse(P((356,50,478,174)),fill='#F7DDA9')
random.seed(8)
for _ in range(22):
    x=random.randint(227,492);y=random.randint(33,192)
    if 357<x<480 and 48<y<176: continue
    r=random.randint(1,2)*s
    d.ellipse((x*s-r,y*s-r,x*s+r,y*s+r),fill='#EFB85E')

navy='#10212D'; outline='#E39C47'; warm='#E5B06B'
# Eight articulated scorpion legs (four on each side), drawn with bright edges.
legs=[
 [(336,174),(304,170),(280,183),(271,210)],
 [(337,180),(299,188),(280,208),(273,221)],
 [(344,186),(322,201),(310,220)],
 [(353,188),(347,209),(340,228)],
 [(392,175),(419,180),(437,196),(445,214)],
 [(389,181),(420,201),(434,224)],
 [(382,191),(388,212),(397,230)],
 [(372,191),(371,215),(365,232)],
]
for leg in legs:
 d.line([P(pt) for pt in leg],fill=navy,width=15*s,joint='curve')
 d.line([P(pt) for pt in leg],fill='#D58D43',width=3*s,joint='curve')
# Large claws facing out and upward.
for x,y,reverse in [(286,144,False),(441,150,True)]:
 d.line([P((352 if not reverse else 385,161)),P((x,y))],fill=navy,width=14*s)
 d.ellipse(P((x-19,y-18,x+19,y+15)),fill=navy,outline=outline,width=3*s)
 if not reverse:
  d.polygon([P((x-16,y-2)),P((x-35,y-34)),P((x-30,y+6)),P((x-14,y+15))],fill=navy)
  d.polygon([P((x+12,y-3)),P((x+24,y-30)),P((x+34,y+1)),P((x+13,y+10))],fill=navy)
 else:
  d.polygon([P((x+16,y-2)),P((x+35,y-34)),P((x+30,y+6)),P((x+14,y+15))],fill=navy)
  d.polygon([P((x-12,y-3)),P((x-24,y-30)),P((x-34,y+1)),P((x-13,y+10))],fill=navy)
# Body and head
d.ellipse(P((334,143,412,211)),fill=navy,outline=outline,width=4*s)
d.ellipse(P((347,111,401,159)),fill=navy,outline=outline,width=3*s)
for x,y in [(362,134),(384,134)]:
 d.ellipse(P((x-6,y-4,x+6,y+4)),fill='#F97535')
d.arc(P((350,173,402,203)),190,340,fill=warm,width=4*s)
# Segmented rising tail curling right around the moon, ending in sharp stinger.
tail=[(397,188),(434,174),(461,155),(475,124),(466,94),(447,80),(429,86)]
d.line([P(pt) for pt in tail],fill=navy,width=30*s,joint='curve')
d.line([P(pt) for pt in tail],fill=outline,width=4*s,joint='curve')
for x,y in tail[1:-1]:
 d.ellipse(P((x-13,y-13,x+13,y+13)),outline='#E2A659',width=3*s)
d.polygon([P((418,77)),P((429,68)),P((442,79)),P((429,98)),P((411,104))],fill=navy)
d.polygon([P((418,78)),P((411,104)),P((427,95))],fill='#E75A3C')
# Fine moonlit highlights for body and claws.
d.arc(P((346,115,392,164)),205,305,fill=warm,width=3*s)
for pos in [(260,74),(295,48),(502,92)]:
 x,y=pos
 d.line([P((x-5,y)),P((x+5,y))],fill='#E9BD7D',width=2*s)
 d.line([P((x,y-5)),P((x,y+5))],fill='#E9BD7D',width=2*s)
base=Image.alpha_composite(base,panel)

# Retain the original ribbon, conceal the old English text within its beige
# inner area, then typeset the new English branding.
d=ImageDraw.Draw(base)
d.polygon([P((267,406)),P((292,396)),P((483,399)),P((510,412)),P((504,449)),P((282,449)),P((270,437))],fill='#E5BB79')
d.arc(P((266,397,512,452)),200,345,fill='#B77B38',width=2*s)
fonts=[
 'C:/Windows/Fonts/georgiab.ttf','C:/Windows/Fonts/ARIALBD.TTF',
 'C:/Windows/Fonts/ROCKB.TTF'
]
fontpath=next((p for p in fonts if Path(p).exists()),'C:/Windows/Fonts/arial.ttf')
font=ImageFont.truetype(fontpath,27*s)
label='SCORPION NIGHT'
bounds=d.textbbox((0,0),label,font=font)
xx=(768*s-(bounds[2]-bounds[0]))//2
yy=404*s
d.text((xx+2*s,yy+2*s),label,font=font,fill='#895427',stroke_width=1*s,stroke_fill='#895427')
d.text((xx,yy),label,font=font,fill='#261722')
base.convert('RGB').resize((w,h),Image.Resampling.LANCZOS).save(source,optimize=True)
print('Updated',source,source.stat().st_size)
