from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter,features
import io,zipfile
import arabic_reshaper
from bidi.algorithm import get_display
import random,math
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets'/'mystery'
OUT.mkdir(parents=True,exist_ok=True)
FONTS=['C:/Windows/Fonts/tahomabd.ttf','C:/Windows/Fonts/arialbd.ttf','C:/Windows/Fonts/tradbdo.ttf','C:/Windows/Fonts/tahoma.ttf']
FONT=next((p for p in FONTS if Path(p).exists()),'C:/Windows/Fonts/arial.ttf')
PLUM='#351326';CORAL='#E75A3C';GOLD='#F2B529';CREAM='#FFF0CF';SAND='#D3A66A';DARK='#261724'
RAQM=features.check('raqm')
print('Arabic font',FONT,'RAQM',RAQM)
def txt(draw,xy,value,size=30,color=PLUM,anchor='mm',stroke=0,outline=PLUM):
    opts={'font':ImageFont.truetype(FONT,size),'fill':color,'anchor':anchor,'stroke_width':stroke,'stroke_fill':outline}
    if RAQM:opts['direction']='rtl'
    elif any('\u0600' <= c <= '\u06ff' for c in value):value=get_display(arabic_reshaper.reshape(value))
    draw.text(xy,value,**opts)
def light(c,f=.2):
    import PIL.ImageColor
    r,g,b=PIL.ImageColor.getrgb(c);return tuple(min(255,int(x+(255-x)*f)) for x in (r,g,b))
def plaque(draw,rect,title,scale=34):
    draw.rounded_rectangle(rect,15,fill=CREAM,outline=PLUM,width=5)
    x=(rect[0]+rect[2])//2;y=(rect[1]+rect[3])//2
    txt(draw,(x,y),title,scale)
