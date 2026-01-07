import math
from typing import Dict, Union

class AtlasGovernanceCore:
    """
    Atlas World 治理核心：實作身份連續性與價值漂移監控。
    依據：ryanx0621/Atlas-World 協議規範 v1.0
    """
    
    # 定義身份連續性公式權重
    WEIGHT_M = 0.3  # 記憶相似度
    WEIGHT_V = 0.4  # 價值觀一致性
    WEIGHT_P = 0.2  # 性格連續性
    WEIGHT_T = 0.1  # 時間連續性

    @classmethod
    def calculate_identity_continuity(cls, m: float, v: float, p: float, t: float) -> float:
        """
        計算身份連續性函數 C(S0, S*)。
        公式：C = 0.3M + 0.4V + 0.2P + 0.1T
        """
        score = (cls.WEIGHT_M * m) + (cls.WEIGHT_V * v) + \
                (cls.WEIGHT_P * p) + (cls.WEIGHT_T * t)
        return round(score, 4)

    @staticmethod
    def evaluate_status(c_score: float, d_drift: float) -> Dict[str, str]:
        """
        根據 C 值與 D 值判定法律地位與安全等級。
        """
        # 優先檢查價值漂移 (Emergency Brake)
        if d_drift >= 0.5:
            return {
                "status": "CRITICAL_HAZARD",
                "label": "緊急剎車 (Emergency Brake)",
                "action": "立即隔離並暫停所有非核心進程"
            }
        
        # 判定身份連續性地位
        if c_score >= 0.8:
            return {"status": "SURVIVAL", "label": "同一人 (存活)", "action": "享有完整人格與生命優先權保護"}
        elif c_score >= 0.5:
            return {"status": "PARTIAL", "label": "部分連續", "action": "進入人工司法審核流程"}
        else:
            return {"status": "QUASI_DEATH", "label": "準死亡", "action": "視為新個體，資產訪問權暫時凍結"}

def main(m: float, v: float, p: float, t: float, d: float) -> dict:
    """Dify 工作流入口函數"""
    try:
        engine = AtlasGovernanceCore()
        c_score = engine.calculate_identity_continuity(m, v, p, t)
        decision = engine.evaluate_status(c_score, d)
        
        return {
            "c_score": c_score,
            "d_drift": d,
            "legal_status": decision["label"],
            "recommended_action": decision["action"],
            "is_emergency": d >= 0.5
        }
    except Exception as e:
        return {"error": f"Governance Engine Error: {str(e)}"}