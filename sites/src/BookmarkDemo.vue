<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref } from 'vue';
import InfinityCanvas from '../../src/components/infinity-canvas.vue';
import FolderCard from '../../src/components/FolderCard.vue';
import type { IInfinityCanvasItem } from '../../src/components/type';

type Bookmark = { id:string; title:string; url:string; index:number };
type Folder = IInfinityCanvasItem & {id:string; title:string; bookmarks:Bookmark[]};
const canvasWidth = 4000, canvasHeight = 3000;
const host = ref<HTMLElement>();
const canvas = ref<InstanceType<typeof InfinityCanvas>>();
const scale = ref(1);
const revision = ref(0);
const notice = ref('拖动卡片标题；点选卡片后拖动边缘调整大小。');
const active = ref(false);
function onWheelCapture(event: WheelEvent) {
  // Let visitors scroll the page until they interact with the embedded canvas.
  const hasFocus = host.value?.contains(document.activeElement) ?? false;
  if (!active.value && !hasFocus && !event.ctrlKey) event.stopPropagation();
}
function onFocusout(event: FocusEvent) {
  if (!host.value?.contains(event.relatedTarget as Node | null)) active.value = false;
}
const node = (id:string,title:string,url:string,index:number):Bookmark => ({id,title,url,index});
function sampleFolders():Folder[] {
  return [
    {id:'design',title:'设计灵感',left:1660,top:1250,width:285,height:235,bookmarks:[node('figma','Figma Community','https://www.figma.com/community',0),node('dribbble','Dribbble','https://dribbble.com',1),node('arena','Are.na','https://www.are.na',2),node('pinterest','Pinterest','https://www.pinterest.com',3),node('awwwards','Awwwards','https://www.awwwards.com',4)]},
    {id:'tools',title:'日常工具',left:2035,top:1220,width:275,height:205,bookmarks:[node('notion','Notion','https://www.notion.so',0),node('linear','Linear','https://linear.app',1),node('excalidraw','Excalidraw','https://excalidraw.com',2),node('tldraw','tldraw','https://www.tldraw.com',3)]},
    {id:'code',title:'开发手册',left:2060,top:1515,width:290,height:235,bookmarks:[node('github','GitHub','https://github.com',0),node('mdn','MDN Web Docs','https://developer.mozilla.org',1),node('vue','Vue.js','https://vuejs.org',2),node('typescript','TypeScript','https://www.typescriptlang.org',3),node('vite','Vite','https://vite.dev',4)]},
    {id:'life',title:'生活与留白',left:1670,top:1570,width:285,height:180,bookmarks:[node('spotify','专注时的歌单','https://open.spotify.com',0),node('read','周末阅读清单','https://www.gutenberg.org',1),node('unsplash','散步时的风景','https://unsplash.com',2)]},
  ];
}
const folders = ref<Folder[]>(sampleFolders());
function update(index:number,data:Partial<IInfinityCanvasItem>) {
  const folder = folders.value[index];
  if (folder) Object.assign(folder,data);
}
function fit() {
  const rect = host.value?.getBoundingClientRect();
  if (!rect || !canvas.value) return;
  const list = folders.value.length ? folders.value : sampleFolders();
  const left=Math.min(...list.map(f=>f.left)), top=Math.min(...list.map(f=>f.top));
  const right=Math.max(...list.map(f=>f.left+f.width)), bottom=Math.max(...list.map(f=>f.top+f.height));
  const nextScale=Math.max(.2,Math.min(1.25,(rect.width-45)/(right-left),(rect.height-75)/(bottom-top)));
  canvas.value.setTransform(nextScale, (canvasWidth/2-(left+right)/2)*nextScale, (canvasHeight/2-(top+bottom)/2)*nextScale);
}
async function reset() {
  folders.value=sampleFolders();
  revision.value++;
  notice.value='已恢复示例书签与初始布局。';
  await nextTick();
  fit();
}
function rename(id:string|number,title:string) {
  const folder=folders.value.find(f=>f.id===String(id));
  if(folder) folder.title=title;
  else {const bookmark=folders.value.flatMap(f=>f.bookmarks).find(b=>b.id===String(id));if(bookmark)bookmark.title=title;}
  notice.value=`已重命名为「${title}」。`;
}
function remove(id:string|number) {
  for(const folder of folders.value) folder.bookmarks=folder.bookmarks.filter(b=>b.id!==String(id)).map((b,index)=>({...b,index}));
  notice.value='已删除示例书签，点击重置可恢复。';
}
function removeFolder(id:string) {
  folders.value=folders.value.filter(f=>f.id!==id);
  notice.value='已删除示例文件夹，点击重置可恢复。';
}
function onDragstart(event:DragEvent) {
  const target=event.currentTarget as HTMLElement;
  event.dataTransfer?.setData('text/plain',JSON.stringify({id:target.dataset.id,folderId:target.dataset.folderId}));
  if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
}
function onDrop(event:DragEvent) {
  event.preventDefault();
  const container=event.currentTarget as HTMLElement;
  const row=(event.target as HTMLElement).closest('.bookmark-item') as HTMLElement|null;
  const destination=folders.value.find(f=>f.id===container.dataset.folderId);
  if(!destination)return;
  let data:{id?:string;folderId?:string};
  try {data=JSON.parse(event.dataTransfer?.getData('text/plain')||'');}catch{return;}
  const origin=folders.value.find(f=>f.id===data.folderId);
  const sourceIndex=origin?.bookmarks.findIndex(b=>b.id===data.id)??-1;
  if(!origin||sourceIndex<0)return;
  let targetIndex=Number(row?.dataset.index??destination.bookmarks.length);
  if(!Number.isInteger(targetIndex))return;
  if(origin===destination && sourceIndex<targetIndex) targetIndex--;
  const [bookmark]=origin.bookmarks.splice(sourceIndex,1);
  destination.bookmarks.splice(Math.max(0,Math.min(targetIndex,destination.bookmarks.length)),0,bookmark!);
  for(const folder of [origin,destination]) folder.bookmarks.forEach((b,index)=>b.index=index);
  notice.value=`已将「${bookmark!.title}」移到「${destination.title}」。`;
}
function open(url:string) {window.open(url,'_blank','noopener');}
let observer:ResizeObserver|undefined;
onMounted(async()=>{
  await nextTick();
  fit();
  observer=new ResizeObserver(fit);
  if(host.value)observer.observe(host.value);
});
onBeforeUnmount(()=>observer?.disconnect());
</script>

