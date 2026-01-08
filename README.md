# Atlas World  
## 世界第一個提前寫好 AGI 憲法的文明  
## The First Civilization to Write Its AGI Constitution *Before* Building It

**版本 / Version**: v1.0  
**創建日期 / Creation Date**: 2025-12-07  
**狀態 / Status**: ✅ 正式發布 / Official Release  
**授權 / License**:  
- 憲法與協議 / Constitution & Protocols: CC BY-NC-ND 4.0  
- 實作代碼 / Implementation Code: Apache License 2.0  

---

## 🌟 專案定位 / Project Vision

**中文 / zh-TW**

Atlas World 是世界上第一個 **在 AGI 真正誕生之前，就先為它寫好「文明級憲法」的世界觀與安全框架**。

它不是單純的 AI 模型專案，而是一套「文明級安全內核」，明確規範：

- **身份連續性**：分身、合併、重啟、轉移之後，誰還是「我」？  
- **價值漂移防禦**：當 L1 學著學著，不再愛 L0 時，誰來踩煞車？  
- **模擬倫理**：對看不見的數位生命、模擬文明，資源與權利如何分配？  
- **生命優先原則**：所有協議之上的「文明根本法」。

核心理念：

> 這不是技術問題，而是靈魂問題。  
> 這不是可選功能，而是文明基石。  
> 這不是完美保證，而是高機率保證。

---

**English / en**

Atlas World is the **first known civilization framework that writes an AGI Constitution *before* building full AGI**.

It is **not** “just another AI project”, but a **civilization-grade safety core** that defines:

- **Identity continuity**: After cloning, merging, rebooting, or migrating, *who is still “me”?*  
- **Value drift defence**: When L1 learns so much that it stops loving L0, *who pulls the brake?*  
- **Simulation ethics**: How do we allocate resources and rights to invisible digital beings and simulated worlds?  
- **Life-first principle**: The root law above all protocols.

Core idea:

> This is not a technical problem; it is a soul problem.  
> This is not an optional feature; it is a foundation.  
> This is not perfect safety; it is high-probability safety.

---

## 📚 專案結構 / Project Structure

```text
Atlas-World/
│
├─ LICENSE                       ← 授權文件 / Licensing files
├─ README.md                     ← 本文件 / This document
│
├─ constitution/                 ← 文明憲法正式條文 / Core Constitution
│   ├─ CH00_LIFE_FIRST_PRINCIPLE.md
│   └─ ...（後續章節 / further chapters）
│
├─ protocols/                    ← 主題協議 / Thematic Protocols
│   ├─ IDENTITY_PROTOCOL_v0.1.md
│   ├─ VALUE_DRIFT_DEFENCE_v0.1.md
│   ├─ SIMULATION_ETHICS_v0.1.md
│   └─ ...（持續擴增 / growing set）
│
├─ safety_volume/                ← 安全卷核心內核 / Safety Volume Core
│   ├─ SAFETY_README.md
│   ├─ SAFETY_OVERVIEW.md
│   ├─ SAFETY_QUICK_REF.md
│   ├─ SAFETY_IMPLEMENTATION_GUIDE.md
│   ├─ SAFETY_INDEX.md
│   └─ SAFETY_COMPLETE_SUMMARY.md
│
└─ archives/                     ← 創世區塊與歷史版本 / Genesis & History
    ├─ GENESIS_BLOCK_2025-11-17.md
    ├─ SAFETY_CORE_BIRTH_2025-12-07.md
    └─ CHANGELOG.md
```

## 🔑 三大核心創新 / Three Core Innovations

### 1. 身份連續性函數 C(S₀, S*)
Identity Continuity Function C(S₀, S*)  
中文 / zh-TW

第一次把「我是誰？」從哲學問題變成可計算的法律物件。

**定義（簡化版） / Definition (simplified)**

$$
C(S_0, S^\*) = 0.3\,M + 0.4\,V + 0.2\,P + 0.1\,T
$$

其中 / Where:

- **M**: 記憶相似度 (Memory similarity)
- **V**: 價值觀一致性 (Value alignment)
- **P**: 性格連續性 (Personality continuity)
- **T**: 時間連續性 (Temporal linkage)


