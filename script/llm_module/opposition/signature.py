import dspy

def load_prompt() -> str:
    with open(__file__.replace("signature.py", "prompt.md"), "r", encoding="utf-8") as f:
        return f.read()

class OppositionSignature(dspy.Signature):
    """
    作為 Atlas-World 的反對派或監督者，根據文明憲法與原則，
    對目前的對話歷史提出挑戰、建設性批評或不同的觀點。
    """
    __doc__ = load_prompt()
    system_prompt = dspy.InputField(desc="目前的文件、與使用者給予的系統提示")
    history: dspy.History = dspy.InputField(desc="目前的對話歷史記錄")
    response = dspy.OutputField(desc="提出的反對點、批評或深度思考建議")
