# Sudoku

一个数独项目，目标是实现清晰、可靠且易于扩展的数独游戏与核心能力，包括棋盘校验、候选数计算、求解以及题目生成。

## 当前状态

第一版是一个响应式 Web 数独本，可在桌面、iPad 和手机浏览器中使用。它不需要账号或网络服务，游戏进度和完成历史只保存在当前浏览器的 `localStorage` 中。

当前功能：

- 通过首页题库翻阅入门、简单、中等、困难、地狱五个难度的全部题目，每档 1000 题；“题库”与应用名称并列显示在顶部标题行；
- 题库使用与数独棋盘同宽的网格清单，通过固定表头查看每题状态和本地完成记录，底部分页栏显示总题数与已完成数；
- 棋盘底部中央显示 3×3 的 1–9 数字键：短按切换候选数字，长按填写确定数字；
- 长按不同数字会替换当前确定数字，长按相同数字会取消该确定数字；
- 清空按钮短按只清除当前单元格，长按才清除整题并重置本次用时及判错次数；按下时会在信息条显示操作说明约 5 秒；
- 长按清空全部和提交检查使用覆盖棋盘的棋盘格确认层，取消确认不会改变当前进度；清空整题不影响历史最佳记录；
- 游戏页标题栏显示应用名称、难度题号和棋盘格样式的返回题库按钮，第二行使用无内部分隔线的 1×9 信息条，仅显示当前用时和最佳用时；
- 桌面做题区会根据浏览器可用高度等比缩放信息条、棋盘和输入区，确保完整界面一次显示且不产生页面滚动条；
- 判错和完成次数继续记录并在题库中展示，不占用做题页空间；提交结果、清空等临时提示会覆盖 1×9 信息条，继续操作后恢复用时信息；
- 输入区按棋盘九列比例排列：左侧 3×1“清空重做”、中央 3×3 数字键、右侧 3×1“提交检查”；
- 给定数字不可修改，不提供提示或即时冲突校验；
- 主动提交时只告知整体正确或不正确，不标出错位；
- 自动保存当前进度，并记录用时、提交判错次数和最近 100 次完成历史。
- 数独页提供隐藏的开发者三连击入口，可查看当前题目信息或快速填入正确答案。

项目采用原生 HTML、CSS 和 JavaScript ES Modules，领域规则、游戏状态、浏览器存储与界面彼此分离，没有第三方运行时依赖。

## 需求文档

[`requirements/`](requirements/) 是当前产品范围和验收标准的权威来源：

- [需求总览](requirements/README.md)
- [数独页需求](requirements/sudoku-page.md)
- [题库页需求](requirements/puzzle-library-page.md)
- [成长页需求](requirements/growth-page.md)

### 题库来源

内置 5000 道题来自公有领域的
[Sudoku Exchange Puzzle Bank](https://github.com/grantm/sudoku-exchange-puzzle-bank)：
入门取自 Easy 中给定数不少于 40 的题目，简单取自 Easy 中其余题目，中等、困难、
地狱则分别取自 Medium、Hard、Diabolical；每档按给定数降序、来源哈希升序
选择 1000 题。导入时由本项目求解器重新验证唯一解并生成答案。完整来源、上游版本、
文件校验和、选择规则和复现命令见
[`docs/knowledge/sudoku-exchange-import.md`](docs/knowledge/sudoku-exchange-import.md)。
五档题目分别存放为静态模块，页面按当前难度延迟加载，浏览器会缓存已经打开过的
题库文件。

## 开发

需要 Node.js 20 或更高版本。仓库提供统一的自动化入口：

```text
./scripts/setup
./scripts/check
./scripts/test
```

本地启动：

```sh
npm run dev
```

然后访问终端输出的地址（默认 `http://127.0.0.1:4173`）。如需让同一局域网中的设备访问，可运行：

```sh
HOST=0.0.0.0 npm run dev
```

## 在线访问与发布

网站通过 GitHub Pages 托管，访问地址：

<https://hackerful.cn/sudoku/>

推送到 `main` 分支后，GitHub Actions 会先运行仓库的检查和测试，再自动发布
`index.html` 与 `src/` 中的静态资源。也可以在 GitHub 仓库的 Actions 页面中手动运行
“Deploy GitHub Pages”工作流。

详细的工程约束、测试要求和 Agent 协作规范见 [AGENTS.md](./AGENTS.md)。

## 基本规则

默认采用标准 9×9 数独：

- 每个单元格为空或填写 1–9；
- 每一行、每一列和每个 3×3 宫内的数字不能重复；
- 题目给定数字在游戏过程中不可修改；
- 生成的标准题目需要保证解唯一。

## License

暂未指定开源许可证。
E2E smoke test by hepengfei-superagent

B2 base line

B2 comment handled

B8 sudoku issue 1

C1 sudoku

C13 followup

C9 partial

C11 source MR base

C11b source MR baseline
