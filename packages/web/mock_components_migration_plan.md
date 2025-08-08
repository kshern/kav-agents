# Mock 组件迁移规划

> 目标：将 **StockAnalysisPage** 页面中使用的 `Mock` 组件（`MockCard`、`MockButton`、`MockInput`、`MockProgress` 等）迁移到项目正式组件目录，并替换页面中的引用。

## 一、背景说明

在当前页面代码中，为了独立演示，临时创建了若干 _Mock_ 组件。这些组件的功能、样式已在项目其它位置实现（如 `src/components/Card`、`src/components/CButton` 等）。为了保持代码一致性，需要将这些 _Mock_ 组件：

1. 提炼为 **可复用 UI 组件**，放入 `src/components` 对应子目录；
2. 替换页面内的 `Mock*` 引用为正式组件路径；
3. 清理页面中冗余的 `Mock` 代码。

## 二、待迁移组件清单

| Mock 组件                                                                                   | 功能描述       | 目标目录                   |
| ------------------------------------------------------------------------------------------- | -------------- | -------------------------- |
| `MockCard` / `MockCardHeader` / `MockCardTitle` / `MockCardDescription` / `MockCardContent` | 卡片及其子组件 | `src/components/Card`      |
| `MockButton` (`CButton`)                                                                    | 按钮           | `src/components/CButton`   |
| `MockInput` (`CInput`)                                                                      | 输入框         | `src/components/CInput`    |
| `MockProgress` (`CProgress`)                                                                | 进度条         | `src/components/CProgress` |

> 以上目标目录均位于 `d:/ai/agent/trade/kav/packages/web/` 下。

## 三、目录结构示例

```text
packages/web/
└─ src/
   └─ components/
      ├─ Card/
      │  ├─ index.tsx
      │  ├─ CardHeader.tsx
      │  ├─ CardTitle.tsx
      │  ├─ CardDescription.tsx
      │  └─ CardContent.tsx
      ├─ CButton/
      │  └─ index.tsx
      ├─ CInput/
      │  └─ index.tsx
      └─ CProgress/
         └─ index.tsx
```

## 四、实施步骤

- [ ] **梳理组件代码**
  - 在页面文件中定位 `Mock*` 组件实现。
  - 对比项目已有组件，确认差异。
- [ ] **创建/更新目标目录**
  - 若目录不存在，创建对应文件夹及 `index.tsx` 文件。
  - 拆分 `Card` 子组件，保持原有命名。
- [ ] **迁移代码**
  - 将 `Mock` 组件逻辑、样式复制到目标文件，补充中文注释，移除 any。
  - 如果已有实现，合并差异或直接引用。
- [ ] **更新页面引用**
  - 修改 `import` 路径，例如：
    ```ts
    // before
    import { CCard } from "./page.tsx";
    // after
    import { Card } from "@/components/Card";
    ```
- [ ] **测试验证**
  - 启动项目，检查页面在 _idle / processing / complete_ 三种状态下是否正常渲染。
  - 查看按钮、输入框、进度条、卡片样式与交互。
- [ ] **代码清理**
  - 删除页面中的 `Mock` 组件定义。
  - 运行 `pnpm lint` / `pnpm typecheck` 确保无错误。

## 五、后续工作

1. 若迁移过程中发现共通样式，可抽取到全局 `ui` 库。
2. 更新 Storybook（若有）以覆盖新组件。
3. 更新文档，说明组件 API 与使用示例。

---

生成时间：2025-07-30
