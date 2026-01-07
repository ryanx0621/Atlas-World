import dspy
from .signature import InvestigatorSignature

class InvestigatorModule(dspy.Module):
    """
    實作調查者邏輯的 DSPy 模組。
    """
    def __init__(self):
        super().__init__()
        self.investigate = dspy.ChainOfThought(InvestigatorSignature)
    
    def forward(self, system_prompt, user_query, history):
        return self.investigate(
            system_prompt=system_prompt, 
            user_query=user_query, 
            history=history
        )
