# 华智 AI · 工业“千企百万小时”具身智能高质量数据建设

工业“千企百万小时”具身智能高质量数据建设。提供场景结构、任务观察、实拍素材、原子动作参考与操作对象覆盖矩阵。

## 本地运行

直接打开 `index.html`，或运行 `python3 -m http.server 8000` 后访问 `http://localhost:8000`。

在线访问：https://huazhi-ai.github.io/IndustryReal1000/

## GitHub Pages

在仓库 Settings → Pages 中，选择 Deploy from a branch，使用 main 分支根目录。

## 内容维护

- `data.js`：场景条目与分类。
- `editorial.js`：任务族说明与工序步骤。
- `app.js`：交互和候选原子动作规则。
- `media.js`：素材索引；同目录的图片与视频为实拍素材。
- `index.html`、`style.css`：页面结构与视觉样式。
- `showcase.js`、`showcase.css`：首页轮播、双目动图展示及交互。
- `ego-*.webp`、`pipeline.mp4`：动态数据样例与数据采集管线介绍视频。

原子动作由任务文字推导，属于候选参考，并非逐帧人工标注。

## 许可

页面程序代码（HTML、CSS 和交互 JavaScript）采用 MIT License。场景数据、图片、视频及品牌标识不包含在 MIT 授权范围内；其公开展示不代表授予再分发或模型训练许可，其他使用请联系权利人。
