const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const folder=path.join(root,'assets','scorpion-narration');
const dest=path.join(root,'server','src','games','scorpionCueDurations.json');
const times=fs.existsSync(dest)?JSON.parse(fs.readFileSync(dest,'utf8')):{};
let measured=0;
for(const file of fs.readdirSync(folder).filter(n=>/^[a-z0-9_]+\.mp3$/.test(n))){
 const id=file.slice(0,-4);
 try {
  const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',path.join(folder,file)],{encoding:'utf8',timeout:10000}).trim());
  if(Number.isFinite(duration)&&duration>0){times[id]=Math.ceil(duration*1000);measured++;}
 }catch {if(!times[id])throw new Error('No duration for '+file+'. Install ffprobe or supply duration in '+dest);}
}
for(const role of ['mimic','minion','mason','seer','robber','troublemaker','drunk','insomniac','scorpion','scorpioness','villager','hunter','tanner'])
 times['copied_'+role+'_close']=times.copycat_close;
fs.writeFileSync(dest,JSON.stringify(times,null,2)+'\n');
console.log('Measured '+measured+' narrations, catalogued '+Object.keys(times).length+' cue durations');
