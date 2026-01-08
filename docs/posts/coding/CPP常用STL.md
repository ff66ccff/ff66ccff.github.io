

# C++ 竞赛（CSP）常用 STL 全注释版

## 1. 基础容器：`array` / `vector` / `string`

### 1.1 `array`（定长数组）

```cpp
#include <array>              // 1. 引入 array 头文件

// 2. 定义一个长度固定、元素类型为 int 的 array
std::array<int, 100005> a;    // 模板参数第二个是长度，必须是编译期常量

// 3. 用 fill 统一赋值
a.fill(0);                    // 把所有元素赋值为 0，复杂度 O(n)

// 4. 按下标访问
a[0] = 1;                     // 访问/修改下标 0 的元素，O(1)
int x = a[0];                 // 读取下标 0 的元素

// 5. 查询大小
std::size_t n = a.size();     // 返回 array 的长度，这里是 100005

// 6. 判断是否为空（常用在通用代码里）
bool emp = a.empty();         // 如果 size 为 0 则为 true，这里恒为 false

// 7. 遍历
for (std::size_t i = 0; i < a.size(); ++i) { // 经典 for
    int v = a[i];             // 依次访问每个元素
}
```

### 1.2 `vector`（变长数组，最常用）

```cpp
#include <vector>             // 1. 引入 vector 头文件

// 2. 定义一个存 int 的动态数组
std::vector<int> v;           // 初始 size = 0, capacity = 0

// 3. 尾部插入元素
v.push_back(3);               // 在末尾插入一个 3，均摊 O(1)
v.push_back(5);               // 再插入一个 5，此时 v = {3, 5}

// 4. 访问元素
int a0 = v[0];                // 直接用下标访问（不检查越界），O(1)
int a1 = v.at(1);             // 使用 at，会做越界检查（略慢）

// 5. 访问并删除末尾元素
int last = v.back();          // 访问最后一个元素，这里是 5
v.pop_back();                 // 删除最后一个元素，O(1)，现在 v = {3}

// 6. 查询当前元素个数
std::size_t sz = v.size();    // 这里 sz = 1

// 7. 预分配容量（重要的性能优化）
v.reserve(100000);            // 提前分配容量为 100000，避免多次扩容

// 8. 一次性构造某个大小的 vector
std::vector<int> v2(10, 0);   // 长度为 10，所有元素初值为 0

// 9. 使用迭代器遍历
for (auto it = v2.begin(); it != v2.end(); ++it) {
    int val = *it;            // 通过迭代器解引用访问元素
}

// 10. 范围 for 遍历
for (int val : v2) {          // C++11，语法更简洁
    // 使用 val
}

// 11. 清空元素但保留容量
v.clear();                    // size 变 0，capacity 不变
```

### 1.3 `string`（字符串）

```cpp
#include <string>             // 1. 引入 string 头文件
#include <iostream>           // 2. 用于输入输出

std::string s;                // 3. 定义一个空字符串

std::cin >> s;                // 4. 读入到空白字符为止（不包含空格）

std::getline(std::cin, s);    // 5. 一次读入整行（包含空格），到换行结束

std::size_t len = s.size();   // 6. 获取字符串长度（O(1)）

char c0 = s[0];               // 7. 访问第 0 个字符（不检查越界）
char c1 = s.at(1);            // 8. 访问第 1 个字符（会做越界检查）

s.push_back('a');             // 9. 在末尾添加一个字符 'a'
s.pop_back();                 // 10. 删除末尾 1 个字符

std::string t = "xyz";
std::string u = s + t;        // 11. 字符串拼接（整体 O(|s|+|t|)）

std::string sub = s.substr(2, 3); // 12. 从下标 2 开始，取长度为 3 的子串

std::size_t pos = s.find("abc");  // 13. 查找子串 "abc" 的起始位置
if (pos == std::string::npos) {   // 若未找到，返回 npos
    // 未找到
}
```

---

