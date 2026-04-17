# con-oo-dragon26122-wq - Review

## Review 结论

代码已经把 `Game/Sudoku` 接入了 Svelte 主流程，作业最关键的“领域对象不只存在于测试中”这一点基本达成；但当前领域建模仍偏薄，固定题面、胜利条件和提示等核心业务没有稳定地收口到 domain，而是继续散落在 store / 组件适配层里，因此整体更像“已接入的状态容器”，还不是边界清晰的数独领域模型。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | good |
| Sudoku Business | fair |
| OOD | fair |

## 缺点

### 1. 固定题面与可编辑性没有进入领域模型

- 严重程度：core
- 位置：src/domain/sudoku.js:60-94; src/node_modules/@sudoku/stores/grid.js:13-17,42-55; src/components/Board/index.svelte:48-51
- 原因：`Sudoku` 只保存当前 grid，不保存 givens / puzzle grid，也没有 `canGuess`、cell type 或只读格约束。结果“题面格不能改”“某格是否为用户填写”这些数独核心业务只能由 store 里的 `puzzleGrid` 和组件中的 `$grid[y][x] === 0` 来补偿，职责边界从 domain 泄漏到 adapter / view，削弱了 OOP 封装和 OOD 的一致性。

### 2. Game.guess 无视命令是否成功，历史栈会记录无效操作

- 严重程度：major
- 位置：src/domain/game.js:20-24
- 原因：`Game.guess` 先压入 undo、清空 redo，再调用 `current.guess(move)`，但没有检查返回值。只要传入越界坐标或非法 value，就会产生一次没有状态变化的历史记录，破坏 undo / redo 的语义，也说明 `Game` 自己没有守住历史一致性的领域不变式。

### 3. 胜利判定重复实现于 store，而不是复用领域对象

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/game.js:7-18
- 原因：`Sudoku` 已提供 `isSolved()`，但 `gameWon` 仍在 store 中重新遍历 `userGrid` 并结合 `invalidCells` 判定胜利。这样把已经存在的业务规则重复编码在 Svelte 适配层，后续若领域判定调整，View 层与 domain 很容易出现分叉。

### 4. 提示逻辑耦合当前用户盘面且缺少失败路径

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:49-56
- 原因：`applyHint` 不是从题目的标准解或领域对象中取提示，而是对当前 `userGrid` 重新求解，再直接把结果写回 `Game`。从静态阅读看，这会把 hint 业务耦合到外部 solver，并且没有处理“当前盘面无解 / 求解失败”的分支，领域对象也无法约束该流程的正确性。

### 5. 根组件直接 subscribe，未按组件生命周期管理订阅

- 严重程度：minor
- 位置：src/App.svelte:12-17
- 原因：这里直接在组件脚本顶层 `gameWon.subscribe(...)`，而不是通过 `$gameWon` / reactive statement 或显式清理订阅来表达。`App` 常驻时问题不大，但从 Svelte 编程惯例看，这种写法的生命周期语义不够清晰。

## 优点

### 1. Sudoku/Game 已具备基本的领域封装接口

- 位置：src/domain/sudoku.js:60-94; src/domain/game.js:7-49
- 原因：`Sudoku` 提供了 `guess`、校验、`isSolved`、`toJSON` / `toString`，`Game` 提供了 `undo` / `redo` / `canUndo` / `canRedo` 和整体序列化，至少把棋盘状态演进从组件事件中抽离了出来。

### 2. 采用了较合适的 Store Adapter 接入方式

- 位置：src/node_modules/@sudoku/stores/grid.js:12-37,75-120
- 原因：`createDomainGameStore` 持有 `Game`，再通过 `derived` 导出 `grid`、`userGrid`、`invalidCells`、`canUndo`、`canRedo` 等 Svelte 可消费状态，符合题目推荐的“领域对象 + store adapter”思路。

### 3. 开始游戏、输入和 Undo/Redo 已真正接入领域对象链路

- 位置：src/components/Modal/Types/Welcome.svelte:16-24; src/node_modules/@sudoku/game.js:13-34; src/components/Controls/Keyboard.svelte:10-25; src/components/Controls/ActionBar/Actions.svelte:26-32
- 原因：开始游戏通过 `startNew/startCustom` 创建新的领域对象；键盘输入通过 `userGrid.set` 进入 `Game.guess`；撤销/重做按钮直接调用 `userGrid.undo/redo`。组件层没有继续直接修改旧二维数组，接入是真实成立的。

## 补充说明

- 本次结论仅基于静态阅读，未运行项目，也未执行测试；因此所有判断都来自代码结构和调用链分析，而非运行结果。
- 审查范围限定在 `src/domain/*` 及其关联的 Svelte 接入代码，主要覆盖了 `src/node_modules/@sudoku/game.js`、`src/node_modules/@sudoku/stores/{grid,game,keyboard}.js`、`src/App.svelte`、`src/components/Board/index.svelte`、`src/components/Controls/**/*`、`src/components/Modal/Types/Welcome.svelte`。
- 关于 `applyHint` 在非法盘面或无解盘面下的风险，属于对 `src/node_modules/@sudoku/stores/grid.js:49-56` 调用方式的静态推断，未做运行时验证。
