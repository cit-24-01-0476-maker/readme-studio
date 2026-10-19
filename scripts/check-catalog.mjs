import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'dist/data/catalog.json'),'utf8'));
assert.equal(data.items.length,data.counts.total);
assert.ok(data.counts.total>=500,'At least 500 sourced entries must be present');
assert.equal(new Set(data.items.map(t=>t.id)).size,data.items.length,'Unique IDs');
const community=data.items.filter(t=>t.type==='community');
assert.equal(new Set(community.map(t=>t.username.toLowerCase())).size,community.length,'Community profiles deduplicated by username');
for(const item of data.items){
 assert.ok(item.name&&item.category&&item.source&&item.id,'Required metadata');
 assert.equal(new URL(item.source).host,'github.com','Original source attribution');
 if(item.type==='design'){
  assert.ok(item.sample,'Template Markdown is present');
  assert.match(await fs.readFile(path.join(root,'dist',item.thumbnail),'utf8'),/<svg/,'SVG source included');
  assert.ok((await fs.stat(path.join(root,'dist/design-guides',item.slug+'.md'))).size>0,'Setup guide included');
 }else{assert.ok(item.rawCandidates.length>0);for(const url of item.rawCandidates)assert.equal(new URL(url).host,'raw.githubusercontent.com');}
}
for(const file of ['vendor/marked.js','vendor/purify.js','vendor/jszip.js','licenses/design-led-MIT.txt','licenses/profile-index-CC0.txt'])assert.ok((await fs.stat(path.join(root,'dist',file))).size>0);
console.log(`Catalog verified: ${data.counts.total} unique sourced entries (${data.counts.designs} designs + ${community.length} community profiles), with bundled design assets, setup guides, and licenses.`);