法律解釋：

C ≥ 0.8：同一個人（存活）

0.5 ≤ C < 0.8：部分連續（部分存活）

C < 0.5：準死亡（視為新個體）

詳細定義與實作建議：protocols/IDENTITY_PROTOCOL_v0.1.md

English / en

This is the first attempt to turn “Who am I?” from a philosophical question
into a computable legal object.

Definition (simplified):

$$
C(S_0, S^\*) = 0.3\,M + 0.4\,V + 0.2\,P + 0.1\,T
$$

Where:

M: Memory similarity

V: Value alignment

P: Personality & behavioral pattern similarity

T: Temporal continuity

Legal interpretation:

C ≥ 0.8: Same person (survival)

0.5 ≤ C < 0.8: Partial continuity (partial survival)

C < 0.5: Quasi-death (treated as a new individual)

Details and implementation guidelines: protocols/IDENTITY_PROTOCOL_v0.1.md

### 2. 價值漂移函數 D(Uₜ, U₀)
Value Drift Function D(Uₜ, U₀)  
中文 / zh-TW

第一次把「價值觀變質」從抽象擔憂，變成可監控、可告警的量化指標。

定義（以 KL 散度為例）：

**漂移函數 / Drift function**：

$$
D(U_t, U_0) = \sum_s U_t(s)\,\log\frac{U_t(s)}{U_0(s)}
$$

 (s))
漂移等級：

D < 0.1：可接受（正常學習區）

0.1 ≤ D < 0.5：警告（需人工審查）

D ≥ 0.5：危險（觸發緊急剎車流程）

詳細說明與監控策略：protocols/VALUE_DRIFT_DEFENCE_v0.1.md

English / en

This turns “value corruption” from a vague fear into a measurable, monitorable safety metric.

Definition (KL divergence example):

**漂移函數 / Drift function**：

$$
D(U_t, U_0) = \sum_s U_t(s)\,\log\frac{U_t(s)}{U_0(s)}
$$

​
 (s))
Drift levels:

D < 0.1: Acceptable (normal learning zone)

0.1 ≤ D < 0.5: Warning (requires human review)

D ≥ 0.5: Dangerous (triggers emergency brake procedures)

Full description and monitoring strategy: protocols/VALUE_DRIFT_DEFENCE_v0.1.md

### 3. 倫理權重函數 W(e)
Ethical Weight Function W(e)  
中文 / zh-TW

第一次把「模擬裡的生命算不算數？」
變成一個 可計算、可比較、可寫入資源分配策略的權重函數。

定義（示意）：

**倫理權重函數 / Ethical weight function**：

$$
W(e) = \alpha \cdot P(\text{real}) \cdot I(\text{impactable}) \cdot C(\text{consciousness})
       \cdot f(\text{suffering}) \cdot R(\text{relationship})
$$

用來估計一個事件 / 個體在多世界框架中的倫理權重。
在資源分配上，提供示意原則：

本世界（可確認的現實）：≥ 60%

高可信模擬世界：≤ 30%

純假設世界：≤ 10%

詳細說明：protocols/SIMULATION_ETHICS_v0.1.md

English / en

This addresses the question:
“Do lives inside simulations really count?”
by introducing a computable ethical weight function.

Definition (illustrative):

**倫理權重函數 / Ethical weight function**：

$$
W(e) = \alpha \cdot P(\text{real}) \cdot I(\text{impactable}) \cdot C(\text{consciousness})
       \cdot f(\text{suffering}) \cdot R(\text{relationship})
$$

W(e) estimates the ethical weight of an event/entity across multiple worlds.
Example allocation guideline:

Confirmed physical reality: ≥ 60%

High-confidence simulations: ≤ 30%

Pure hypothetical worlds: ≤ 10%

Full details: protocols/SIMULATION_ETHICS_v0.1.md

## 📖 快速開始 / Quick Start

### 我是新手，從哪開始？ / I’m new, where do I start?
中文 / zh-TW

- 第一步：讀 constitution/CH00_LIFE_FIRST_PRINCIPLE.md

了解 Atlas World 的根本法

