# 校园搞事RPG · Phase 1

这是《校园搞事RPG》设计文档中 Phase 1 的可运行原型。当前聚焦班长线前三天：每个时段只能做一次选择，选择会改变资源、关系、把柄和剧情标记，第三天的广播检查会根据前两天留下的标记提供不同结果。

## 开发

```bash
NPM_CONFIG_CACHE=/tmp/campus-npm-cache npm install
npm run dev -- --host 127.0.0.1
```

打开 `http://127.0.0.1:5173`。手机竖屏布局会自动切换。游戏每次结算都会写入 `localStorage`，标题页的“继续”可以恢复当前角色线。

## 验证

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`test:e2e` 使用环境中已安装的 Chromium。视觉素材目前是 Phaser 占位背景和 HTML 面板；尚未进行像素级视觉验收。

## 目录

- `src/core/`：时间、状态、资源、条件、事件和存档系统，独立于 Phaser。
- `src/data/`：角色、地点和班长前三天事件 JSON。
- `src/ui/`：HUD、对话、选择、日志和保存按钮。
- `src/scenes/`：Phaser 占位背景场景。
- `tests/`：Vitest 核心测试和 Playwright 浏览器冒烟测试。
