import dspy
import os

CONFIGED_LM = None

def configure_lm():
    from dotenv import load_dotenv
    load_dotenv()
    global CONFIGED_LM
    if CONFIGED_LM is not None:
        return CONFIGED_LM
    print("\n--- 🌐 選擇要用的 LLM 模型來源 ---")
    print("1) 本地模型 (Ollama/HF)")
    print("2) OpenAI API")
    print("3) Google Gemini API")
    print("4) Anthropic Claude API")
    
    choice = input("請輸入數字 (1/2/3/4): ").strip()
    
    model_name = None
    api_key = None
    

    if choice == "1":
        # 預設幾個常見本地模型參考
        env_model = os.getenv("OLLAMA_MODEL")
        if env_model:
            print(f"\n偵測到預設模型: {env_model}")
            model_name = input(f"輸入本地模型名稱 (直接按 Enter 使用 {env_model}): ").strip()
            if not model_name:
                model_name = env_model
        else:
            print("\n可用本地模型例子: llama3, gemma3:1b, mistral, phi3")
            model_name = input("輸入本地模型名稱: ").strip()
        
        # 確保本地模型有名稱前綴 (LiteLM 要求)
        if "/" not in model_name:
            model_name = f"ollama/{model_name}"
            print(f"自動修正為 LiteLM 格式: {model_name}")
            
        lm = dspy.LM(model_name)

    elif choice == "2":
        print("\nOpenAI 模型選擇:")
        print("1) openai/gpt-5.2\n2) openai/gpt-4o\n3) openai/gpt-4o-mini\n4) openai/o4-mini\n5) openai/o3-mini")
        idx = input("選擇模型 (1-5): ").strip()
        mapping = {
            "1": "openai/gpt-5.2",
            "2": "openai/gpt-4o",
        }
        model_name = mapping.get(idx, "openai/gpt-5.2")
        api_key = input("輸入 OpenAI API Key (或留空用 OPENAI_API_KEY 環境變數): ").strip() or os.getenv("OPENAI_API_KEY")
        lm = dspy.LM(model_name, api_key=api_key)

    elif choice == "3":
        print("\nGoogle Gemini 模型選擇:\n1) gemini-2.5-flash\n2) gemini-2.5-pro\n3) gemini-3-flash-preview\n4) gemini-3-pro-preview")
        idx = input("選擇模型 (1-4): ").strip()
        mapping = {
            "1": "gemini/gemini-2.5-flash",
            "2": "gemini/gemini-2.5-pro",
            "3": "gemini/gemini-3-flash-preview",
            "4": "gemini/gemini-3-pro-preview"
        }
        model_name = mapping.get(idx, "gemini-2.5-pro")
        api_key = input("輸入 Gemini API Key (或留空用 GEMINI_API_KEY 環境變數): ").strip() or os.getenv("GEMINI_API_KEY")
        lm = dspy.LM(model_name, api_key=api_key)

    elif choice == "4":
        print("\nAnthropic Claude 模型選擇:")
        print("1) claude-opus-4.5-20251101\n2) claude-sonnet-4.5\n3) claude-haiku-4.5")
        idx = input("選擇模型 (1-3): ").strip()
        mapping = {
            "1": "claude/claude-opus-4.5-20251101",
            "2": "claude/claude-sonnet-4.5",
            "3": "claude/claude-haiku-4.5"
        }
        model_name = mapping.get(idx, "claude-opus-4.5-20251101")
        api_key = input("輸入 Claude API Key (或留空用 ANTHROPIC_API_KEY): ").strip() or os.getenv("ANTHROPIC_API_KEY")
        lm = dspy.LM(model_name, api_key=api_key)

    else:
        print(" 選擇無效，預設用 openai/gpt-5.2")
        model_name = "openai/gpt-5.2"
        api_key = os.getenv("OPENAI_API_KEY")
        lm = dspy.LM(model_name, api_key=api_key)

    # 設定為全域預設 LLM
    dspy.configure(lm=lm)
    CONFIGED_LM = lm
    print(f"\n 已設定模型: {model_name}")
    return lm