## 2. 有序关联容器：`set` / `multiset` / `map` / `multimap`

### 2.1 `set`（不重复、有序集合）

```cpp
#include <set>                // 1. 引入 set 头文件

// 2. 定义一个存 int 的 set，自动按升序排列，且不允许重复
std::set<int> s;

s.insert(3);                  // 3. 插入 3，O(log n)
s.insert(1);                  // 4. 插入 1，集合内容为 {1, 3}
s.insert(3);                  // 5. 再插 3 不会生效（set 元素唯一）

bool has1 = s.count(1);       // 6. 判断是否有 1，有则为 1，没有为 0，O(log n)
bool has2 = s.count(2);       // 7. 判断是否有 2，这里为 0

int mn = *s.begin();          // 8. 取最小值（第一个元素），这里是 1，O(1)
int mx = *s.rbegin();         // 9. 取最大值（最后一个元素），这里是 3，O(1)

auto it = s.lower_bound(2);   // 10. 找到第一个 >= 2 的迭代器，这里指向 3
// 若 it == s.end()，说明不存在 >= 2 的元素

auto it2 = s.upper_bound(1);  // 11. 找到第一个 > 1 的迭代器，这里同样指向 3

s.erase(3);                   // 12. 按值删除 3，O(log n)

for (int x : s) {             // 13. 中序遍历，得到升序序列
    // 依次访问集合中的每个元素
}
```

### 2.2 `multiset`（可重复、有序集合）

```cpp
#include <set>                // multiset 也在 <set> 头文件中

// 1. 定义一个 multiset，可以存重复元素，自动升序
std::multiset<int> ms;

ms.insert(3);                 // 2. 插入一个 3
ms.insert(3);                 // 3. 再插入一个 3，现在有两个 3
ms.insert(5);                 // 4. 插入一个 5，内容为 {3, 3, 5}

std::size_t c = ms.count(3);  // 5. 统计 3 的个数，这里是 2，O(k + log n)

auto it = ms.find(3);         // 6. 找到任意一个等于 3 的迭代器，O(log n)
if (it != ms.end()) {
    ms.erase(it);             // 7. 只删除这一个 3，剩下 {3, 5}
}

ms.erase(3);                  // 8. 再按值删除所有 3，剩下 {5}

for (int x : ms) {            // 9. 以升序遍历所有元素（包含重复）
    // ...
}
```

### 2.3 `map`（key 唯一、有序字典）

```cpp
#include <map>                // 1. 引入 map 头文件
#include <string>             // 2. key 用 string 时需引入

// 3. 定义一个 map，key 为 string，value 为 int
std::map<std::string, int> mp;

mp["alice"] = 3;              // 4. 通过下标插入/修改，log n
mp["bob"] = 5;

int x = mp["alice"];          // 5. 访问 key 为 "alice" 的 value，若不存在会插入 0

bool hasBob = mp.count("bob");// 6. 判断是否存在 key "bob"，O(log n)

auto it = mp.find("alice");   // 7. 使用 find 查找（不插入），不存在返回 end()

if (it != mp.end()) {         // 8. 确认存在后再访问
    std::string k = it->first;// 9. 迭代器指向 pair<key, value>
    int v = it->second;
}

mp.erase("bob");              // 10. 按 key 删除这个键值对，O(log n)

for (auto &kv : mp) {         // 11. 遍历时按 key 升序
    std::string name = kv.first;
    int score = kv.second;
}
```

### 2.4 `multimap`（key 可重复、有序字典）

```cpp
#include <map>                // multimap 也在 <map> 中
#include <string>

// 1. 定义一个 multimap，允许同一个 key 对应多个 value
std::multimap<std::string, int> mm;

mm.insert({"a", 1});          // 2. 插入 key="a", value=1
mm.insert({"a", 2});          // 3. 再插入 key="a", value=2

// 4. equal_range 返回一段区间，包含所有 key=="a" 的元素
auto range = mm.equal_range("a");

// 5. 遍历所有 key=="a" 的 value
for (auto it = range.first; it != range.second; ++it) {
    std::string k = it->first;// 恒为 "a"
    int v = it->second;       // 依次为 1、2
}
```

