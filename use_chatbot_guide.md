# Atlas-World Chatbot 使用說明

這份文件旨在協助使用者快速了解、安裝並啟動 Atlas-World Chatbot。透過本指南，您將學會如何設定本地或雲端的 LLM（大型語言模型）環境，並順利運行聊天機器人服務。

## 1. 用到的工具簡介

- uv
	1. 是什麼：一個開發/執行工具（project runner），本專案使用 `uv run` 來啟動 Python 應用。
	2. 可以幹嘛：統一啟動/同步專案環境、執行腳本與管理工作流程。
	3. 類比：像是遙控器，可以一鍵啟動/控制整個應用或開發流程。

- Python
	1. 是什麼：主要程式語言，用來編寫後端、處理邏輯與呼叫 LLM。
	2. 可以幹嘛：執行 Web 伺服器（Flask）、載入 DSPy 與 LLM 模組、處理 API 請求。
	3. 類比：像是廚師，按照配方（程式）處理材料（資料）並輸出菜餚（回應）。

- LLM（大型語言模型）
	1. 是什麼：訓練好的語言模型（如 Gemini、OpenAI、Ollama 的本地模型），能生成文字回應與推理。
	2. 可以幹嘛：回答問題、產生建議、分析文本、模擬角色（例如 Investigator / Opposition）。
	3. 類比：像是一位資深顧問，根據你提供的背景與問題給出專業建議。

- Ollama
	1. 是什麼：一個可以在本地運行 LLM 的工具/服務（提供 CLI 與本地模型庫）。
	2. 可以幹嘛：在本機啟動模型的伺服器（`ollama run <model>`），讓本地程式透過 API 呼叫模型，避免每次都使用遠端 API。
	3. 類比：像是把顧問搬到你自己辦公室（本地伺服器），不必每次都連外部雲端。

- DSPy
	1. 是什麼：一個用來串接 LLM、定義 module/signature、管理 conversation history 的框架。
	2. 可以幹嘛：把具體的「調查者/反對者」邏輯封裝成可重複使用的 module 並管理對話狀態。
	3. 類比：像是劇本導演，協調演員（LLM）並記錄劇情（History）。

- Flask
	1. 是什麼：輕量級 Python Web 框架，用來建立 API 與前端頁面。
	2. 可以幹嘛：提供 `/investigate`、`/oppose` 等 API 給前端呼叫。
	3. 類比：像是前台接待員，接收請求並回傳結果。

## 2. 三個主要批次檔與使用方式（詳細）

下面說明的三個檔案位於專案根目錄：

- `一鍵啟動Ollama+ChatBot.bat`
	- 用途：一鍵檢查/下載指定模型、在新視窗啟動 Ollama 模型後端，然後啟動 Python Chatbot（Flask + DSPy）。
	- 使用步驟：
		1. 雙擊執行此 `.bat`（或在 PowerShell 中執行）。
		2. 畫面會列出本地模型清單，輸入你要使用的模型名稱（或直接按 Enter 使用預設 `gemma3:1b`）。
		3. 若模型不存在，腳本會自動執行 `ollama pull <model>` 來下載（需網路與時間）。
		4. 下載並啟動後，腳本會在新視窗執行 `ollama run <model>`（此視窗請勿關閉）。
		5. 主視窗會接著執行 `uv run ./script/chatbot.py`，啟動 Flask 服務與 DSPy 模組。此時請注意命令列是否提示需要輸入 LLM 設定選項（若有）。
	- 注意事項：
		- 若系統無 `ollama`，會提示安裝。請先安裝並把 `ollama` 放入 PATH。
		- 若出現記憶體錯誤，請參考 README 或提升 WSL/Docker 的可用記憶體。
		- 若要手動安裝模型，可在終端執行：
			```
			ollama pull <model_name>
			```

- `一鍵安裝uv+python+各種package.bat`
	- 用途：準備開發環境、安裝 `uv` 與同步專案所需套件（視系統與 `uv` 設定而定）。
	- 使用步驟：
		1. 雙擊或在 PowerShell 執行此 `.bat`。
		2. 若 `uv` 尚未安裝，請依檔內註解使用 `winget` 或手動安裝 `uv` 與 Python。
		3. 此腳本會執行 `uv sync`（基於專案的 `uv` 設定），安裝/同步所需依賴。
	- 注意事項：
		- 本專案的 Python 版本需求可見 `pyproject.toml`（例如 >=3.13）；請確保系統 Python 版本相容或使用虛擬環境。
		- 若你不使用 `uv`，可手動建立虛擬環境並安裝套件：
			```bash
			python -m venv .venv
			.venv\Scripts\Activate.ps1
			pip install -r requirements.txt  # 或依 pyproject 安裝
			```

- `一鍵啟動ChatBot.bat`
	- 用途：啟動 Python Chatbot。此腳本支援選擇多種模型來源，包含本地的 Ollama 模型或是透過 API 存取的 Gemini、OpenAI、Anthropic 等雲端模型。
	- 使用步驟：
		1. 若使用本地模型（Ollama），請先確保模型已在其他視窗啟動（`ollama run <model>`）。若使用 Gemini 等雲端 API，請確保已在 `.env` 中填寫對應的 API Key。
		2. 直接執行此 `.bat`，它會執行 `uv run ./script/chatbot.py`。
		3. 啟動後，請在終端機（Terminal）畫面中根據提示選擇要使用的模型來源（例如輸入 `3` 選擇 Gemini）。
		4. 成功啟動 Flask API 與前端介面後，即可開始對話。
	- 注意事項：
		- 若執行後瀏覽器顯示「Network Error: Failed to fetch」，請先確認後端伺服器已完全啟動（在終端看到 `Running on http://127.0.0.1:5000`），並確認 CORS 已開啟（本專案已啟用）。

## 3. 常見問題與除錯小技巧

- 如果瀏覽器顯示 `Failed to fetch`：
	- 確認 `chatbot.py` 伺服器已啟動並在 5000 port 運行。
	- 確認你在批次檔中已選好模型（若 `configure_lm()` 還在等待輸入，請先完成）。

- 如果 `ollama pull` 失敗：
	- 確認網路連線、模型名稱拼寫正確，或改用 Ollama 官網的 library 頁面查詢正確 model id。

- 如果看到亂碼或奇怪符號：
	- 確認批次檔與 Python 檔案均以 UTF-8 無 BOM 編碼儲存，Windows 預設有時會造成亂碼。

## 4. 常用手動命令（參考）
```powershell
# 啟動 Ollama 後端（範例）
ollama run gemma3:1b

# 手動 pull 模型
ollama pull gemma3:1b

# 啟動 chatbot（若不使用 bat）
uv run ./script/chatbot.py

# 或使用虛擬環境直接啟動
.venv\Scripts\Activate.ps1
python ./script/chatbot.py
```
