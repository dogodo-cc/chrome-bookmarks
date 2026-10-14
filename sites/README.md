# Better-Bookmarks 官网

网站源码在 sites/，与插件共用根目录 package.json 和 node_modules。试玩使用 Vue，直接从 ../../src/components/ 导入 InfinityCanvas、FolderCard 和类型定义；书签、虚拟列表、重命名、调整大小组件通过原组件的内部 import 引入。

没有组件副本、同步脚本或备用快照。修改 src/components/ 后，网站与插件直接使用同一份源码。

## 开发与构建

在项目根目录执行：

```sh
npm install
npm run dev:site
npm run build:site
npm run preview:site
```

开发与预览地址以 Vite 输出为准。build:site 先使用 sites/tsconfig.json 做类型检查，再通过 sites/vite.config.ts 编译网站。官网使用 Vite 默认输出目录 sites/dist/，与插件构建输出 dist/ 分开。

## 试玩

sites/src/BookmarkDemo.vue 只提供示例书签与布局，将编辑事件接到 Vue 内存数据，不调用 chrome.bookmarks 或 chrome.storage。

- 原组件处理画布移动、缩放、框选、卡片拖动和调整大小。
- 重命名、删除和跨文件夹移动只影响示例数据。
- 缩放与适应按钮调用 InfinityCanvas 的公开方法。
- 试玩直接嵌入产品展示区域，页面加载后挂载；示例数据在本次页面访问中保留，点击重置或刷新页面可恢复。
- “先玩一下”滚动到试玩区域。未操作画布时滚轮正常滚动网页；点击画布后可操作画布，移开鼠标继续滚动网页。
- 触控设备可使用缩放按钮；完整鼠标拖拽与框选建议在电脑体验。

## Sites 发布

根目录 .openai/hosting.json 保留同一 Sites 项目身份。发布源码以完整项目为根目录，保留 sites/ 与 src/components/ 的相对位置。Sites 打包工具仅支持根目录的标准静态目录，因此发布时在临时源码 checkout 中把 sites/dist 产物归一到 out 后打包；本项目的开发、构建和 GitHub Pages 上传仍使用 sites/dist。

组件不复制到网站目录。生产网站仍为静态文件，无需运行 Node 服务。

## 素材

sites/public/assets 来自插件仓库。字体通过 Google Fonts 加载，失败时回退到系统字体。