---

## 3. 无序关联容器：`unordered_set` / `unordered_map`

### 3.1 `unordered_set`（哈希集合）

```cpp
#include <unordered_set>      // 1. 引入 unordered_set 头文件

// 2. 定义一个无序、元素唯一的哈希集合
std::unordered_set<int> us;

us.insert(3);                 // 3. 插入 3，均摊 O(1)
us.insert(5);                 // 4. 插入 5

bool has3 = us.count(3);      // 5. 判断是否有 3，O(1) 均摊
bool has7 = us.count(7);      // 6. 判断是否有 7，这里为 0

us.erase(3);                  // 7. 删除 3，O(1) 均摊

for (int x : us) {            // 8. 遍历所有元素（顺序不保证）
    // ...
}
```

### 3.2 `unordered_map`（哈希字典）

```cpp
#include <unordered_map>      // 1. 引入 unordered_map
#include <string>

// 2. 定义一个无序字典：string -> int
std::unordered_map<std::string, int> um;

um["apple"] = 2;              // 3. 插入/修改 key="apple" 对应的值为 2，均摊 O(1)

bool has = um.count("apple"); // 4. 是否存在这个 key

int v = um["apple"];          // 5. 访问 value；若 key 不存在会插入默认值 0

auto it = um.find("banana");  // 6. 查找但不插入，不存在则为 end()

if (it != um.end()) {
    std::string k = it->first;
    int val = it->second;
}

um.erase("apple");            // 7. 删除 key 为 "apple" 的键值对
```

---

## 4. 线性容器：`queue` / `stack` / `deque` / `priority_queue`

### 4.1 `queue`（队列，FIFO）

```cpp
#include <queue>              // 1. 引入 queue 头文件

std::queue<int> q;            // 2. 定义一个 int 队列

q.push(1);                    // 3. 把 1 放到队尾
q.push(2);                    // 4. 把 2 放到队尾，此时队列为 [1, 2]

int f = q.front();            // 5. 查看队头元素（不删除），这里是 1

q.pop();                      // 6. 弹出队头元素，这里删除 1，剩 [2]

bool emp = q.empty();         // 7. 判断队列是否为空
std::size_t cnt = q.size();   // 8. 获取当前队列长度
```

### 4.2 `stack`（栈，FILO）

```cpp
#include <stack>              // 1. 引入 stack 头文件

std::stack<int> st;           // 2. 定义一个 int 栈

st.push(1);                   // 3. 把 1 压入栈顶
st.push(2);                   // 4. 再压入 2，此时栈顶是 2

int t = st.top();             // 5. 查看栈顶元素（不弹出），这里是 2

st.pop();                     // 6. 弹出栈顶元素，删除 2，栈顶变成 1

bool empS = st.empty();       // 7. 栈是否为空
std::size_t ssz = st.size();  // 8. 当前栈内元素个数
```

### 4.3 `deque`（双端队列）

```cpp
#include <deque>              // 1. 引入 deque 头文件

std::deque<int> dq;           // 2. 定义一个双端队列

dq.push_back(1);              // 3. 从尾部插入 1，队列为 [1]
dq.push_front(2);             // 4. 从头部插入 2，队列为 [2, 1]

int f = dq.front();           // 5. 查看头部元素，这里是 2
int b = dq.back();            // 6. 查看尾部元素，这里是 1

dq.pop_front();               // 7. 从头部弹出，删除 2，队列为 [1]
dq.pop_back();                // 8. 从尾部弹出，删除 1，队列为空

int x = dq[0];                // 9. 随机访问，类似 vector，O(1)
```

### 4.4 `priority_queue`（优先队列，堆）

**大根堆（默认）**

