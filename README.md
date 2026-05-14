# 基金灵动岛（macOS 顶部悬浮）

基于 Electron + React 19 + Vite + Tailwind CSS 4 的桌面悬浮窗，默认吸附在屏幕顶部中央，悬停展开查看 **自选基金 + A 股** 列表。Electron 主进程分别请求东方财富 **基金估值 JSONP** 与 **个股 push2 快照**；无 Electron 时基金回退 Mock、股票为空。

## 环境要求

- macOS
- Node.js 20+（建议 LTS）
- npm

## 安装依赖

```bash
npm install
```

## 运行方式

### 开发调试

```bash
npm run dev
```

会自动启动 Vite 开发服务器并拉起 Electron 窗口。

### 生产构建与运行

```bash
npm run build
npm start
```

`npm start` 等价于 `electron .`，会加载 `dist/` 与 `dist-electron/` 构建产物。

## 打包程序（macOS）

1. 在本机安装依赖后执行：

```bash
npm run dist
```

2. 完成后在 **`release/`** 目录下会生成：
   - **`基金灵动岛-x.x.x-arm64.dmg`**（或 `x64`）：发给对方双击安装到「应用程序」；
   - **`.zip`**：可直接解压得到 `.app`，适合不方便用 DMG 的场景。

3. **仅想快速打出 .app 目录**（不制作 DMG，便于自测）：

```bash
npm run dist:dir
```

输出同样在 `release/` 下（`mac` 子目录里的 `.app`）。

### 对方电脑上注意事项

- 需要 **macOS**（与当前打包机架构一致：Apple Silicon 打出来是 arm64，Intel 打出来是 x64）。若要 **通用二进制（Universal）**，需在 `package.json` 的 `build.mac` 里增加 `"arch": ["x64", "arm64"]` 等配置，体积会变大。
- 未做 **Apple Developer 公证** 时，首次打开可能提示「无法验证开发者」：可在 **系统设置 → 隐私与安全性** 里点「仍要打开」，或右键 `.app` → 打开。
- 若你后续购买了 **Developer ID**，可在 `build.mac` 中配置 `identity` 并开启公证，以减少安全提示。

## 使用说明

1. **窗口位置**：启动后主窗口出现在 **主显示器工作区顶部正中**（避让菜单栏区域由系统 `workArea` 决定）。
2. **默认形态**：窄胶囊（约 240×36），摘要优先显示 **首只基金**，无基金时显示 **首只股票**。
3. **展开**：鼠标 **移入** 后宽度约 **420px**，分区展示 **基金**（估算净值等）与 **A 股**（现价、换手、成交量、成交额等）。
4. **自选配置**：设置里分两个输入框：**基金代码**、**A 股代码**（6 位沪深为主），逗号/空格分隔，保存后约 **10 秒** 刷新；基金代码会自动补零到 6 位。
5. **数据来源**：基金 `fundgz` JSONP；A 股 `push2` 快照字段含现价、涨跌额/幅、**换手率 f168**、**成交量 f47（手）**、**成交额 f48（元）**。自选分 **基金代码** 与 **股票代码** 两组持久化（`localStorage` key 仍为 `fund-island-watchlist`，内部已迁移为 `watchlistFundCodes` / `watchlistStockCodes`）。
6. **其他平台**：**Tushare**、**AkShare** 多在 Python 侧或需 Token；**聚合数据** 多为商业 HTTP API。若需接入，可在主进程增加对应 `ipcMain.handle` 再切换 `fundApi`。

## 退出应用

本应用在 macOS 上会 **隐藏 Dock 图标**（`app.dock.hide()`）。退出方式：

- 窗口在前台时：**Command + Q**
- 或在 **活动监视器** 中结束对应 Electron 进程

## 常见问题

- **第二次启动没反应**：工程启用了单实例锁；若已有实例在运行，新启动会被忽略。请先退出旧进程再开。
- **窗口被其他全屏 App 挡住**：主进程设置了较高层级与多工作区可见性；若仍有个别场景异常，可反馈你的系统版本与复现步骤。

## 目录速览

| 路径 | 说明 |
|------|------|
| `electron/main.ts` | 主进程：窗口、`fund:` / `stock:` 行情 IPC |
| `electron/eastmoneyFund.ts` | 基金 fundgz JSONP |
| `electron/eastmoneyStock.ts` | A 股 push2 快照 |
| `electron/preload.ts` | 预加载：`setWindowBounds`、`fetchFundQuotes`、`fetchStockQuotes` |
| `src/components/FundIsland.tsx` | 灵动岛 UI 与展开动画 |
| `src/store/fundStore.ts` | Zustand 状态与自选持久化 |
| `src/hooks/useFundRefresh.ts` | 每 10 秒拉取估值 |
| `src/components/StockRow.tsx` | 股票行（换手、量、额） |
| `src/api/stockApi.ts` | 股票 IPC 封装 |
| `src/api/mockFundApi.ts` | 无 Electron 时的本地模拟 |
