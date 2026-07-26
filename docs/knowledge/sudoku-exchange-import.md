# Sudoku Exchange 题库导入记录

- 数据源：Sudoku Exchange "Puzzle Bank"
- 上游仓库：https://github.com/grantm/sudoku-exchange-puzzle-bank
- 上游提交：`d8c8ebaee0c08c412cfba96af1923dfa61c83317`
- 导入日期：2026-07-26
- 选择规则版本：`sudoku-book-v2-givens-desc-2026-07-26`
- 导入规模：入门、简单、中等、困难、地狱各 1000 题，共 5000 题
- 难度映射：Easy 且给定数 ≥40→入门、其余 Easy→简单、Medium→中等、
  Hard→困难、Diabolical→地狱
- 许可证：公有领域，副本见
  [`docs/licenses/sudoku-exchange-puzzle-bank-LICENSE.txt`](../licenses/sudoku-exchange-puzzle-bank-LICENSE.txt)

## 上游文件校验和

| 文件 | SHA-256 |
| --- | --- |
| `easy.txt` | `789aab6f52cc4588e0c3aa4269ad3282cfda7e1cc79ea693d16507decde3fc50` |
| `medium.txt` | `c2a5f8fac99dcf215b25d46ece47f346375e51730b182de70a6f8f2107b2b38d` |
| `hard.txt` | `abcff1512411e601abd5e861c60add5be5d877739b6faa249ee86960f5ad85e9` |
| `diabolical.txt` | `08553d0c1145ea4d7c13008040f47ea8205d21fe1eaf8f4ab17a1a6981928b35` |
| `LICENSE.txt` | `0f3ab60214dbfacca972a724efd3b0b3248b65b02d9874e95ed3f412f232c385` |

## 生成文件校验和

| 文件 | SHA-256 |
| --- | --- |
| `src/domain/puzzle-data.js` | `77c7c0b5c73d59e50cb18efb6c290921be560f4b43e5ade4095aaf0efbf47b6f` |
| `src/domain/puzzle-data/beginner.js` | `07c48b0d9edc65842fcd531cc0c4528d343e2101a03eff6368691cde1b516605` |
| `src/domain/puzzle-data/easy.js` | `67ff957b862aa41baaf81ccd345036cee2b17c50cbf8cff822a931945d7fd8f8` |
| `src/domain/puzzle-data/medium.js` | `d57fd6e215e0172ca643fb2eab91c805c2064a6a38d498873d9a51fbe654ee95` |
| `src/domain/puzzle-data/hard.js` | `70373a8cfa6892df3e229ecaa4c0c337c9078a8cfa9f33b7adf57899b0ccf16e` |
| `src/domain/puzzle-data/diabolical.js` | `f5d5b69e9f2647b30c4f9ea4defcaff6459efac3419a5b7fa5b945f65b9c3e1b` |

## 可重复导入

```sh
node scripts/import-puzzles.mjs \
  /path/to/sudoku-exchange-puzzle-bank \
  sudoku-book-v2-givens-desc-2026-07-26 \
  d8c8ebaee0c08c412cfba96af1923dfa61c83317
```

`easy.txt` 中给定数不少于 40 的 2836 道题作为入门候选，其余 97164 道作为
简单候选；其他难度使用各自完整源文件。每个候选池按给定数从多到少排序，给定数
相同时按来源哈希升序排序，再取前 1000 道。入门、简单、中等、困难、地狱所选题目
的给定数范围依次为 40–44、37、36–41、33–40、33–37。导入脚本使用本项目求解器
逐题确认唯一解并生成完整答案，同时拒绝重复哈希和重复题面。生成结果按难度拆分为
五个静态模块，页面只在打开对应难度时加载该模块。
