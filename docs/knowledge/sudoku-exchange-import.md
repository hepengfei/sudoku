# Sudoku Exchange 题库导入记录

- 数据源：Sudoku Exchange "Puzzle Bank"
- 上游仓库：https://github.com/grantm/sudoku-exchange-puzzle-bank
- 上游提交：`d8c8ebaee0c08c412cfba96af1923dfa61c83317`
- 导入日期：2026-07-26
- 固定随机种子：`sudoku-book-v1-2026-07-26`
- 导入规模：Easy、Medium、Hard、Diabolical 各 1000 题
- 难度映射：Easy→简单、Medium→中等、Hard→困难、Diabolical→地狱
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
| `src/domain/puzzle-data.js` | `9a60db4d09d38efb74a72a9df5ab4b2b014d185f0e9386c95de420d57132a94a` |
| `src/domain/puzzle-data/easy.js` | `171721b458e2ea6ceccee7674d554613e48d82b9acfc5cd408889d4bb830acbb` |
| `src/domain/puzzle-data/medium.js` | `212e2efc02df6717ad503276479b70218879203bb83f55f754219924e183f2e1` |
| `src/domain/puzzle-data/hard.js` | `422e0da4b4f2782068e833c6a837f5d0335da02c6850e2c055bd7f9f84de1d71` |
| `src/domain/puzzle-data/diabolical.js` | `f3b3ac5540ed7bc275f96abe4cc5c4f33605e2cd68f28d88a20415cc237a2cc2` |

## 可重复导入

```sh
node scripts/import-puzzles.mjs \
  /path/to/sudoku-exchange-puzzle-bank \
  sudoku-book-v1-2026-07-26 \
  d8c8ebaee0c08c412cfba96af1923dfa61c83317
```

导入脚本使用固定种子分别进行无放回抽样，再使用本项目求解器逐题确认唯一解并生成
完整答案。导入时还会拒绝重复哈希和重复题面。生成结果按难度拆分为四个静态模块，
页面只在打开对应难度时加载该模块。
