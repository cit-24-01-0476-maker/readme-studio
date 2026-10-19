import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const raw='https://raw.githubusercontent.com/';
async function text(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`${r.status}: ${url}`);return r.text();}
async function save(file,value){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,value);}
const designRepo='beydemirfurkan/awesome-github-profile',profileRepo='abhisheknaiidu/awesome-github-profile-readme',communityRepo='durgeshsamariya/awesome-github-profile-readme-templates';
const [design,index,tree]=await Promise.all([text(raw+designRepo+'/main/docs/templates.json').then(JSON.parse),text(raw+profileRepo+'/master/README.md'),text('https://api.github.com/repos/'+communityRepo+'/git/trees/master?recursive=1').then(JSON.parse)]);
if(tree.truncated)throw new Error('Incomplete upstream tree');
const catalog=design.templates.map(t=>({...t,id:'design-'+t.slug,type:'design',sourceId:'design-led',source:'https://github.com/'+designRepo+'/tree/main/'+t.href,thumbnail:'design-assets/'+t.slug+'.svg',description:t.blurb,category:t.categoryTitle}));
const profiles=new Map();let category='Community',inCategories=false;
const categoryMap={'GitHub Actions':'GitHub Actions','Game Mode':'Gamified','Code Mode':'Code inspired','Dynamic Realtime':'Dynamic','A Little Bit of Everything':'All-rounder','Descriptive':'Storytelling','Simple but Innovative Ones':'Creative','Typing.. Mode':'Animated','Anime':'Anime','Minimalistic':'Minimal','GIFS':'Animated','Just Images':'Visual','Badges':'Badges','Fancy Fonts':'Typography','Icons':'Icons','Retro':'Retro'};
for(const line of index.split('\n')){
 if(line.startsWith('## Categories')){inCategories=true;continue;}
 if(inCategories&&/^## /.test(line))break;if(!inCategories)continue;
 if(line.startsWith('#### ')){category=Object.entries(categoryMap).find(([key])=>line.slice(5).startsWith(key))?.[1]||'Community';}
 const m=line.match(/^- \[([^\]]+)\]\(https:\/\/github\.com\/([a-z\d-]+)(?:\/([a-z\d-]+))?\/?\)/i);
 if(!m||m[3]&&m[3].toLowerCase()!==m[2].toLowerCase())continue;
 const user=m[2],key=user.toLowerCase();
 if(profiles.has(key)){const p=profiles.get(key);if(!p.tags.includes(category))p.tags.push(category);continue;}
 profiles.set(key,{id:'profile-'+key,type:'community',name:m[1],username:user,category,tags:[category],kind:'profile',difficulty:'Community',sourceId:'awesome-profiles',source:`https://github.com/${user}/${user}`,collection:`https://github.com/${profileRepo}`,rawCandidates:[raw+`${user}/${user}/HEAD/README.md`,raw+`${user}/${user}/HEAD/readme.md`],description:`${category} profile curated by Awesome GitHub Profile README.`});
}
for(const file of tree.tree.filter(f=>f.type==='blob'&&/^templates\/[^/]+\.md$/i.test(f.path))){
 const user=path.basename(file.path,'.md');if(!/^[a-z\d-]+$/i.test(user))continue;
 const key=user.toLowerCase(),source=`https://github.com/${communityRepo}/blob/master/${file.path}`,rawURL=raw+communityRepo+'/master/'+file.path;
 if(profiles.has(key)){const p=profiles.get(key);p.rawCandidates.unshift(rawURL);p.archiveSource=source;p.tags.push('Community archive');continue;}
 profiles.set(key,{id:'profile-'+key,type:'community',name:user,username:user,category:'Community',tags:['Community archive'],kind:'profile',difficulty:'Community',sourceId:'community-templates',source,collection:`https://github.com/${communityRepo}`,rawCandidates:[rawURL],description:'An original README example from the community template archive.'});
}
catalog.push(...profiles.values());
const result={version:1,generatedAt:new Date().toISOString(),counts:{total:catalog.length,designs:design.templates.length,community:profiles.size},sources:[{id:'design-led',name:'Awesome GitHub Profile',url:'https://github.com/'+designRepo,license:'MIT'},{id:'awesome-profiles',name:'Awesome GitHub Profile README',url:'https://github.com/'+profileRepo,license:'CC0-1.0 (index)'},{id:'community-templates',name:'Community README archive',url:'https://github.com/'+communityRepo,license:'Individual authors; check original source'}],items:catalog};
if(result.counts.total<500)throw new Error('Expected at least 500 unique entries');
await save(path.join(root,'dist/data/catalog.json'),JSON.stringify(result));
await Promise.all([
 text(raw+designRepo+'/main/LICENSE').then(t=>save(path.join(root,'dist/licenses/design-led-MIT.txt'),t)),
 text(raw+profileRepo+'/master/LICENSE').then(t=>save(path.join(root,'dist/licenses/profile-index-CC0.txt'),t)),
 text('https://cdn.jsdelivr.net/npm/marked@18.1.1/lib/marked.umd.js').then(t=>save(path.join(root,'dist/vendor/marked.js'),t)),
 text('https://cdn.jsdelivr.net/npm/dompurify@3.4.17/dist/purify.min.js').then(t=>save(path.join(root,'dist/vendor/purify.js'),t)),
 text('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(t=>save(path.join(root,'dist/vendor/jszip.js'),t))
]);
let cursor=0;await Promise.all(Array.from({length:6},async()=>{while(cursor<design.templates.length){const t=design.templates[cursor++];await Promise.all([text(raw+designRepo+'/main/'+t.asset).then(v=>save(path.join(root,'dist/design-assets',t.slug+'.svg'),v)),text(raw+designRepo+'/main/'+t.href+'README.md').then(v=>save(path.join(root,'dist/design-guides',t.slug+'.md'),v))]);}}));
console.log(JSON.stringify(result.counts));