```cpp
#include <queue>              // priority_queue 在 <queue> 中

// 1. 默认是大根堆：top() 是最大值
std::priority_queue<int> pq;

pq.push(3);                   // 2. 插入 3
pq.push(1);                   // 3. 插入 1
pq.push(5);                   // 4. 插入 5，此时内部堆会维护最大堆性质

int top1 = pq.top();          // 5. 取当前最大值，这里是 5（不删除）

pq.pop();                     // 6. 弹出最大值 5，堆里剩下 {3,1}，新的 top 为 3

bool empP = pq.empty();       // 7. 判断是否为空
std::size_t psz = pq.size();  // 8. 当前元素个数
```

**小根堆**

```cpp
#include <queue>
#include <vector>
#include <functional>         // greater 在 <functional> 里

// 1. 使用 greater<int> 把 priority_queue 变成小根堆
std::priority_queue<int, std::vector<int>, std::greater<int>> pqMin;

pqMin.push(3);
pqMin.push(1);
pqMin.push(5);

int minv = pqMin.top();       // 2. 现在 top() 是最小值，这里是 1
```

**自定义结构 + 自定义比较**

```cpp
#include <queue>
#include <vector>

// 1. 自定义结点类型
struct Node {
    int w;                    // 权值
    int id;                   // 编号
    // 2. 重载 < 运算符（注意：priority_queue 把“最大”的看作 top）
    bool operator<(const Node& other) const {
        return w > other.w;   // 让 w 小的“看起来更大”，从而实现小根堆
    }
};

std::priority_queue<Node> q;  // 3. 现在 q.top() 是 w 最小的结点

q.push({3, 1});
q.push({1, 2});
q.push({2, 3});

Node t = q.top();             // 4. 得到 w 最小的结点，这里 w=1, id=2
```

---

## 5. 常用算法：`<algorithm>` / `<numeric>`

### 5.1 `sort` 排序

```cpp
#include <algorithm>          // sort 在 <algorithm> 中
#include <vector>

int a[] = {3, 1, 4, 2};       // 1. 普通数组
int n = 4;

// 2. 对数组进行升序排序
std::sort(a, a + n);          // 排完后 a = {1, 2, 3, 4}

// 3. 对 vector 排序
std::vector<int> v = {3, 1, 4, 2};
std::sort(v.begin(), v.end());// 升序，v = {1, 2, 3, 4}

// 4. 使用 greater 降序排序
std::sort(v.begin(), v.end(), std::greater<int>()); // v = {4, 3, 2, 1}
```

带自定义比较的 `sort`：

```cpp
#include <algorithm>
#include <vector>

// 1. 自定义结构体
struct Node {
    int x, y;
};

// 2. 自定义比较：x 小的排前面；若 x 相同，y 大的排前面
bool cmp(const Node& a, const Node& b) {
    if (a.x != b.x) return a.x < b.x;
    return a.y > b.y;
}

std::vector<Node> v;

// 3. 使用自定义比较排序
std::sort(v.begin(), v.end(), cmp);
```

### 5.2 二分相关：`lower_bound` / `upper_bound` / `binary_search`

```cpp
#include <algorithm>
#include <vector>

std::vector<int> v = {1, 2, 2, 3, 5};
int n = v.size();
int x = 2;

// 1. lower_bound：第一个 >= x 的位置
auto it1 = std::lower_bound(v.begin(), v.end(), x);
int pos1 = it1 - v.begin();   // 这里 pos1 = 1（v[1] == 2）

// 2. upper_bound：第一个 > x 的位置
auto it2 = std::upper_bound(v.begin(), v.end(), x);
int pos2 = it2 - v.begin();   // 这里 pos2 = 3（v[3] == 3）

// 3. 使用 binary_search 判断是否存在 x
bool exists = std::binary_search(v.begin(), v.end(), x); // 这里为 true

// 4. 出现次数 = upper_bound - lower_bound
int cnt = pos2 - pos1;        // 这里 cnt = 2（两个 2）
```

