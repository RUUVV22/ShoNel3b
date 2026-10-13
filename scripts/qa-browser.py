from playwright.sync_api import sync_playwright
from pathlib import Path
import json
OUT=Path('.qa_tmp');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
    for width,height in [(390,850),(768,1024),(1280,900)]:
        context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=width<600,has_touch=width<600)
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)[:300]))
        page.goto('http://127.0.0.1:8184',wait_until='domcontentloaded',timeout=30000)
        page.wait_for_timeout(3800)
        js="""() => {
 const all=Array.from(document.querySelectorAll('*')).map(e=>({el:e,rect:e.getBoundingClientRect(),tag:e.tagName,cls:e.className}));
 const violators=all.filter(x=>x.rect.right>window.innerWidth+2 && x.rect.width>0 && getComputedStyle(x.el).visibility!=='hidden').sort((a,b)=>b.rect.right-a.rect.right).slice(0,9).map(x=>({tag:x.tag,cls:String(x.cls).slice(0,70),left:Math.round(x.rect.left),right:Math.round(x.rect.right),width:Math.round(x.rect.width)}));
 return {innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,violators};
}"""
        metrics=page.evaluate(js)
        page.screenshot(path=str(OUT/('home_'+str(width)+'.png')),full_page=False)
        print(json.dumps({'viewport':width,'metrics':metrics,'errors':errors},ensure_ascii=False))
        context.close()
    browser.close()