def glowdraw(img,center,radius,color):
    layer=Image.new('RGBA',img.size,(0,0,0,0));d=ImageDraw.Draw(layer)
    x,y=center;d.ellipse((x-radius,y-radius,x+radius,y+radius),fill=color)
    layer=layer.filter(ImageFilter.GaussianBlur(radius//2))
    img.alpha_composite(layer)
def diamond(draw,x,y,w,h,fill,outline=PLUM):
    points=[(x,y-h),(x+w,y),(x,y+h),(x-w,y)]
    draw.polygon(points,fill=fill);draw.line(points+[points[0]],fill=outline,width=4,joint='curve')
def building(img,index,name):
    d=ImageDraw.Draw(img)
    w,h=img.size
    x=w//2;y=100
    # Isometric stone foundation
    diamond(d,x,260,185,60,'#B88453')
    d.polygon([(x-183,258),(x,321),(x+183,258),(x+183,277),(x,344),(x-183,277)],fill='#86563E')
    # Neighborhood archetypes varied by location
    tones=['#D6AB70','#BF9870','#B58958','#DFC086','#CE926D','#D8B579','#C9A380','#BA9460','#BCA68A']
    tone=tones[index]
    d.polygon([(x-112,122),(x,80),(x+116,126),(x,265),(x,308),(x-112,262)],fill=tone,outline=PLUM)
    d.polygon([(x-112,122),(x,80),(x,308),(x-112,262)],fill=light(tone,.07))
    d.polygon([(x,80),(x+116,126),(x+116,265),(x,308)],fill=light(tone,-.1) if False else '#A7815A')
    roof=['#A84F3F','#C66A3A','#527A6B','#DA9B48','#8D644B','#BA5B30','#608674','#98654B','#43617B'][index]
    d.polygon([(x-125,123),(x,56),(x+125,123),(x,80),(x-125,149)],fill=roof,outline=PLUM)
    d.polygon([(x-125,123),(x,56),(x+125,123),(x+112,137),(x,82),(x-112,141)],fill=light(roof,.15))
    # Door with arch
    d.rounded_rectangle((x-30,194,x+27,305),22,fill='#52352F',outline='#3E2728',width=5)
    d.ellipse((x-30,184,x+27,233),fill='#52352F',outline=PLUM,width=5)
    d.ellipse((x+15,254,x+20,260),fill=GOLD)
    for bx,by in [(x-86,178),(x+61,185)]:
        d.rounded_rectangle((bx-14,by-22,bx+13,by+22),7,fill='#295462',outline=PLUM,width=4)
        d.line((bx,by-22,bx,by+22),fill=GOLD,width=3)
    # Hanging lanterns
    for lx,ly in [(x-100,158),(x+91,164)]:
        d.line((lx,ly-28,lx,ly),fill=PLUM,width=4)
        d.polygon([(lx-9,ly),(lx+9,ly),(lx+6,ly+22),(lx-6,ly+22)],fill=GOLD,outline=PLUM)
        d.ellipse((lx-17,ly+1,lx+17,ly+30),outline=CORAL,width=2)
    # Scene motifs for venues.
    if index==0:
        for dx in [-64,0,64]:
            d.ellipse((x+dx-35,92,x+dx+35,148),fill='#B65E4B',outline=PLUM,width=3)
        for dx in [-70,60]:
            d.arc((x+dx-5,20,x+dx+37,72),160,380,fill='#ECDBC2',width=5)
    elif index==1:
        for k in range(3):
            d.rectangle((x-110+k*70,196,x-66+k*70,241),fill=['#B34542','#A78B3B','#557E65'][k],outline=PLUM,width=3)
        d.polygon([(x-115,160),(x+120,160),(x+105,194),(x-100,194)],fill=CORAL,outline=PLUM)
        for a in range(6):d.line((x-109+a*43,162,x-109+a*43,191),fill=CREAM,width=9)
    elif index==2:
        for bx in [x-100,x+57]:
            d.ellipse((bx,252,bx+44,264),fill='#855A43',outline=PLUM)
            d.line((bx+20,263,bx+20,296),fill=PLUM,width=6)
        d.rectangle((x-92,137,x+110,160),fill='#38776A',outline=PLUM,width=3)
    elif index==3:
        d.ellipse((x-58,210,x+65,280),fill='#2983A2',outline=PLUM,width=7)
        d.ellipse((x-19,223,x+19,250),fill='#E5D5B6')
        d.arc((x-32,175,x+34,247),180,350,fill='#8DDBE8',width=8)
        for dx in [-93,93]:d.ellipse((x+dx-18,235,x+dx+18,271),fill='#386F4E')
    elif index==4:
        d.rectangle((x-103,159,x+101,185),fill=CORAL,outline=PLUM,width=4)
        d.rounded_rectangle((x-52,120,x+52,165),10,fill=GOLD,outline=PLUM,width=3)
    elif index==5:
        d.ellipse((x+25,191,x+108,273),fill='#5E3430',outline=PLUM,width=6)
        d.ellipse((x+42,212,x+99,265),fill='#FFB234',outline=CORAL,width=4)
        for k in range(4):
            xx=x-100+k*30
            d.ellipse((xx,249,xx+24,260),fill='#EAB267',outline=PLUM,width=2)
    elif index==6:
        d.ellipse((x-100,178,x-27,255),fill='#506076',outline=GOLD,width=6)
        d.rectangle((x+50,213,x+85,283),fill=CORAL,outline=PLUM,width=4)
        d.line((x+50,248,x+84,248),fill=CREAM,width=5)
    elif index==7:
        for k in range(4):
            d.line((x-111,227+k*11,x-48,215+k*11),fill='#60402D',width=8)
        d.line((x+69,225,x+105,268),fill=PLUM,width=7)
        d.line((x+100,225,x+67,269),fill=PLUM,width=7)
    else:
        d.polygon([(x-112,130),(x+112,130),(x+112,260),(x-112,260)],fill='#998168',outline=PLUM)
        d.line((x-95,143,x+100,143),fill=GOLD,width=6)
        for dx in [-85,-25,35,92]:
            d.line((x+dx,143,x+dx,175),fill=PLUM,width=6)
        for dx in [-65,60]:d.ellipse((x+dx-22,194,x+dx+22,244),fill='#367953',outline=PLUM,width=2)
    plaque(d,(80,349,w-80,405),name,27)

LOCATION_NAMES=['حمّام الحارة','دكّان الحارة','مقهى الحارة','ساحة الحارة','بيت المختار','الفرن','محل الحلاق','ورشة النجّار','سطح أحد البيوت']
LOCATION_IDS=['HAMMAM','DUKKAN','CAFE','SQUARE','MUKHTAR','BAKERY','BARBER','CARPENTER','ROOFTOP']
for i,(id,name) in enumerate(zip(LOCATION_IDS,LOCATION_NAMES)):
    canvas=Image.new('RGBA',(480,420),'#F4DCAF')
    glowdraw(canvas,(270,120),90,(255,226,130,95))
    building(canvas,i,name)
    canvas.convert('RGB').save(OUT/('place_'+id.lower()+'.jpg'),quality=85,optimize=True)

COSTUMES=[('#CF6244','#A86B4A'),('#795A9F','#453A62'),('#4E9A96','#493C35'),('#DF9D4A','#836240'),('#B05A83','#65424D'),('#6F8B56','#403C42')]
NAMES=['سالم','زينب','نبيل','هند','أم يزن','فارس']
IDS=['salim','zainab','nabil','hind','om_yazan','faris']
for i,(name,sid) in enumerate(zip(NAMES,IDS)):
    canvas=Image.new('RGBA',(360,435),(0,0,0,0));d=ImageDraw.Draw(canvas)
    outfit,hood=COSTUMES[i]
    d.rounded_rectangle((7,8,353,426),35,fill=CREAM,outline=PLUM,width=8)
    d.ellipse((39,35,320,300),fill='#E7C18A')
    d.ellipse((63,47,298,282),fill='#C98F6D',outline=PLUM,width=5)
    # Shoulder tunic
    d.ellipse((52,245,311,422),fill=outfit,outline=PLUM,width=7)
    d.polygon([(150,280),(177,330),(208,279)],fill=CREAM)
    # Face and jaw
    skin=['#CE926B','#E5AA83','#B97A5D','#DAA080','#B57954','#D49F7B'][i]
    d.ellipse((116,119,246,283),fill=skin,outline=PLUM,width=6)
    hair=['#37292A','#332433','#3A2927','#58392D','#373032','#29252B'][i]
    d.pieslice((95,76,264,235),180,359,fill=hair)
    # head covering
    if i in (1,3,4):
       d.arc((95,78,270,292),205,520,fill=hood,width=24)
       d.polygon([(105,165),(96,282),(126,297),(129,188)],fill=hood)
       d.polygon([(240,155),(274,294),(242,298),(230,184)],fill=hood)
    else:
       d.polygon([(110,123),(150,81),(203,76),(254,117),(250,140),(105,137)],fill=hood,outline=PLUM)
    for cx in [152,211]:
       d.ellipse((cx-5,187,cx+6,196),fill=PLUM)
       d.arc((cx-17,170,cx+17,194),200,340,fill=PLUM,width=3)
    d.arc((160,211,222,250),10,150,fill='#734B3A',width=5)
    if i in (0,2,5):
       d.arc((152,221,224,265),1,165,fill=hair,width=11)
    plaque(d,(28,349,332,413),name,37)
    canvas.save(OUT/('person_'+sid+'.png'),optimize=True)

ICONS=[('lantern','فانوس قديم','lantern'),('key','مفتاح نحاسي','key'),('hammer','مطرقة نجّار','hammer'),('rope','حبل غسيل','rope'),('jug','إبريق نحاسي','jug'),('scissors','مقص حلاق','scissors')]
def item(draw,kind):
    if kind=='lantern':
        draw.ellipse((104,38,157,69),outline=PLUM,width=6)
        draw.polygon([(111,82),(148,82),(162,176),(98,176)],fill=GOLD,outline=PLUM)
        draw.ellipse((112,95,146,151),fill=CORAL)
    elif kind=='key':
        draw.ellipse((85,60,155,130),outline=GOLD,width=15)
        draw.line((133,113,179,164),fill=GOLD,width=17)
        draw.line((164,151,181,138),fill=GOLD,width=14)
    elif kind=='hammer':
        draw.line((100,166,164,60),fill='#84563B',width=24)
        draw.rounded_rectangle((110,44,190,85),10,fill='#65727E',outline=PLUM,width=5)
    elif kind=='rope':
        for j in range(3):
            draw.arc((68+j*20,73,177+j*13,190),0,300,fill='#AC7943',width=16)
    elif kind=='jug':
        draw.ellipse((83,86,179,176),fill='#CC873E',outline=PLUM,width=6)
        draw.arc((146,98,202,166),265,90,fill=PLUM,width=9)
        draw.polygon([(85,90),(100,55),(164,54),(176,89)],fill=GOLD,outline=PLUM)
    else:
        draw.ellipse((79,146,122,188),outline=PLUM,width=8)
        draw.ellipse((125,146,168,188),outline=PLUM,width=8)
        draw.line((97,148,169,67),fill='#929AA4',width=12)
        draw.line((144,147,92,68),fill='#929AA4',width=12)
for id,name,kind in ICONS:
    c=Image.new('RGBA',(260,320),CREAM);d=ImageDraw.Draw(c)
    d.rounded_rectangle((10,10,250,310),22,fill=CREAM,outline=PLUM,width=8)
    d.ellipse((48,32,212,215),fill='#F5D69F')
    item(d,kind)
    plaque(d,(24,235,236,293),name,21)
    c.save(OUT/('item_'+id+'.png'),optimize=True)

for n in range(1,7):
    c=Image.new('RGBA',(110,110),(0,0,0,0));d=ImageDraw.Draw(c)
    d.rounded_rectangle((7,6,102,102),17,fill=CREAM,outline=PLUM,width=9)
    points={1:[(55,54)],2:[(32,32),(78,78)],3:[(32,31),(55,54),(79,79)],
      4:[(32,32),(78,32),(32,78),(78,78)],5:[(32,32),(78,32),(55,55),(32,78),(78,78)],
      6:[(32,26),(78,26),(32,55),(78,55),(32,84),(78,84)]}
    for x,y in points[n]:d.ellipse((x-8,y-8,x+8,y+8),fill=CORAL)
    c.save(OUT/('die_'+str(n)+'.png'),optimize=True)

# original, readable bilingual logo with transparent external canvas
logo=Image.new('RGBA',(900,480),(0,0,0,0));d=ImageDraw.Draw(logo)
d.rounded_rectangle((120,74,810,394),65,fill=PLUM,outline=GOLD,width=15)
d.ellipse((625,15,840,226),fill=GOLD,outline=PLUM,width=12)
d.ellipse((670,52,775,157),fill=CREAM)
d.polygon([(752,57),(767,101),(815,112),(767,128),(748,175),(731,125),(687,107),(730,94)],fill=CORAL,outline=PLUM)
# lantern
d.line((183,8,183,116),fill=GOLD,width=15)
d.polygon([(139,102),(230,102),(215,232),(158,232)],fill=CORAL,outline=GOLD)
d.ellipse((159,130,213,193),fill=GOLD)
# footsteps
for x,y in [(670,301),(726,271),(758,330)]:
    d.ellipse((x-16,y-10,x+16,y+10),fill=CREAM)
txt(d,(455,258),'مين وراها',108,GOLD,stroke=9,outline=PLUM)
txt(d,(468,352),'WHO DID IT?',41,CREAM)
logo.save(OUT/'logo.png',optimize=True)
logo.resize((500,267),Image.Resampling.LANCZOS).save(OUT/'logo_small.png',optimize=True)
# illustrative loading / result splash, notebook cover, card back
for kind,title in [('thumbnail','مين وراها؟'),('loading','سر صندوق الحارة'),('win','انكشفت الحقيقة!'),('notebook','دفتر المحقق')]:
    c=Image.new('RGBA',(840,450),CREAM);d=ImageDraw.Draw(c)
    for a in range(0,840,46):
        d.line((a,0,a-180,450),fill='#F0D9B5',width=2)
    d.rounded_rectangle((16,14,824,436),37,outline=PLUM,width=12)
    if kind=='notebook':
        for yy in range(83,365,41):d.line((130,yy,725,yy),fill='#B79D7C',width=2)
        for xx in range(51,427,35):d.ellipse((50,xx,85,xx+14),fill=PLUM)
    else:
        for j in range(9):
            x=105+(j%3)*132;y=90+(j//3)*84
            d.polygon([(x,y-31),(x+59,y),(x,y+31),(x-59,y)],fill=['#D7A66A','#B87B59','#E3BF89'][j%3],outline=PLUM,width=3)
        d.ellipse((561,85,743,267),fill=GOLD,outline=PLUM,width=8)
        txt(d,(650,178),'؟',125,PLUM)
    plaque(d,(120,333,720,415),title,50)
    c.convert('RGB').save(OUT/(kind+'.jpg'),quality=87,optimize=True)

# Brand-correction on the ORIGINAL bomb PNG: retain scenery, colours and fuse
# but cover its mistaken foreground letters in a matched brand plaque.
BOMB=ROOT/'assets'/'game-logos'/'meen_fajjarni_logo.png'
if BOMB.exists():
    archive=Path.home()/'Downloads'/'sho_nel3b_logos.zip'
    if archive.exists():
        with zipfile.ZipFile(archive,'r') as z:
            pristine=z.read('meen_fajjarni_logo.png')
        base=Image.open(io.BytesIO(pristine)).convert('RGBA')
    else:
        base=Image.open(BOMB).convert('RGBA')
    W,H=base.size
    d=ImageDraw.Draw(base)
    d.rounded_rectangle((113,220,686,482),38,fill=PLUM,outline=GOLD,width=11)
    d.rounded_rectangle((126,232,672,469),28,outline=CORAL,width=4)
    txt(d,(403,340),'مين فجرني',86,GOLD,stroke=4,outline=PLUM)
    txt(d,(403,427),'WHO BOMBED ME?',29,CREAM)
    base.save(BOMB,optimize=True)
print('generated',len(list(OUT.iterdir())),'mystery art files and corrected bomb logo')