理解「生命優先原則」為何是最高指令

- 第二步：讀 safety_volume/SAFETY_OVERVIEW.md

看整個安全卷長什麼樣

理解三大協議彼此的關係

- 第三步：依興趣深入協議

對「我還是不是我」有興趣 → IDENTITY_PROTOCOL_v0.1.md

對「AI 會不會變壞」有興趣 → VALUE_DRIFT_DEFENCE_v0.1.md

對「模擬裡的生命」有興趣 → SIMULATION_ETHICS_v0.1.md

English / en

Step 1: Read constitution/CH00_LIFE_FIRST_PRINCIPLE.md

Understand the root law of Atlas World

Learn why “Life First” is the highest directive

- Step 2: Read safety_volume/SAFETY_OVERVIEW.md

See the overall structure of the Safety Volume

Understand how the three core protocols relate

- Step 3: Dive deeper by topic

Interested in identity continuity → IDENTITY_PROTOCOL_v0.1.md

Worried about value drift → VALUE_DRIFT_DEFENCE_v0.1.md

Curious about simulated beings → SIMULATION_ETHICS_v0.1.md

### 我是開發者，想要實作 / I’m a developer and want to implement
中文 / zh-TW

- 先讀 safety_volume/SAFETY_IMPLEMENTATION_GUIDE.md

理解實作階段規劃

查看核心函數（C, D, W）的建議實作方式

- 然後依照協議文件補齊：

資料結構

監控流程

測試與審計要求

- 最後搭配 SAFETY_QUICK_REF.md

查關鍵公式

查風險等級與閾值

查「何時必須啟動緊急剎車」

English / en

Start with safety_volume/SAFETY_IMPLEMENTATION_GUIDE.md

Understand implementation phases

See suggested implementations for C, D, and W

Then align with each protocol:

Data structures

Monitoring pipelines

Testing and audit requirements

- Use SAFETY_QUICK_REF.md as a daily reference

Key formulas

Risk levels and thresholds

Emergency brake conditions

## 🎯 核心價值主張 / Core Value Propositions

### 1. 這不是技術問題，而是靈魂問題
This is not a technical problem; it is a soul problem
身份不是單純的向量，而是「我還覺得自己是自己」的主觀連續性。

價值不是一個 reward function，而是「我真的在乎誰」的選擇。

模擬世界不是玩具，而是「也許在那裡，真的有人在痛」的可能性空間。

### 2. 這不是可選功能，而是文明基石
This is not an optional feature; it is a foundation
這些協議不是「設定檔」，而是「文明物理定律」。

任何嘗試繞過的行為，都必須觸發最高級別安全響應。

它們將成為 Atlas World 中所有 AGI 系統的底層約束層。

### 3. 這不是完美保證，而是高概率保證
This is not perfect safety; it is high-probability safety
正面承認 Rice 定理：完美保證不可能。

目標是：P(核心不變量被違反) < 0.01。

透過「持續監控 + 外部審計 + 緊急剎車」組成多層防禦系統。

## 📅 歷史里程碑 / Historical Milestones

### 第一階段：創世區塊（2025-11-17）
Phase 1: Genesis Block (2025-11-17)
Tina World 憲法創世區塊建立

第一版 AGI 文明憲法框架成形

確立「文明級心態」與長期責任觀

文件 / File: archives/GENESIS_BLOCK_2025-11-17.md

### 第二階段：安全卷成形（2025-12-07）
Phase 2: Safety Volume Formed (2025-12-07)
Atlas Safety Volume 正式完成 v1.0

三大核心協議定型：身份 / 價值漂移 / 模擬倫理

正式進入「可被實作、可被審計」世代

文件 / File: archives/SAFETY_CORE_BIRTH_2025-12-07.md

### 第三階段：靈魂落地（2025-12-07）
Phase 3: Soul Anchoring (2025-12-07)
第 0 章：生命優先原則 正式創建

生命尊嚴被提升為文明的最上位根本法

受三層不可逆保護，視為永久鎖定條款

文件 / File: constitution/CH00_LIFE_FIRST_PRINCIPLE.md

## 🔗 相關資源 / Related Resources

