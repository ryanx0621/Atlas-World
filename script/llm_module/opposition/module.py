import dspy
from .signature import OppositionSignature

class OppositionModule(dspy.Module):
    """
    提供反向思考與監察邏輯的 DSPy 模組。
    """
    def __init__(self):
        super().__init__()
        self.predictor = dspy.ChainOfThought(OppositionSignature)

    def forward(self, system_prompt, history):
        # history 應為 dspy.History 物件
        result = self.predictor(system_prompt=system_prompt, history=history)
        return result.response
