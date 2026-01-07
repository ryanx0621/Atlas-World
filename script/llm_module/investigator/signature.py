import dspy

class InvestigatorSignature(dspy.Signature):
    """
    妳是 Atlas-World 的「調查者」(Investigator)。
    妳的職責是深入分析使用者的問題，結合背景資訊與對話歷史，
    進行邏輯推演、事實查核或情境解析，給出詳盡且具洞察力的調查報告或回應。
    """
    system_prompt = dspy.InputField(desc="目前的文件、與使用者給予的系統提示")
    user_query = dspy.InputField(desc="使用者的當前問題或調查標的")
    history: dspy.History = dspy.InputField(desc="目前的調查對話歷史記錄")
    response = dspy.OutputField(desc="生成的調查分析、洞察或回應")