### 5.3 `min` / `max` / `min_element` / `max_element`

```cpp
#include <algorithm>

int a = 3, b = 5;

int mn = std::min(a, b);      // 1. 返回较小值，这里是 3
int mx = std::max(a, b);      // 2. 返回较大值，这里是 5

int arr[] = {3, 1, 4, 2};
int n = 4;

// 3. 最小元素迭代器
int mnVal = *std::min_element(arr, arr + n); // 结果为 1

// 4. 最大元素迭代器
int mxVal = *std::max_element(arr, arr + n); // 结果为 4
```

### 5.4 `reverse` / `unique`

```cpp
#include <algorithm>
#include <vector>

std::vector<int> v = {1, 2, 3, 4};

// 1. 反转整个容器
std::reverse(v.begin(), v.end()); // v = {4, 3, 2, 1}

// 2. 去重常规套路：先排序，再 unique 再 resize
std::vector<int> u = {3, 1, 3, 2, 1};
std::sort(u.begin(), u.end());    // u = {1, 1, 2, 3, 3}
auto it = std::unique(u.begin(), u.end());
// 3. unique 把相邻重复挤到后面，返回“新逻辑末尾”迭代器
u.erase(it, u.end());             // 4. 真正把后面的脏数据删掉，u = {1, 2, 3}
```

### 5.5 `accumulate`（在 `<numeric>` 中）

```cpp
#include <numeric>            // accumulate 在 <numeric> 中

int arr[] = {1, 2, 3, 4};
int n = 4;

// 1. 求和，初始值为 0
int sum = std::accumulate(arr, arr + n, 0);      // 结果为 10

// 2. 用 long long 防溢出
long long sum2 = std::accumulate(arr, arr + n, 0LL);

// 3. 自定义运算（比如求积）
int prod = std::accumulate(arr, arr + n, 1, std::multiplies<int>()); // 1*2*3*4=24
```

---

## 6. 其它常见 STL：`pair` / `tuple` / `bitset`

### 6.1 `pair` / `tuple`

```cpp
#include <utility>            // pair 在 <utility> 中
#include <tuple>              // tuple 在 <tuple> 中

// 1. 定义并初始化一个 pair
std::pair<int, int> p = {1, 2};

int first = p.first;          // 2. 访问 first，结果为 1
int second = p.second;        // 3. 访问 second，结果为 2

// 4. pair 自带字典序比较：先比 first，再比 second
std::pair<int, int> a = {1, 3};
std::pair<int, int> b = {2, 0};
bool res = (a < b);           // 5. true，因为 1 < 2

// 6. 定义一个三元组 tuple
std::tuple<int, int, int> t = {1, 2, 3};

int x = std::get<0>(t);       // 7. 获取第 0 个元素，1
int y = std::get<1>(t);       // 8. 获取第 1 个元素，2
int z = std::get<2>(t);       // 9. 获取第 2 个元素，3
```

### 6.2 `bitset`（定长位集，用于状态压缩）

```cpp
#include <bitset>             // 1. 引入 bitset 头文件

// 2. 定义一个有 1000 位的 bitset，索引范围 [0, 999]
std::bitset<1000> bs;

bs.set(3);                    // 3. 把第 3 位设为 1
bs.reset(3);                  // 4. 把第 3 位设为 0
bs.flip(3);                   // 5. 把第 3 位取反（0->1 或 1->0）

bool b3 = bs[3];              // 6. 访问第 3 位的值（bool）

std::size_t ones = bs.count();// 7. 统计有多少位为 1

// 8. 位运算：&（与）、|（或）、^（异或）
std::bitset<8> a8(std::string("11001100"));
std::bitset<8> b8(std::string("10101010"));

auto c8 = a8 & b8;            // 位与
auto d8 = a8 | b8;            // 位或
auto e8 = a8 ^ b8;            // 位异或
```

---

