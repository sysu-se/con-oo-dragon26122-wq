# Homework 1.1 设计说明

## 1. 领域对象如何被消费

### 1.1 View 层直接消费谁

View 层不直接操作 `Sudoku` / `Game` 实例，而是消费 `@sudoku/stores/grid` 暴露的 Store Adapter：

- `grid`：题面（初始固定数字）
- `userGrid`：当前局面（包含用户输入）
- `invalidCells`：冲突格
- `canUndo` / `canRedo`：历史状态

`stores/grid.js` 内部持有真实的 `Game` 实例，所有主要交互都转发到领域对象方法。

### 1.2 View 层拿到的数据

- 棋盘渲染使用 `$userGrid`
- 固定格判断使用 `$grid`
- 冲突高亮使用 `$invalidCells`
- 撤销/重做按钮状态使用 `$canUndo` / `$canRedo`

### 1.3 用户操作如何进入领域对象

- 键盘输入：`Keyboard.svelte -> userGrid.set(pos, value) -> domainGame.guess -> Game.guess -> Sudoku.guess`
- 提示输入：`Actions.svelte -> userGrid.applyHint(pos) -> Game.guess`
- 撤销：`Actions.svelte -> userGrid.undo() -> Game.undo()`
- 重做：`Actions.svelte -> userGrid.redo() -> Game.redo()`

### 1.4 为什么领域对象变化后 UI 会更新

`stores/grid.js` 中的 `domainGame` 是 `writable` store。每次调用 `guess/undo/redo/applyHint` 后都会触发 `state.update(...)`，从而使依赖它的 `derived` store（`grid/userGrid/invalidCells/canUndo/canRedo`）重新计算，Svelte 组件通过 `$store` 自动刷新。

---

## 2. 响应式机制说明

### 2.1 依赖的机制

本实现主要依赖：

- `writable` 保存领域对象容器状态
- `derived` 从领域对象导出响应式视图状态
- 组件中通过 `$store` 订阅并渲染

### 2.2 哪些数据是响应式暴露给 UI 的

- `grid`（题面）
- `userGrid`（当前盘面）
- `invalidCells`（冲突列表）
- `canUndo/canRedo`
- `gameWon`（在 `stores/game.js` 基于 `userGrid + invalidCells` 推导）

### 2.3 哪些状态留在领域对象内部

- `Game` 的历史栈（undo/redo snapshots）
- `Sudoku` 的当前 grid 及其校验逻辑
- `Sudoku` 的克隆和序列化实现

### 2.4 为什么不能直接 mutate 内部对象

如果在组件里直接改二维数组（不经过 store adapter），会出现：

- 领域层无法记录历史，Undo/Redo 失效
- 校验逻辑分散到组件，职责边界变差
- 响应式更新依赖偶然触发，不可维护

---

## 3. 相比 HW1 的改进

### 3.1 实质改进点

1. 新增完整领域 API：`createSudoku/createGame` 及反序列化入口，具备 `guess/clone/toJSON/toString/undo/redo`。
2. 将历史存储改为快照栈（序列化后的 Sudoku 状态），避免 UI 层管理历史。
3. 新增 Store Adapter：`stores/grid.js` 内部持有 `Game`，对外只暴露 UI 所需响应式数据和命令。
4. 撤销/重做按钮已接入真实领域逻辑，而非仅在组件中保留空按钮。

### 3.2 为什么 HW1 的做法不足

HW1 常见问题是“领域对象只在测试中可用”。若 UI 仍直接读写数组，领域对象不会成为真实流程核心，导致代码结构与业务流程脱节。

### 3.3 新设计的 trade-off

- 优点：职责清晰、可测试性高、UI 不持有核心业务规则。
- 成本：多了一层 adapter，需要维护“领域状态 -> 视图状态”的映射。
- 取舍：将稳定的业务规则放在 `domain`，将可变的框架绑定放在 `stores`，便于未来迁移。

---

## 4. 迁移到 Svelte 5 时的稳定性判断

- 最稳定：`src/domain`（纯业务逻辑，不依赖 Svelte）。
- 可能改动：`stores/grid.js`（响应式适配方式可能从当前 store 迁移到新的机制）。
- 组件层只依赖 adapter API，改动面会比“组件直接写业务”更小。
