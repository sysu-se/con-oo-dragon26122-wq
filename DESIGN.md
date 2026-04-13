# Homework 1.1 设计说明

## 1. 领域对象如何被消费

### 1.1 View 层直接消费什么

View 层不直接持有 `Sudoku` / `Game` 实例，而是消费 `@sudoku/stores/grid` 提供的 store adapter：

- 响应式状态：`grid`（题面）、`userGrid`（当前局面）、`invalidCells`、`canUndo`、`canRedo`
- 响应式命令：`userGrid.set`、`userGrid.applyHint`、`userGrid.undo`、`userGrid.redo`

`grid` store 内部持有 `Game`，`Game` 内部持有 `Sudoku`。组件通过 store 间接消费领域对象，不再直接修改二维数组。

### 1.2 View 层拿到的数据

- `Board` 使用 `$userGrid` 渲染当前棋盘
- `Board` 使用 `$grid` 判定固定数字（是否可编辑）
- `Board` 使用 `$invalidCells` 计算冲突高亮
- `Actions` 使用 `$canUndo`、`$canRedo` 控制撤销/重做按钮可用性

### 1.3 用户操作如何进入领域对象

- 键盘输入 -> `Keyboard.svelte` -> `userGrid.set(pos, value)` -> `Game.guess` -> `Sudoku.guess`
- 提示输入 -> `Actions.svelte` -> `userGrid.applyHint(pos)` -> `Game.guess` -> `Sudoku.guess`
- 撤销/重做 -> `Actions.svelte` -> `userGrid.undo/redo()` -> `Game.undo/redo`
- 开局 -> `startNew/startCustom` -> `grid.generate/decodeSencode` -> 新建 `Game + Sudoku`

### 1.4 为什么领域对象变化后 Svelte 会更新

`grid` store 在每次领域对象命令执行后，都会 `update` 出一个新的状态对象，并把最新 `Sudoku.getGrid()` 结果写回 `userGrid` 字段。  
`Board`、`Actions` 等组件通过 `$store` 订阅该状态，所以会自动重渲染。

---

## 2. 响应式机制说明

### 2.1 依赖的机制

本实现依赖：

- Svelte `writable` store
- `derived` store
- 组件中的 `$store` 自动订阅

### 2.2 哪些数据是响应式暴露给 UI 的

- `grid`、`userGrid`
- `invalidCells`
- `canUndo`、`canRedo`
- 以及既有的 `gameWon`（由 `userGrid + invalidCells` 推导）

### 2.3 哪些状态留在领域对象内部

- `Game` 的 `undoStack` / `redoStack`
- `Sudoku` 当前内部网格的可变状态
- `Game` 的序列化与快照策略

### 2.4 直接 mutate 为什么有问题

如果在组件里直接写 `$userGrid[y][x] = v`，Svelte 可能无法可靠感知“引用级变化”，导致：

- 视图不刷新或刷新时机不一致
- 撤销/重做历史无法统一维护
- 校验逻辑分散在组件事件中，破坏领域边界

本方案通过“所有写操作都走 `Game/Sudoku`，再统一由 store 发布状态”避免了这些问题。

---

## 3. 相比 HW1 的改进

### 3.1 改进点

1. `Sudoku` 新增并统一承担：
   - `guess`
   - `getInvalidCells`
   - `isSolved`
   - `clone / toJSON / toString`
2. `Game` 统一承担：
   - 历史管理（undo/redo）
   - 对 UI 的操作入口（guess/undo/redo）
3. 新增 store adapter，把领域对象接入真实 Svelte 流程，而不是只在测试中使用。

### 3.2 为什么 HW1 做法不足

原先 UI 直接更新 `userGrid`，Undo/Redo 没有真实接入，导致领域对象和界面流程割裂。  
即使 `Sudoku/Game` 在测试里可用，也不能证明真实界面是由领域模型驱动。

### 3.3 trade-off

- 优点：领域规则集中、可测试性高、UI 更薄
- 代价：增加了一层 adapter，状态映射代码变多
- 折中：保留原组件 API 习惯（仍叫 `grid/userGrid`），降低迁移成本

