// Render GitHub-flavored Markdown and sanitize community-authored HTML before insertion.
window.studioRender = function(markdown, options={}) {
 const html=DOMPurify.sanitize(marked.parse(String(markdown),{gfm:true,breaks:false}),{
  USE_PROFILES:{html:true},SANITIZE_NAMED_PROPS:true,
  FORBID_TAGS:['form','button','input','textarea','select','option','iframe','video','audio','style','script','object','embed','link','meta'],
  FORBID_ATTR:['style','class','id','name','srcset']
 });
 const fragment=document.createElement('template');fragment.innerHTML=html;
 for(const el of fragment.content.querySelectorAll('[href],[src]')) {
  for(const attr of ['href','src']) {
   if(!el.hasAttribute(attr))continue;
   let value=el.getAttribute(attr);
   if(attr==='src'&&options.previewAsset&&value&&(/^(\.\/)?assets\//.test(value)||/profile-3d-contrib|output\/snake|pacman-contribution|metrics\.svg/.test(value)))value=options.previewAsset;
   try {
    if(value.startsWith('#')&&attr==='href')continue;
    const url=new URL(value,options.sourceBase||location.href);
    if(!['https:','http:','mailto:'].includes(url.protocol)){el.removeAttribute(attr);continue;}
    el.setAttribute(attr,url.href);
   }catch{el.removeAttribute(attr);}
  }
  if(el.tagName==='A'){el.target='_blank';el.rel='noopener noreferrer';}
  if(el.tagName==='IMG'){el.loading='lazy';el.referrerPolicy='no-referrer';}
 }
 return fragment.innerHTML;
};
