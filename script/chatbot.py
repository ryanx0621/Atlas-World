from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import dspy
from script.llm_config import configure_lm
from script.llm_module.investigator.module import InvestigatorModule
from script.llm_module.opposition.module import OppositionModule

# Ensure Flask can find the templates folder
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
template_dir = os.path.join(base_dir, 'templates')
app = Flask(__name__, template_folder=template_dir)
CORS(app)

# Initialize DSPy with user-chosen LM
print("正在啟動 LLM 配置引導...")
configure_lm()
investigator = InvestigatorModule()
opposer = OppositionModule()

# 使用官方 dspy.History 管理
chat_history = dspy.History(messages=[])

port = int(os.getenv("PORT") or 5000)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/investigate', methods=['POST'])
def investigate_endpoint():
    try:
        data = request.json
        user_content = data.get('userContent')
        system_prompt = data.get('systemPrompt') or ""

        readme_path = os.path.join(base_dir, 'README.md')
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                readme_content = f.read()
            system_prompt += "\n--- 背景資訊 ---\n" + readme_content

        if not user_content:
            user_content = "請進行調查"

        # 使用調查者模組
        result = investigator(system_prompt=system_prompt, user_query=user_content, history=chat_history)
        
        # 更新歷史軌跡
        chat_history.messages.append({"user_query": user_content, "response": result.response})

        return jsonify({'response': result.response})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/oppose', methods=['POST'])
def oppose_endpoint():
    try:
        data = request.json
        system_prompt = data.get('systemPrompt') or ""

        readme_path = os.path.join(base_dir, 'README.md')
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                readme_content = f.read()
            system_prompt += "\n--- 背景資訊 ---\n" + readme_content

        # 反對者模組主要基於當前對話歷史提出挑戰
        result = opposer(system_prompt=system_prompt, history=chat_history)
        
        # 反對者的回應通常也要更新進歷史，以便調查者下一次能回應反對點
        chat_history.messages.append({"user_query": "[監察反對請求]", "response": result})

        return jsonify({'response': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset_history():
    try:
        global chat_history
        chat_history = dspy.History(messages=[])
        return jsonify({'status': '歷史記錄已重置'})
    except Exception as e:
        print(f"Reset error: {e}")
        return jsonify({'error': str(e)}), 500

# 保留 /chat 以相容舊前端，指向預設調查者
@app.route('/chat', methods=['POST'])
def chat_endpoint():
    return investigate_endpoint()

if __name__ == '__main__':
    # 注意：debug=True 會自動啟動 Reloader 導致兩次 Prompt
    # 這裡關閉它以確保只需輸入一次模型配置
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)