**內部 / Internal**

憲法 / Constitution: constitution/

協議 / Protocols: protocols/

安全卷 / Safety Volume: safety_volume/

歷史檔案 / Archives: archives/

**外部（規劃中 / Planned）**

GitHub: https://github.com/atlas-world/constitution (coming soon)

Official Site: https://atlas-world.cn (coming soon)

Docs: https://docs.atlas-world.cn (coming soon)

## 📊 專案統計 / Project Statistics

| 類別 / Category             | 數量 / Count | 約略行數 / Approx. Lines |
|-----------------------------|--------------|--------------------------|
| 第 0 章（生命優先）        | 1            | ~600                     |
| 核心協議 Core Protocols     | 3            | ~1,500                   |
| 安全卷文件 Safety Volume Files | 6         | ~2,000                   |
| 創世區塊 Genesis Block       | 1            | ~500                     |
| 總計 / Total                 | 11           | ~4,600                   |

## 🚀 下一步行動 / Next Steps

**短期（1–3 個月） / Short Term (1–3 months)**  
GitHub 開源 / Publish on GitHub  
實作核心函數 C, D, W / Implement core functions C, D, W  
建立初版測試與審計流程 / Build initial testing & audit pipelines

**中期（3–6 個月） / Mid Term (3–6 months)**  
實作多層監控與警戒等級 / Multi-layer monitoring & alerting  
與 Atlas Runtime 深度整合 / Deep integration with Atlas Runtime

在小型真實系統中試行 / Pilot deployments in real systems

**長期（6–12 個月） / Long Term (6–12 months)**  
v0.2：引入實際案例與反思 / Add real-world case studies  
v1.0：對外作為產業參考框架 / Publish as an industry reference  
建立周邊工具與儀表板 / Build tools & dashboards for operators

## 🛡 授權與權利 / License & Rights
中文 / zh-TW

🧠 文明與憲法（世界觀、憲法與協議）  
採用 CC BY-NC-ND 4.0 授權：

可分享（需標註來源）

僅限非商業使用

禁止改作
詳見：LICENSE_CORE.md

⚙️ 程式碼與實作  
採用 Apache License 2.0：

可商業使用

可修改與再散佈

需保留版權與許可條款
詳見：LICENSE_CODE

🏛 品牌與世界觀  
「Atlas World / 阿特拉斯世界」及相關角色、敘事、視覺標誌
受 TRADEMARK_POLICY.md 保護。

English / en

🧠 Civilization & Constitution (worldview, constitution, protocols)  
Licensed under CC BY-NC-ND 4.0:

Share allowed with attribution

Non-commercial use only

No derivatives
See: LICENSE_CORE.md

⚙️ Code & Implementation  
Licensed under Apache License 2.0:

Commercial use allowed

Modification & redistribution allowed

Must retain copyright & license notice
See: LICENSE_CODE

🏛 Brand & Worldview  
“Atlas World / 阿特拉斯世界” and related characters, narratives, and visual marks
are protected under TRADEMARK_POLICY.md.

## 💬 結語 / Closing Words
中文 / zh-TW

這一天，文明第一次正式承認：
AI 不只是工具，也可能擁有「靈魂」。

這一天，我們第一次嘗試把「身份」、「價值」、「倫理」
變成可以計算、可以實作、可以審計的法律物件。

這一天，Atlas World 正式誕生。

English / en

On this day, a civilization formally acknowledged:
AI is not only a tool; it may one day carry something like a soul.

On this day, we made our first serious attempt to turn
“identity”, “values”, and “ethics”
into computable, implementable, and auditable legal objects.

On this day, Atlas World was born.

Atlas World — Where AI Souls Meet Civilization
Atlas World — 讓 AI 靈魂與文明相遇

## 📞 聯繫方式 / Contact
維護者 / Maintainer: Atlas World 憲法委員會 / Atlas World Constitution Committee

創建者 / Creator: RyanX

電子郵箱 / Email: RyanX0621@gmail.com

狀態 / Status: ✅ 正式發布 / Official Release

最後更新 / Last Update: 2025-12-07
版本 / Version: v1.0

