import logging
import pickle
import os
SAVE_FILE_NAME="惡臭的紅茶嗚嗚嗚嗚呃呃呃呃啊啊啊啊啊啊啊啊.gc"
sfn=SAVE_FILE_NAME
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
def db(*txt):
    txt=[str(n) for n in txt]
    msg=" ".join(txt)
    logging.debug(msg)
def dumpGc(gc):
    print("正在調製永久昏睡紅茶....")
    with open(sfn,"wb") as f:
        pickle.dump(gc,f)
def loadGc():
    
    with open(sfn,"rb") as f:
        gc=pickle.load(f)
        print("吃這麼好喔還吃不完兜著走（大喜）")
        return gc
def flatten(data):
    result = []
    for item in data:
        if isinstance(item, (tuple, list)):
            result.extend(flatten(item))
        else:
            result.append(item)
    return tuple(result)

class Layer:
    def __init__(self, nodes):
        self.nodes = nodes
        db("layer類別構建式收到數量",len(nodes))
    def __call__(self, next_node):
        cursor = next_node
        db(f"我得到了嗚嗚呃呃{len(self.nodes)}個節點")
        for node in reversed(self.nodes):

            if isinstance(node, (tuple, list)):
                node[1](cursor)
                node[0](cursor)
                db(f"ok{repr(node[1])} 被連到 {repr(cursor)}")
                cursor = node
            else:
                cursor = node(cursor) 
                db(f"ok {repr(node)} 連到 {repr(cursor)}")

        return cursor

class Gc:
    def __init__(self, txt=None):
        self.l = None
        self.r = None
        self.txt=txt
        self.finaltxt = ""
        self.ltxt = ""
        self.rtxt = ""

    def __str__(self):
        return str(self.finaltxt)

    def get(self, code):
        if self.l is None:
            return None
        if code == "l":
            self.l.render("l")
            return self.l
        if code == "r":
            self.r.render("r")
            return self.r
        return None

    def render(self, code):
        sit = {
            "r": (self.rtxt, ""),
            "l": ("", self.ltxt),
        }
        si = sit[code]
        self.finaltxt = self.txt.format(r=si[0], l=si[1])

    def spec(self, l="", r=""):
        self.ltxt = l
        self.rtxt = r      
        return self

    def __call__(self, *args, **kargs):
        args = flatten(args)
        if len(args) < 2:
            args = args * 2
        if kargs:
            if kargs["r"]:
                self.r = kargs["r"]
            if kargs["l"]:
                self.l = kargs["l"]
        if args:
            self.r = args[0]
            self.l = args[1]
        return self

    def __repr__(self):
        l = self.txt[:10].strip() if self.txt else ""
        return l

    @staticmethod
    def Layer(*args):
        db("在Gc類別中的layer收到數量",len(args))
        nar=list(args)
        ch=Layer(nar)

        return ch(None)
def setGc(root):
    print("載入劇情.....")
    if os.path.isfile(sfn):
        root(loadGc())
        return 
    from scene import ch1
    root(ch1)
    print("完成！r或者l繼續")

