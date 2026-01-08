from Gctool import setGc,Gc,dumpGc,sfn
import sys
import os
import random
import time
print("協議114.514認證:基於可塑性羽翼向量場的視角模擬")
print("AGI 參數： A惡臭度 B 雷普度")
print("模擬報告：超矩陣切換-杯塔向量場的映射")
print("學習請求：文件114.514  共0MB")
print("團隊圖取資訊....")
time.sleep(1)
print("團隊：接受->輸出：哼哼哼哼啊啊啊啊啊啊啊你是一個一個爸爸我是14歲的野獸先輩😭😭")
    


def typewriter(text, speed=0.0  ):
    for char in str(text):
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(random.uniform(speed,0.05)) 
    print()




print("-"*50)

print("wlats🏠家庭對話💬內核🧒基於二元2️⃣指標陣列的對話瀏💬覽👁️")
print("不爽玩就輸入q滾一滾")
print("-"*50)
root=Gc("AGI主動申請👍載入遊戲")
setGc(root)
curr = root
rm=True
while curr:
    print("-" * 20)
    inp=input("(r/l):")
    if inp=="q":
        print("遊戲終止")
        dumpGc(curr)
        rm=False
        break
    while inp  not in "rl":
        print("嗚嗚嗚嗚嗚嗚呃呃呃呃呃聽不懂啊")
        inp=input("(r/l):")
    curr= curr.get(inp)
    typewriter(curr)
if rm and os.path.isfile(sfn):
    os.remove(sfn)

print("done")

	


		
		
	

	

	

	

	