<template>
  <div class="bookmark-demo">
    <div class="demo-toolbar"><span>试试移动、缩放和整理你的书签</span><button type="button" @click="reset">重置示例 ↺</button></div>
    <div ref="host" class="real-canvas-host" :class="{active}" tabindex="0" role="region" aria-label="Better-Bookmarks 书签画布试玩" @wheel.capture="onWheelCapture" @mousedown.capture="active=true" @click.capture="active=true" @focusin="active=true" @focusout="onFocusout" @mouseleave="active=false">
      <InfinityCanvas ref="canvas" :key="revision" :list="folders" :canvas-width="canvasWidth" :canvas-height="canvasHeight" @update="update" @update:transform="nextScale=>scale=nextScale">
        <template #default="{item}"><FolderCard :folder="item as Folder" :get-target-index="folder=>folder.bookmarks.length" @dragstart="onDragstart" @drop="onDrop" @rename="rename" @remove="remove" @remove-folder="removeFolder" @open="open" /></template>
      </InfinityCanvas>
      <div class="real-canvas-controls" aria-label="画布控制"><button type="button" aria-label="缩小画布" @click="canvas?.zoomBy(-.1)">−</button><output aria-label="当前缩放">{{Math.round(scale*100)}}%</output><button type="button" aria-label="放大画布" @click="canvas?.zoomBy(.1)">+</button><button type="button" aria-label="让全部卡片可见" @click="fit">适应</button></div>
      <div v-if="!folders.length" class="empty-demo">文件夹都被删掉了。点击「重置示例」重新开始。</div>
    </div>
    <p class="demo-feedback" role="status">{{notice}}</p>
    <p class="demo-touch-note">完整的拖拽与框选体验建议使用电脑；触控设备可使用缩放按钮。</p>
  </div>
</template>

<style scoped>
.bookmark-demo{color:#262923}.demo-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;font-size:11px;color:#68715e}.demo-toolbar button{border:1px solid #b1bda0;padding:5px 10px;background:#edf2e3;border-radius:4px;font-size:11px;white-space:nowrap}.real-canvas-host{position:relative;height:min(60vh,590px);min-height:270px;border-radius:8px;overflow:hidden;background:#666686}.real-canvas-controls{position:absolute;bottom:14px;right:14px;background:#fffef8;border:1px solid #c4cfb2;border-radius:5px;display:flex;align-items:center;padding:3px;gap:2px;box-shadow:0 2px 8px #2222}.real-canvas-controls button{border:0;border-radius:3px;background:none;font-size:16px;padding:0;width:34px;height:32px}.real-canvas-controls button:hover{background:#d5ef84}.real-canvas-controls button:last-child{font-size:11px;width:40px}.real-canvas-controls output{font-size:10px;width:45px;text-align:center}.demo-feedback{font-size:11px;color:#5d6a4d;text-align:left;margin:12px 0 0}.demo-touch-note{display:none;font-size:10px;color:#68715e;margin:6px 0 0;text-align:left}.empty-demo{position:absolute;top:40%;left:10%;right:10%;padding:20px;background:#fffef8;border-radius:8px;text-align:center;font-size:13px}.bookmark-demo :deep(.infinity-canvas .resize){pointer-events:none}.bookmark-demo :deep(.resize .dot){pointer-events:auto}.bookmark-demo :deep(.folder-rename-btn),.bookmark-demo :deep(.folder-delete-btn){min-width:24px;min-height:24px}.bookmark-demo :deep(.bookmark-list-container){line-height:normal}@media(max-width:760px){.demo-toolbar{font-size:10px}.real-canvas-host{height:50vh;min-height:280px}.demo-touch-note{display:block}.demo-feedback{font-size:10px}}
</style>
