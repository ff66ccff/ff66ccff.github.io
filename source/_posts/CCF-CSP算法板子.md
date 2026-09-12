---
title: "CCF-CSP 算法板子"
date: "2026-09-12T16:45:00+08:00"
published: "2026-09-12T16:45:00+08:00"
updated: "2026-09-12T16:45:00+08:00"
categories:
  - 编程
tags:
  - CCF-CSP
  - 算法
  - C++
---

## 第 00 章 速查索引 · 复杂度预算与数据类型

> 本章是"翻手册前的第一站"：拿到题目先看数据范围，用 0.2 的表反推算法；写代码时用 0.3 的表选类型；不确定 STL 会不会超时时查 0.4。

### 0.1 本手册使用方式

- `CCF-CSP算法板子.md`：可搜索、可复制的源文件，平时在电脑上 `Ctrl+F` 查。
- `CCF-CSP算法板子.pdf`：三栏高密度排版，A4 共 **23 页**（双面打印 12 张纸），页脚有页码，目录带全书页码，适合考前纸质速览。
- 所有代码为 **C++17**，编译命令统一 `g++ -O2 -std=c++17 -o a a.cpp`。
- 代码块均为"板子风格"片段：全局量（`n`、`a[]`、`g[]` 等）默认已在外部声明，直接抄用即可。
- `⚠` 标注的是**真实踩过的坑**，考前重点看这些。
- 排版密度可调：`build/` 目录保留了完整生成链，`CSP_COLS=2 CSP_BODY=7.6 CSP_CODE=6.9 python3 build_html.py …` 可重新生成更宽松（更好读、页数更多）的版本，详见 `build/README.md`。

### 0.2 数据范围 → 算法复杂度反查表

拿到题先看 n 的上限，倒推可以写多复杂的算法。按 **1 秒 ≈ 1e8 次简单运算**（C++ `-O2`，保守估计）计算。

| n 的范围 | 可承受复杂度 | 典型算法 |
|---|---|---|
| n ≤ 10 | O(n!) | 全排列暴力、next_permutation |
| n ≤ 20 | O(2^n)、O(2^n · n) | 状压 DP、子集枚举、DFS 暴搜 |
| n ≤ 40 | O(2^(n/2))、O(3^(n/2)) | 折半枚举（meet in the middle） |
| n ≤ 100 | O(n^4) 勉强，O(n^3) 稳 | Floyd、区间 DP、高斯消元、矩阵乘 |
| n ≤ 500 | O(n^3) | 同上（注意常数，可用 bitset 压位） |
| n ≤ 5000 | O(n^2) | 朴素 DP、朴素 Dijkstra、二维前缀和 |
| n ≤ 1e5 | O(n log n)、O(n sqrt n) | 排序、线段树、树状数组、堆优化 Dijkstra、莫队 |
| n ≤ 5e5 | O(n log n)（常数要小） | 同上，避免 map/set，改用手写或离散化 |
| n ≤ 1e6 | O(n)、O(n log n) 常数小 | 前缀和、双指针、线性筛、KMP、快读 |
| n ≤ 1e7 | O(n) 常数极小 | 只用数组扫描 + fread 快读，慎用 STL |
| n ≤ 1e9 | O(log n)、O(sqrt n) | 快速幂、数位 DP、整除分块、矩阵快速幂 |
| n ≤ 1e18 | O(log n)、O(log^2 n) | 快速幂、exgcd、Miller-Rabin、BSGS |

> ⚠️ 这是"能跑完"的**下界而非目标**：n ≤ 1e5 时写 O(n^2) 必 TLE。反过来 n ≤ 5000 时 O(n^2) 是送分，不要为了炫技写 O(n log n)。

### 0.3 基本数据类型与范围

| 类型 | 字节 | 范围 / 精度 |
|---|---|---|
| `int` | 4 | −2 147 483 648 ~ 2 147 483 647（约 ±2.1e9） |
| `unsigned int` | 4 | 0 ~ 4 294 967 295（约 4.3e9） |
| `long long` | 8 | −9.22e18 ~ 9.22e18（约 ±9.2e18，即 2^63−1） |
| `unsigned long long` | 8 | 0 ~ 1.8e19（2^64−1） |
| `__int128` | 16 | 约 ±1.7e38（GCC 支持，无 cin/cout 重载） |
| `float` | 4 | 有效 6~7 位十进制 |
| `double` | 8 | 有效 15~16 位十进制，最大约 1.8e308 |
| `long double` | 16 | 有效 18~19 位十进制 |

**溢出速判**：`a * b` 用 long long 时，只要 `a, b ≤ 3e9` 就安全（3e9 × 3e9 = 9e18 < 9.22e18）。常见规模下 `1e5 × 1e5 × 1e5 = 1e15` 安全；`1e9 × 1e9 = 1e18` 安全；`1e9 × 1e9 × 1e9` **溢出**，必须先取模。

```cpp

// 加法溢出判定 (a, b >= 0)
bool addOverflow(ll a, ll b) { return a > LLONG_MAX - b; }
// 乘法安全写法: 先转 long double 估商, 或直接用 __int128
ll mul(ll a, ll b, ll m) { return (ll)((__int128)a * b % m); }

```

### 0.4 STL 复杂度与性能陷阱

| 容器 / 操作 | 复杂度 | 备注 |
|---|---|---|
| `vector::push_back` | 均摊 O(1) | 预留 `reserve` 可避免扩容拷贝 |
| `vector` 中间 `insert/erase` | O(n) | 频繁中间插入改用 `list`/`deque` 或换思路 |
| `deque` 两端插入删除 | O(1) | 随机访问 O(1) 但常数大于 vector |
| `priority_queue` push/pop | O(log n) | 默认大根堆，小根堆用 `greater<>` |
| `set/map` 插入查找删除 | O(log n) | 常数约为手写平衡树的 3~5 倍 |
| `unordered_map/set` | 平均 O(1)，**最坏 O(n)** | 可被构造数据卡成 O(n)，CSP 中慎用 |
| `sort` | O(n log n) | 内省排序，最坏也 O(n log n) |
| `nth_element` | 平均 O(n) | 求第 k 小且不需全序时用它 |
| `lower_bound`（数组/vector） | O(log n) | 必须已排序；对 `set/map` 要用成员函数版 |
| `bitset` 位运算 | O(n / 64) | 加速可达 64 倍，见 06 章 |

> ⚠️ `unordered_map` 在 CSP 中曾被卡（如 2021 年某题用 `unordered_map` 的选手大面积 TLE）。需要哈希表时优先手写哈希或改用 `map`。

> ⚠️ `endl` 会强制刷新缓冲区，`cout << endl` 在循环里输出 1e5 次可慢 10 倍以上。统一用 `'\n'`。

### 0.5 模运算与常量约定

| 常量 | 值 | 用途 |
|---|---|---|
| 模数 1 | 1 000 000 007 = 1e9+7 | 最常用，是质数 |
| 模数 2 | 998 244 353 = 119·2^23+1 | NTT 友好，是质数 |
| `INF` | 0x3f3f3f3f = 1 061 109 567 | 约 1.06e9，**两个相加不溢出 int** |
| `LINF` | 0x3f3f3f3f3f3f3f3f | 约 4.55e18，可安全相加 |
| `EPS` | 1e-8 | 浮点比较阈值 |

```cpp

// 负数取模: C++ 中 (-7) % 3 == -1, 不是 2
int mod(int x, int m) { x %= m; return x < 0 ? x + m : x; }
// 浮点比较
int sgn(double x) { return x < -EPS ? -1 : (x > EPS ? 1 : 0); }
bool eq(double a, double b) { return fabs(a - b) < EPS; }

```

> ⚠️ `INF` 用 `0x3f3f3f3f` 而不是 `1e9`：`INF + INF = 2.12e9` 已经超过 int 上限会溢出成负数；`0x3f3f3f3f + 0x3f3f3f3f = 0x7e7e7e7e` 仍在 int 范围内，是竞赛圈的标准选择。


## 第 01 章 CSP 基础与常用技巧

本章是 CCF-CSP 认证（上机 4 小时 5 题）的通用底座。代码为 C++17，统一编译：`g++ -O2 -std=c++17 -o a a.cpp`。
文中代码块均已在 g++ 11.4 / C++17 实测编译通过；二分、前缀和差分、单调队列、离散化、贪心、高精度均已与暴力或 `__int128` 随机对拍验证。

### 1. 考场模板骨架

#### 1.1 万能头、宏与常量

```cpp

#include <bits/stdc++.h>          // GCC 万能头; 非 GCC 需逐个 include
using namespace std;
using ll = long long;
using pii = pair<int, int>;
#define all(x) (x).begin(), (x).end()
#define sz(x)  (int)(x).size()
#define pb     push_back
#define fi     first
#define se     second
#define rep(i, a, b) for (int i = (a); i < (b); ++i)
const int INF = 0x3f3f3f3f;              // 10^9 级, 两倍不溢出 int
const ll  LINF = 0x3f3f3f3f3f3f3f3fLL;
const int MOD = 1000000007;              // 1e9+7
const double EPS = 1e-8;
const int dx4[] = {0, 0, 1, -1}, dy4[] = {1, -1, 0, 0};   // 四方向; 八方向补对角
ll qpow(ll a, ll b, ll m = MOD) {        // 快速幂 O(log n)
    ll r = 1 % m; a %= m; if (a < 0) a += m;
    for (; b; b >>= 1, a = a * a % m) if (b & 1) r = r * a % m;
    return r;
}
ll gcd(ll a, ll b) { return b ? gcd(b, a % b) : a; }   // O(log n)
ll lcm(ll a, ll b) { return a / gcd(a, b) * b; }        // 先除后乘防溢出

```

多测骨架（写在 `main` 里）：`int T; cin >> T; while (T--) solve();`

> ⚠️ 不要写 `#define int long long`：破坏 `main` 返回类型、令 `printf("%d")` 全部 UB、常数翻倍。需要 64 位就显式写 `ll`。

#### 1.2 快读快写（fread 整块读入）

```cpp

// 快读: 比 cin/scanf 快 3~5 倍, 适合 10^6 级输入. 依赖 <cstdio>
namespace io {
const int BUF = 1 << 20;
char buf[BUF]; int len = 0, pos = 0;
inline char gc() {
    if (pos == len) { len = (int)fread(buf, 1, BUF, stdin); pos = 0; if (len <= 0) return 0; } return buf[pos++]; }
inline bool readInt(int &x) {            // 支持负号; 读到 EOF 返回 false
    char c = gc();
    while (c && (c < '0' || c > '9') && c != '-') c = gc();
    if (!c) return false;
    bool neg = false; if (c == '-') { neg = true; c = gc(); }
    for (x = 0; c >= '0' && c <= '9'; c = gc()) x = x * 10 + (c - '0');
    if (neg) x = -x;
    return true;
}
// readLL 与 readInt 完全同构, 仅把 int 换成 ll (长整数必须走这个)
inline void writeLL(ll x) {              // 快写: 比 printf 快约 2 倍
    if (x < 0) { putchar('-'); x = -x; }
    char stk[24]; int top = 0;
    do { stk[top++] = char('0' + x % 10); x /= 10; } while (x);     while (top) putchar(stk[--top]); }
}  // namespace io

```

> ⚠️ 快读快写**不能与 `cin`/`scanf` 混用同一个流**，否则读入错位。若要用 `cin`，加 `ios::sync_with_stdio(false); cin.tie(nullptr);`，此时**不能再混用** `scanf`/`printf`。

#### 1.3 __int128 读写（GCC 扩展）

```cpp

// __int128: 约 ±1.7e38. GCC/Clang 支持, MSVC 不支持; 无 IO 重载必须手写
__int128 readI128() {
    __int128 x = 0; int sign = 1; char c = getchar();
    while (c < '0' || c > '9') { if (c == '-') sign = -1; c = getchar(); }
    for (; c >= '0' && c <= '9'; c = getchar()) x = x * 10 + (c - '0');
    return x * sign;
}
void writeI128(__int128 x) {
    if (x == 0) { putchar('0'); return; }
    if (x < 0) { putchar('-'); x = -x; }
    char stk[45]; int top = 0;
    while (x > 0) { stk[top++] = char('0' + (int)(x % 10)); x /= 10; }     while (top) putchar(stk[--top]); }
string i128str(__int128 v) {             // std::to_string 不支持 __int128
    if (v == 0) return "0";
    bool ng = v < 0; if (ng) v = -v;
    string s; while (v > 0) { s += char('0' + (int)(v % 10)); v /= 10; }
    if (ng) s += '-';
    reverse(s.begin(), s.end()); return s;
}
// 乘法防溢出: __int128 c = (__int128)a * b % MOD;  再转回 ll

```

> ⚠️ `std::to_string` 与 `cout <<` 都**不支持** `__int128`（前者报 ambiguous，后者编译失败），必须用手写函数。

#### 1.4 编译与调试命令

- 提交：`g++ -O2 -std=c++17 -o a a.cpp`；查错加 `-Wall -Wextra`；查越界溢出加 `-g -fsanitize=address,undefined`（慢 5~10 倍，仅调试）。
- 放开递归栈：`ulimit -s unlimited`（Linux 默认 8 MB）；测时限：`time ./a < big.txt`。
- 对拍：`while true; do ./gen > in; ./a < in > o1; ./b < in > o2; diff o1 o2 || break; done`

### 2. 二分

#### 2.1 整数二分三种写法

```cpp

bool check(int x);   // 要求: 在候选区间上单调 (false...false true...true)
// 【写法一】闭区间 [lo,hi], 最小可行值; mid 下取整
int lowerBound(int lo, int hi) {
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;      // 防 (lo+hi) 溢出
        if (check(mid)) hi = mid; else lo = mid + 1;
    } return lo; }
// 【写法二】闭区间 [lo,hi], 最大可行值; mid 上取整
int upperBound(int lo, int hi) {
    while (lo < hi) {
        int mid = lo + (hi - lo + 1) / 2;  // 上取整, 否则死循环
        if (check(mid)) lo = mid; else hi = mid - 1;
    } return lo; }
// 【写法三】左闭右开, 维护 check(l)=false 且 check(r)=true, 返回 r (最小可行值)
int solveOpen(int lo, int hi) {
    int l = lo - 1, r = hi + 1;            // 两端必须各外扩一格!
    while (l + 1 < r) { int mid = l + (r - l) / 2;
        if (check(mid)) r = mid; else l = mid; } return r; }

```

> ⚠️ 写法三的前提是**初始两端已满足不变式**。若直接写 `l = lo`，当答案恰好是 `lo` 时会返回 `lo + 1`（已实测复现），所以必须取 `l = lo - 1, r = hi + 1`。求最大可行值则镜像：维护 `check(l)=true, check(r)=false`，返回 `l`。
> ⚠️ 死循环的唯二原因：**mid 取整方向与收缩方向不匹配**。口诀：`hi = mid` 配下取整，`lo = mid` 配上取整。

#### 2.2 STL 二分与浮点二分

```cpp

// lower_bound: 首个 >= x; upper_bound: 首个 > x. 均 O(log n), 要求已排序
int p1 = (int)(lower_bound(a, a + n, x) - a);           // [a, a+n)
int p3 = (int)(lower_bound(a, a + n, x, greater<int>()) - a);   // 下降序列
// vector 同理; x 出现次数 = upper_bound - lower_bound
double f(double x);                                     // 单调函数
double solveDouble(double lo, double hi) {              // 浮点二分
    for (int it = 0; it < 100; ++it) {                  // 100 轮精度约 1e-30
        double mid = (lo + hi) / 2;
        if (f(mid) >= 0) hi = mid; else lo = mid;
    } return lo; }

```

> ⚠️ 浮点二分**不要写 `while (r - l > 1e-8)`**：lo/hi 量级到 1e9 时 double 已无 1e-8 分辨率，循环永不退出。

#### 2.3 二分答案（最大值最小 / 最小值最大）

```cpp

// 二分答案 = 二分枚举答案 + 贪心/模拟判定. 前提: 答案单调 + check 可 O(n) 实现
bool check(ll x);
ll solveMaxMin(ll lo, ll hi) {           // 最大值最小: check 随 x 增大 false -> true
    while (lo < hi) { ll mid = lo + (hi - lo) / 2;
        if (check(mid)) hi = mid; else lo = mid + 1; } return lo; }
ll solveMinMax(ll lo, ll hi) {           // 最小值最大: check 随 x 增大 true -> false
    while (lo < hi) { ll mid = lo + (hi - lo + 1) / 2;
        if (check(mid)) lo = mid; else hi = mid - 1; } return lo; }

```

```cpp

// 完整可编译示例: 洛谷 P1873 砍树 (求最大的 H 使 sum(a[i]-H | a[i]>H) >= M)
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int N = 1000005;
int n, a[N]; ll m;
bool check(ll k) {                       // 锯片高 k 时能否拿到 >= m 木材
    ll sum = 0;
    for (int i = 1; i <= n; ++i) if (a[i] > k && (sum += a[i] - k) >= m) return true;
    return sum >= m;
}
int main() {
    scanf("%d%lld", &n, &m);
    ll lo = 0, hi = 0;                   // 答案区间 [0, max a]
    for (int i = 1; i <= n; ++i) { scanf("%d", &a[i]); hi = max(hi, (ll)a[i]); }
    while (lo < hi) { ll mid = lo + (hi - lo + 1) / 2;   // 最大可行值 -> 上取整
        if (check(mid)) lo = mid; else hi = mid - 1; }
    printf("%lld\n", lo); return 0;
}

```

> ⚠️ 二分答案三要素：① 上下界要够宽（宁可 `lo=0, hi=1e18`）；② `check` 内累加量必须 `ll`（1e5 个 1e9 相加爆 int）；③ 先想清楚求"最大可行"还是"最小可行"，选错 mid 取整方向就是死循环。

### 3. 前缀和与差分

#### 3.1 一维前缀和与差分

```cpp

ll s[N], d[N];                          // 全局数组默认清零; d 需开到 n+2
void build1D() { for (int i = 1; i <= n; ++i) s[i] = s[i - 1] + a[i]; }   // O(n) 预处理
ll rangeSum(int l, int r) { return s[r] - s[l - 1]; }                     // O(1) 查询
void addRange(int l, int r, ll v) { d[l] += v; d[r + 1] -= v; }           // O(1) 区间加
void rebuild1D() { for (int i = 1; i <= n; ++i) a[i] = a[i - 1] + d[i]; } // O(n) 还原

```

> ⚠️ 差分数组必须开到 `n + 2`（`d[r+1]` 在 `r == n` 时会写到 `n+1`）。差分**不支持边改边查**，所有区间加完成后才能 `rebuild`。

#### 3.2 二维前缀和与二维差分

```cpp

ll s[N][N], d[N][N];                    // d 需开到 n+2 行、m+2 列
void build2D() {                        // O(nm) 预处理, O(1) 矩形查询
    for (int i = 1; i <= n; ++i) for (int j = 1; j <= m; ++j)
        s[i][j] = s[i-1][j] + s[i][j-1] - s[i-1][j-1] + a[i][j];
}
ll rectSum(int x1, int y1, int x2, int y2) {
    return s[x2][y2] - s[x1-1][y2] - s[x2][y1-1] + s[x1-1][y1-1];
}
void addRect(int x1, int y1, int x2, int y2, ll v) {   // O(1) 矩形加: 四角打标记
    d[x1][y1] += v;      d[x2 + 1][y1] -= v;
    d[x1][y2 + 1] -= v;  d[x2 + 1][y2 + 1] += v;       // 容斥: 多减的加回来
}
void seed2D() {                         // 用原数组 a 初始化差分数组 d
    for (int i = 1; i <= n; ++i) for (int j = 1; j <= m; ++j)
        d[i][j] = a[i][j] - a[i-1][j] - a[i][j-1] + a[i-1][j-1];
}
void rebuild2D() {                      // 还原: 一遍二维前缀和
    for (int i = 1; i <= n; ++i) for (int j = 1; j <= m; ++j)
        d[i][j] += d[i-1][j] + d[i][j-1] - d[i-1][j-1];
}

```

> ⚠️ **差分数组初值是 0，只表示"增量"**。直接从 0 开始打标记再 `rebuild2D()`，得到的是增量矩阵，必须再加原数组 `a`；否则用 `seed2D()` 先把 `a` 转成差分。这是二维差分最常见的错（已实测复现）。

### 4. 双指针 / 滑动窗口 / 尺取法

```cpp

void add(int i); void del(int i); bool ok();
int shortestWindow() {                  // 最短的满足条件的连续区间. O(n)
    int l = 1, ans = INF;
    for (int r = 1; r <= n; ++r) {
        add(r);
        while (l <= r && ok()) { ans = min(ans, r - l + 1); del(l++); }  // 可行则收缩
    } return ans; }
// 求最长满足条件的区间: while 条件改成 !ok(), 更新 ans = max(ans, r - l + 1)
// 判定型双指针 (两有序数组求两数之和, O(n+m)): i 从 0 递增, j 从 m-1 递减,
// 若 a[i]+b[j] < target 则 ++i, 否则 --j
int q[N];                               // 单调队列求滑动窗口最值: 窗口长 k, O(n)
void windowMax() {                      // 存下标而非值! 求最小值改比较符为 >=
    int head = 1, tail = 0;
    for (int i = 1; i <= n; ++i) {
        while (head <= tail && a[q[tail]] <= a[i]) --tail;  // 队尾更小 -> 永无出头之日
        q[++tail] = i;
        if (q[head] <= i - k) ++head;                       // 队头滑出 (先判越界)
        if (i >= k) printf("%d ", a[q[head]]);              // 队头即窗口最大值
    }
}

```

> ⚠️ 单调队列存**下标**而非值，否则无法判越界；越界判断必须在**输出之前**做；`q` 数组开 `n + 1`。

### 5. 离散化

```cpp

vector<int> xs;
void compress() {                       // O(n log n)
    xs.assign(a + 1, a + n + 1);                       // 1. 拷贝
    sort(xs.begin(), xs.end());                        // 2. 排序
    xs.erase(unique(xs.begin(), xs.end()), xs.end());  // 3. 去重
    for (int i = 1; i <= n; ++i)                       // 4. 映射为 1-based 排名
        a[i] = (int)(lower_bound(xs.begin(), xs.end(), a[i]) - xs.begin()) + 1;
}
// 反查第 r 名的原值: xs[r - 1];  原值 x 的排名: lower_bound(...) - begin() + 1
// 值域大小: int len = (int)xs.size();

```

> ⚠️ `unique` **只把重复元素移到末尾并返回新尾迭代器**，不删除元素，必须配合 `erase`。映射用 `lower_bound`（首个 >= x）；若查询值不在集合内，`find` 会失败而 `lower_bound` 仍给出插入位置。

### 6. 贪心

#### 6.1 区间调度 / 区间选点

```cpp

struct Seg { int l, r; } seg[N];
bool cmpR(const Seg &x, const Seg &y) { return x.r < y.r; }
int maxDisjoint() {   // 【区间调度】最多两两不交的区间 (相接算不重叠). O(n log n)
    sort(seg + 1, seg + n + 1, cmpR);           // 按右端点升序
    int cnt = 0, last = -INF;
    for (int i = 1; i <= n; ++i) if (seg[i].l >= last) { ++cnt; last = seg[i].r; } return cnt; }
int minPoints() {     // 【区间选点】最少点命中所有区间. O(n log n)
    sort(seg + 1, seg + n + 1, cmpR);           // 在右端点放点最划算
    int pts = 0, lastP = -INF;
    for (int i = 1; i <= n; ++i) if (seg[i].l > lastP) { ++pts; lastP = seg[i].r; } return pts; }

```

> ⚠️ 两者只差一个等号：区间调度用 `l >= last`（端点相接不算重叠），区间选点用 `l > last`（点落在端点仍算命中）。先确认题目端点开闭。
> ⚠️ 区间调度要求 `l < r`。若允许 `l == r` 的空区间，贪心可能少选（实测 `[9,9] [4,9] [1,10]` 贪心得 1，最优 2）。

#### 6.2 Huffman / 合并果子 / 反悔贪心 / 邻项交换

```cpp

ll huffman() {                          // 每次合并最小的两个. O(n log n)
    priority_queue<ll, vector<ll>, greater<ll>> pq;   // 第三个参数才是小根堆
    for (int i = 1; i <= n; ++i) pq.push(a[i]);
    ll cost = 0;
    while (pq.size() > 1) {
        ll x = pq.top(); pq.pop(); ll y = pq.top(); pq.pop();
        cost += x + y; pq.push(x + y);                // 合并代价
    } return cost; }
struct Job { ll d, p; } job[N];
bool cmpD(const Job &x, const Job &y) { return x.d < y.d; }
ll workScheduling() {   // 反悔贪心 (USACO Work Scheduling). O(n log n)
    sort(job + 1, job + n + 1, cmpD);                 // 按截止时间升序
    priority_queue<ll, vector<ll>, greater<ll>> pq;   // 小根堆: 已选中最差的
    ll ans = 0;
    for (int i = 1; i <= n; ++i) {
        pq.push(job[i].p); ans += job[i].p;           // 先接受
        if ((ll)pq.size() > job[i].d) { ans -= pq.top(); pq.pop(); }   // 超期反悔
    } return ans; }
// 邻项交换法 (排序贪心): 设交换相邻两项不影响其他项, 比较两种顺序推出 cmp
// 例 (NOIP 2012 国王游戏 / 耍杂技的牛): 按 a*b 升序
struct Cow { ll a, b; } cow[N];
bool cmpCow(const Cow &x, const Cow &y) { return x.a * x.b < y.a * y.b; }

```

> ⚠️ 反悔贪心必须能证明"局部反悔后仍全局最优"。本题依据是「前 i 项工作最多只能做 `d_i` 项」。没有这类性质就不能反悔，要转 DP。

### 7. 排序与去重

```cpp

void sortDemo() {
    sort(a + 1, a + n + 1);                              // 升序 O(n log n)
    sort(a + 1, a + n + 1, greater<int>());              // 降序
    int len = (int)(unique(a + 1, a + n + 1) - (a + 1)); // 去重(先 sort), 有效元素 a[1..len]
    nth_element(a + 1, a + k, a + n + 1);                // O(n): 第 k 小就位, 左 <= 它 <= 右
    // 第 k 大 = nth_element(a+1, a+n-k+1, a+n+1) 后的 a[n-k+1]
}
struct Node { int x, y, z; };                            // 多关键字: tie 字典序比较
bool operator<(const Node &A, const Node &B) { return tie(A.x, A.y, A.z) < tie(B.x, B.y, B.z); }
// 混合升降序: return tie(A.x, B.y) < tie(B.x, A.y);   // x 升序, y 降序

```

> ⚠️ `sort` 的比较函数必须满足**严格弱序**：相等时必须返回 `false`，写成 `<=` 会在 GCC 下段错误。这是最隐蔽的 RE 来源。

### 8. 模拟题技巧

#### 8.1 日期推算

```cpp

bool isLeap(int y) { return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0; }
const int MD[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
int daysInMonth(int y, int m) { return (m == 2 && isLeap(y)) ? 29 : MD[m]; }
ll daysFromCivil(ll y, int m, int d) {   // 日期 -> 绝对天数, 1970-01-01 = 0, 相减即天数差
    y -= (m <= 2);
    ll era = (y >= 0 ? y : y - 399) / 400;
    ll yoe = y - era * 400;
    ll doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
    ll doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    return era * 146097 + doe - 719468;
}
int weekday(ll y, int m, int d) { return (int)((daysFromCivil(y, m, d) % 7 + 10) % 7); } // 0=周一

```

已实测：`1970-01-01 -> 0`；`2000-01-01 -> 10957`；`1900-02-28` 到 `1900-03-01` 差 1 天（1900 非闰年）。

> ⚠️ 星期偏移量易错：1970-01-01 是**周四**，故取 `+10`（`(0+10)%7 = 3 = 周四`）。写成 `+11` 会整体错一天。

#### 8.2 进制转换与大数取模

```cpp

string toBase(ll x, int B) {             // 十进制 -> B 进制 (2<=B<=36). O(log_B x)
    if (x == 0) return "0";
    bool neg = x < 0; if (neg) x = -x;
    string s;
    while (x > 0) { int d = (int)(x % B); s += char(d < 10 ? '0' + d : 'A' + d - 10); x /= B; }
    if (neg) s += '-';
    reverse(s.begin(), s.end()); return s;
}
ll fromBase(const string &s, int B) {    // B 进制 -> 十进制. O(len)
    ll x = 0;
    for (char c : s) { if (c == '-') continue;
        x = x * B + ((c <= '9') ? c - '0' : (c >= 'a' ? c - 'a' + 10 : c - 'A' + 10)); } return x; }
int modString(const string &s, int m) {  // 大数取模: 逐位取模. O(len)
    ll r = 0;
    for (char c : s) r = (r * 10 + (c - '0')) % m;
    return (int)r;
}

```

#### 8.3 高精度

```cpp

// 高精度整数 (十进制, 低位在前). 加/减 O(n), 乘 O(n*m), 除 O(n*m*log10)
struct Big {
    vector<int> d; bool neg = false;                // d[0] 是个位
    Big(long long x = 0) {
        if (x < 0) { neg = true; x = -x; }
        if (x == 0) d.push_back(0);
        while (x) { d.push_back((int)(x % 10)); x /= 10; }
    }
    void trim() {                                   // 去前导零并修正 -0
        while (d.size() > 1 && d.back() == 0) d.pop_back();
        if (d.size() == 1 && d[0] == 0) neg = false;
    }
};
int cmpAbs(const Big &a, const Big &b) {            // 无符号比较: -1 / 0 / 1
    if (a.d.size() != b.d.size()) return a.d.size() < b.d.size() ? -1 : 1;
    for (int i = (int)a.d.size() - 1; i >= 0; --i)
        if (a.d[i] != b.d[i]) return a.d[i] < b.d[i] ? -1 : 1;
    return 0;
}
Big add(const Big &a, const Big &b) {               // 无符号加法
    Big c; c.d.assign(max(a.d.size(), b.d.size()) + 1, 0);
    for (size_t i = 0; i < a.d.size(); ++i) c.d[i] += a.d[i];
    for (size_t i = 0; i < b.d.size(); ++i) c.d[i] += b.d[i];
    for (size_t i = 0; i + 1 < c.d.size(); ++i) { c.d[i+1] += c.d[i]/10; c.d[i] %= 10; }     c.trim(); return c; }
Big sub(const Big &a, const Big &b) {               // 无符号减法 (要求 a >= b)
    Big c = a;
    for (size_t i = 0; i < b.d.size(); ++i) c.d[i] -= b.d[i];
    for (size_t i = 0; i + 1 < c.d.size(); ++i) if (c.d[i] < 0) { c.d[i] += 10; c.d[i+1]--; }     c.trim(); return c; }
Big mul(const Big &a, const Big &b) {               // 无符号乘法 (先累加后统一进位)
    Big c; c.d.assign(a.d.size() + b.d.size(), 0);
    for (size_t i = 0; i < a.d.size(); ++i) for (size_t j = 0; j < b.d.size(); ++j)
        c.d[i+j] += a.d[i] * b.d[j];
    for (size_t i = 0; i + 1 < c.d.size(); ++i) { c.d[i+1] += c.d[i]/10; c.d[i] %= 10; }     c.trim(); return c; }
// 高精度 * 单精度: 直接 mul(a, Big(k)) 即可 (下面 divBig 就这么用)
Big divSmall(const Big &a, int b, int &rem) {       // 高精度 / 单精度, rem 回传余数
    Big c; c.d.assign(a.d.size(), 0); rem = 0;
    for (int i = (int)a.d.size() - 1; i >= 0; --i) {
        int cur = rem * 10 + a.d[i]; c.d[i] = cur / b; rem = cur % b;
    }     c.trim(); return c; }
Big divBig(const Big &a, const Big &b, Big &r) {    // 竖式长除法 + 二分试商
    Big q; q.d.assign(a.d.size(), 0); r = Big(0);
    for (int i = (int)a.d.size() - 1; i >= 0; --i) {
        r.d.insert(r.d.begin(), a.d[i]); r.trim();  // r = r * 10 + a.d[i]
        int lo = 0, hi = 9, t = 0;                  // 试商 0..9
        while (lo <= hi) { int mid = (lo + hi) / 2;
            if (cmpAbs(mul(b, Big(mid)), r) <= 0) { t = mid; lo = mid + 1; } else hi = mid - 1; }
        q.d[i] = t; r = sub(r, mul(b, Big(t)));
    }
    q.trim(); return q;
}
void printBig(const Big &a) {                       // 输出
    if (a.neg) putchar('-');
    for (int i = (int)a.d.size() - 1; i >= 0; --i) putchar(char('0' + a.d[i]));
}

```

以上函数已用 20000 组随机数据与 `__int128`（加/减/乘/乘单精度/除单精度/除高精度）对拍全部通过。

> ⚠️ 高精度乘法是 O(n*m)，两个上千位的数会超时（需 FFT/NTT）。CSP 中一般不超过 10^3 位，竖式足够。压位（每 9 位存一个 `int`）可把常数降到约 1/9。

#### 8.4 字符串分割与去空格

```cpp

vector<string> split(const string &s, char delim) {   // 按分隔符分割 (保留空段)
    vector<string> res; string cur;
    for (char c : s) { if (c == delim) { res.push_back(cur); cur.clear(); } else cur += c; }
    res.push_back(cur); return res;
}
vector<string> splitWs(const string &s) {             // 按空白分割 (跳过连续空白)
    vector<string> res; string tok; stringstream ss(s);
    while (ss >> tok) res.push_back(tok);
    return res;
}
string trim(const string &s) {                        // 去首尾空白
    size_t l = s.find_first_not_of(" \t\r\n");
    if (l == string::npos) return "";
    size_t r = s.find_last_not_of(" \t\r\n");
    return s.substr(l, r - l + 1);
}
// 读整行 (cin >> 后残留换行, 用 >> ws 吃掉): string line; getline(cin >> ws, line);

```

> ⚠️ `s.substr(pos, len)` 第二个参数是**长度不是终点下标**。`find` 失败返回 `string::npos`（即 `(size_t)-1`），不能用 `>= 0` 判断。

### 9. 常用 STL 速查

| 容器 | 关键复杂度 | 竞赛要点 |
| --- | --- | --- |
| `vector` | `push_back` 均摊 O(1)，随机访问 O(1) | `reserve(n)` 防多次扩容；`clear()` 不释放内存 |
| `string` | `substr` O(len)；`+=` 均摊 O(1) | `substr(pos,len)` 参数是长度 |
| `map` | 增删查 O(log n)，红黑树，**有序** | `mp[k]` 会**插入**默认值，只查用 `find`/`count` |
| `unordered_map` | 平均 O(1)，最坏 O(n) | 会被卡哈希，需自定义 `custom_hash` |
| `set` | O(log n)，有序去重 | 无随机访问；`*s.begin()` 取最小 |
| `priority_queue` | 堆顶 O(1)，增删 O(log n) | 默认**大根堆**；无 `clear()`，重新声明即可 |
| `bitset` | 位运算 O(n/64) | `bitset<N>` 的 N 必须是编译期常量 |

```cpp

void stlDemo() {
    priority_queue<int> pqMax;                            // 大根堆 (默认)
    priority_queue<int, vector<int>, greater<int>> pqMin; // 小根堆
    sort(a, a + n);                                       // 必须先升序
    do { /* 使用 a[0..n-1] */ } while (next_permutation(a, a + n));  // false=已最大
    bitset<1005> bs; bs.set(); bs.reset(); bs.flip(); bs[3] = 1;
    int c = (int)bs.count();                              // 数 1 的个数
    bs |= (bs << 2);                                      // 位运算即集合运算
}
// 优先队列自定义比较: 与 sort 的 cmp 相反! 返回 true 表示 a 优先级"低于" b
// struct Cmp { bool operator()(const pii &x, const pii &y) const { return x.first > y.first; } };
// priority_queue<pii, vector<pii>, Cmp> pq;

```

```cpp

// unordered_map 防卡哈希: splitmix64 雪崩函数 + 随机种子
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t FIXED_RANDOM =
            chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + FIXED_RANDOM);
    }
};
// unordered_map<ll, int, custom_hash> mp;

```

> ⚠️ 值域是 `1..n` 时优先用 `vector` 代替 `unordered_map`：常数小 5~10 倍且无卡哈希风险。`map`/`set` 遍历是**有序**的，别依赖插入顺序。

### 10. 常见坑

**整数溢出**
- `int` 上限约 2.1e9。`a * b` 若两边都是 `int` 会**先溢出再赋值**，写 `(ll)a * b`。前缀和、方案数、答案累加一律 `ll`（1e5 个 1e9 相加已是 1e14）。
- `INF` 用 `0x3f3f3f3f`（两倍 = 0x7e7e7e7e 仍不溢出）；用 `0x7fffffff` 相加就变负。
- `1 << 31` 是有符号溢出（UB），写 `1LL << 31`；位移量 `>= 31` 一律用 `1LL`。
- 取模减法写 `(a - b % MOD + MOD) % MOD`，别漏 `+ MOD`。

**浮点误差**
- 判等用 `fabs(a - b) < EPS`（1e-8），不要用 `==`。
- **能整数二分就不要浮点二分**：把不等式两边乘开、或对答案乘 1000 转成整数。
- `double` 有效位约 15~16 位十进制；1e9 级数据相减会丢精度，能转 `ll` 就转。
- 输出用 `printf("%.10f\n", ans)` 多打几位，避免被 SPJ 卡边界。

**数组越界与初始化**
- 全局数组默认清零，**局部数组不清零**；局部大数组还会爆栈（8 MB），大小 > 1e5 的数组一律放全局。（实测踩坑：`ll b[1005][1005]` 作局部变量就是 8 MB，直接爆栈。）
- 差分、双指针、单调队列的下标上界要 `+1` 或 `+2`，见 3.1 / 3.2 / 4 的 ⚠️。
- 多测必须清空所有全局量：`vector::clear()`、链式前向星的 `head/tot`、`cnt`、`ans`。最稳是封成 `init()` 并在每组数据开头调用。
- `memset` 按字节赋值：`memset(a, 0x3f, sizeof a)` 得到 0x3f3f3f3f（可当 INF），但 `memset(a, 1, ...)` 得到 0x01010101 而不是 1。

**endl 与 '\n'**
- `endl` = 换行 **+ flush**。输出 1e6 行时比 `'\n'` 慢数倍，**一律用 `'\n'`**。
- 交互题相反：必须 `cout << ... << endl;` 或 `fflush(stdout);`，否则对方读不到。
- `ios::sync_with_stdio(false); cin.tie(nullptr);` 放 `main` 开头，之后不能再混用 `scanf`/`printf`。

```cpp

// 标准 main 骨架, 直接抄 (依赖 1.1 的万能头与 using namespace std)
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T = 1;
    // cin >> T;                    // 多测
    while (T--) solve();
    return 0;
}

```


## 第 02 章 搜索与图论

> 代码默认以 `#include <bits/stdc++.h>` + `using namespace std;` 开头（C++17），不再重复；下标无说明均从 1 开始。全部模板已用 g++ 11.4 `-std=c++17` 编译通过（含随机对拍）。同一代码块内含多个编号模板（如 11.1/11.2/11.3）时它们互相独立、可能重名，复制时只取所需那一个。
### A. 搜索
#### 1. DFS 框架 + 剪枝
四类剪枝：**可行性**（当前状态已不可能合法）、**最优性**（当前代价 + 乐观下界 >= 已知最优）、**上下界**（剩余部分的最小/最大贡献）、**顺序**（先搜分支少/更可能出解的）。DFS 复杂度 = 状态数 x 转移数，剪枝改变可达状态集与常数。

```cpp

// 0/1 背包搜索: 可行性 + 最优性(剩余价值上界) + 顺序剪枝, 最坏 O(2^n)
int n,C,w[N],v[N],suf[N],best;                 // suf[i]=v[i..n] 之和
bool cmp(int a,int b){return 1LL*v[a]*w[b]>1LL*v[b]*w[a];}   // 单位价值降序
void dfs(int i,int cw,int cv){
  if(cw>C)return;                                          // 可行性剪枝
  if(cv+suf[i]<=best)return;                               // 最优性剪枝(上界)
  if(i>n){best=max(best,cv);return;}
  if(cw+w[i]<=C)dfs(i+1,cw+w[i],cv+v[i]);                  // 顺序剪枝: 先搜"选"
  dfs(i+1,cw,cv);
}

```

> ⚠️ 最优性剪枝的上界必须**可采纳**（绝不高估），否则剪掉最优解。常用紧上界：「剩余全取」「剩余按单位价值贪心」。
> ⚠️ 递归深度可达 1e5 级（长链图），深链 + 大局部数组会 RE。
#### 2. 迭代加深 IDDFS / IDA*
限制深度 dep 反复 DFS，用「重搜浅层」换 O(dep) 空间；分支多时浅层重搜可忽略。加**估价函数 h(u)**（u 到目标的乐观下界）即 IDA*。

```cpp

// IDA*: 适用"求最少步数 + 状态空间大 + 判重难", 时间 O(b^limit), 空间 O(limit)
int limit;
int h(int u);                                  // 题目给出, 必须 h(u) <= 真实剩余步数
bool iddfs(int u,int d){
  if(h(u)==0)return true;                                  // 到达目标
  if(d+h(u)>limit)return false;                            // IDA* 剪枝
  for(int v:nxt(u)){if(vis[v])continue;vis[v]=1;if(iddfs(v,d+1))return true;vis[v]=0;}
  return false;
}
int solve(int s){for(limit=0;limit<=MAXD;++limit)if(iddfs(s,0))return limit;return -1;}

```

> ⚠️ IDA* 每层从根重搜，h 必须 O(1) 或 O(小常数) 维护，否则常数爆炸。
#### 3. 双向 BFS
起点终点同时 BFS，**每次扩展队列较小的一侧**，两端 frontier 相遇即最短路。状态数从 b^d 降到约 2*b^(d/2)。

```cpp

// 双向 BFS: 以"翻转某一位"的玩具状态空间为例; 时间约 O(b^(d/2)), 空间同
unordered_map<int,int> d1,d2;                  // 两侧到该状态的距离
vector<int> nxt(int u);                        // 题目给出的状态转移
int bfs2(int s,int t,int k){
  if(s==t)return 0;
  queue<int> q1,q2; q1.push(s); q2.push(t); d1[s]=0; d2[t]=0;
  while(!q1.empty()&&!q2.empty()){
    if(q1.size()>q2.size()){swap(q1,q2);swap(d1,d2);}      // 扩展小的一侧
    for(int sz=q1.size();sz--;){                           // 按层扩展
      int u=q1.front(); q1.pop();
      for(int v:nxt(u)){if(d1.count(v))continue;
        if(d2.count(v))return d1[u]+1+d2[v];               // 相遇
        d1[v]=d1[u]+1; q1.push(v);}
    }
  }
  return -1;
}

```

> ⚠️ 相遇判断必须在**入队时**做（出队时做会漏最优层）。双向 BFS 要求**转移可逆**且目标是单个状态；目标是一整类状态时用多源 BFS。
#### 4. BFS 框架：网格 / 多源 / 0-1 / 状态压缩

```cpp

// 4.1 网格 BFS 最短路(边权全 1): O(n*m)
const int dx[4]={-1,0,1,0},dy[4]={0,1,0,-1};   // 四方向
// 八方向: dx[8]={-1,-1,-1,0,0,1,1,1}, dy[8]={-1,0,1,-1,1,-1,0,1}
int n,m,dis[N][N];
int bfs(int sx,int sy,int tx,int ty){
  memset(dis,-1,sizeof dis); queue<pair<int,int>> q; q.push({sx,sy}); dis[sx][sy]=0;
  while(!q.empty()){
    auto [x,y]=q.front(); q.pop();
    if(x==tx&&y==ty)return dis[x][y];
    for(int d=0;d<4;++d){int nx=x+dx[d],ny=y+dy[d];
      if(nx<1||nx>n||ny<1||ny>m||dis[nx][ny]!=-1||g[nx][ny]=='#')continue;
      dis[nx][ny]=dis[x][y]+1; q.push({nx,ny});}
  }
  return -1;
}
// 4.2 多源 BFS: 所有源点 dis=0 一起入队, 求每点到最近源点距离; O(n*m)
void bfs_multi(vector<pair<int,int>>&src){
  memset(dis,-1,sizeof dis); queue<pair<int,int>> q;
  for(auto&p:src){dis[p.first][p.second]=0;q.push(p);}
  while(!q.empty()){/* 同上扩展 */}
}
// 4.3 0-1 BFS: 边权只有 0/1, deque 代替优先队列; 每点最多入队 2 次, O(n+m)
int dis[N];
void bfs01(int s){
  memset(dis,0x3f,sizeof dis); deque<int> q; dis[s]=0; q.push_front(s);
  while(!q.empty()){int u=q.front();q.pop_front();
    for(auto [v,w]:e[u])                                          // w 必须是 0 或 1
      if(dis[u]+w<dis[v]){dis[v]=dis[u]+w;(w==0?q.push_front(v):q.push_back(v));}}
}
// 4.4 状态压缩 BFS: 状态压进 int/uint64, 数组或哈希判重; O(状态数 * 转移数)
int dis[1<<K];                                 // K <= 20 左右
int bfs_mask(int s,int t){
  memset(dis,-1,sizeof dis); queue<int> q; q.push(s); dis[s]=0;
  while(!q.empty()){int u=q.front();q.pop(); if(u==t)return dis[u];
    for(int i=0;i<K;++i){int v=u^(1<<i);if(dis[v]==-1){dis[v]=dis[u]+1;q.push(v);}}}  // 翻转第 i 位
  return -1;}                                   // 更小的 K 用数组快, 大的 K 换哈希表

```

> ⚠️ 0-1 BFS 不能用「出队即定型」的 `vis` 剪枝：一个点可能先以较大 dis 出队、之后被更小 dis 更新，只能靠 `dis[u]+w<dis[v]` 判断，这是最常见的写挂点。
> ⚠️ 2^K 开不下数组就换 `unordered_map<int,int>`；哈希常数大，能开数组就别用哈希。
#### 5. 记忆化搜索
自顶向下 DFS + 缓存，只访问可达状态，适合转移的拓扑序不明显的 DP。

```cpp

// 滑雪(网格最长下降路径): 时间 O(n*m), 空间 O(n*m)
int n,m,h[N][N],f[N][N];
int dfs(int x,int y){
  if(f[x][y]!=-1)return f[x][y];                           // 命中缓存
  f[x][y]=1;
  for(int d=0;d<4;++d){int nx=x+dx[d],ny=y+dy[d];
    if(nx<1||nx>n||ny<1||ny>m||h[nx][ny]>=h[x][y])continue;
    f[x][y]=max(f[x][y],dfs(nx,ny)+1);}
  return f[x][y];}

```

> ⚠️ 缓存初值必须用**取不到的值**（如 -1）区分「未算」与「答案就是 0」；多测要整体清空。
> ⚠️ 递归层数 = 最长路径长度，网格题可达 n*m，深链会爆栈，必要时改按拓扑序递推。
#### 6. A* 启发式搜索
按 `f = g + h` 出堆，h(u) 是 u 到目标的估计距离。**可采纳**（h <= h*）保证最优；**一致**（h(u) <= w(u,v) + h(v)）保证出堆即定型。h ≡ 0 退化为 Dijkstra，边权全 1 时即 BFS。

```cpp

// A* 网格最短路: h=曼哈顿距离(四方向, 可采纳且一致); 最坏 O(n*m*log), 通常远快
struct Node{int f,x,y; bool operator<(const Node&o)const{return f>o.f;}};
int astar(int sx,int sy,int tx,int ty){
  memset(dis,0x3f,sizeof dis); priority_queue<Node> q;
  dis[sx][sy]=0; q.push({abs(sx-tx)+abs(sy-ty),sx,sy});
  while(!q.empty()){
    Node c=q.top(); q.pop();
    if(c.x==tx&&c.y==ty)return dis[tx][ty];
    if(c.f>dis[c.x][c.y]+abs(c.x-tx)+abs(c.y-ty))continue;  // 过期节点
    for(int d=0;d<4;++d){int nx=c.x+dx[d],ny=c.y+dy[d];
      if(nx<1||nx>n||ny<1||ny>m||g[nx][ny]=='#')continue;
      if(dis[c.x][c.y]+1<dis[nx][ny]){dis[nx][ny]=dis[c.x][c.y]+1;
        q.push({dis[nx][ny]+abs(nx-tx)+abs(ny-ty),nx,ny});}}}
  
  return -1;
}

```

> ⚠️ 八数码的 h 常用「不在位数字个数」（可采纳且一致），比「曼哈顿距离和」弱但更快；k 短路取 h = 到终点的最短路（反图预处理），第 k 次弹出终点即答案。
#### 7. Dancing Links (DLX) 简述
求解**精确覆盖**（选若干行使每列恰好一个 1）。X 算法：选含 1 最少的列 c，枚举行 r 覆盖 c，删除 r 覆盖的所有列及其行，递归；失败则恢复。DLX 用**双向十字链表**把删除/恢复做到 O(1)。

```cpp

// DLX 精确覆盖模板: 节点数 = 1 的个数 + 列数
const int MAXN=500010;
int n,m,tot,ansn,L[MAXN],R[MAXN],U[MAXN],D[MAXN],row[MAXN],col[MAXN],siz[MAXN],head[MAXN],ans[MAXN];
void init(int r,int c){n=r; m=c;               // r 行 c 列
  for(int i=0;i<=c;++i){L[i]=i-1;R[i]=i+1;U[i]=D[i]=i;siz[i]=0;}
  L[0]=c; R[c]=0; tot=c+1; for(int i=1;i<=r;++i)head[i]=-1;}
void add(int r,int c){                         // 第 r 行插入一个 1(列 c)
  int x=tot++; row[x]=r; col[x]=c; ++siz[c];
  D[x]=D[c]; U[x]=c; U[D[c]]=x; D[c]=x;
  if(head[r]==-1)head[r]=L[x]=R[x]=x;
  else{R[x]=R[head[r]];L[x]=head[r];L[R[head[r]]]=x;R[head[r]]=x;}
}
void remove(int c){R[L[c]]=R[c];L[R[c]]=L[c];
  for(int i=D[c];i!=c;i=D[i])for(int j=R[i];j!=i;j=R[j]){U[D[j]]=U[j];D[U[j]]=D[j];--siz[col[j]];}}
void resume(int c){for(int i=U[c];i!=c;i=U[i])for(int j=L[i];j!=i;j=L[j]){U[D[j]]=j;D[U[j]]=j;++siz[col[j]];}
  R[L[c]]=c; L[R[c]]=c;}
bool dance(int d){
  if(R[0]==0){ansn=d;return true;}                         // 所有列已覆盖
  int c=R[0]; for(int i=R[0];i!=0;i=R[i])if(siz[i]<siz[c])c=i;   // 选 1 最少的列
  remove(c);
  for(int i=D[c];i!=c;i=D[i]){
    ans[d]=row[i];
    for(int j=R[i];j!=i;j=R[j])remove(col[j]);
    if(dance(d+1))return true;
    for(int j=L[i];j!=i;j=L[j])resume(col[j]);
  }
  resume(c); return false;
}

```

> ⚠️ 恢复顺序必须与删除顺序**严格相反**：删按 R 走，恢复就按 L 走，写反会静默出错。
#### 8. 连通块 Floodfill

```cpp

// BFS 版求连通块个数/大小: O(n*m)
int cnt;
void flood(int sx,int sy){
  queue<pair<int,int>> q; q.push({sx,sy}); vis[sx][sy]=1;
  while(!q.empty()){
    auto [x,y]=q.front(); q.pop();
    for(int d=0;d<4;++d){int nx=x+dx[d],ny=y+dy[d];
      if(nx<1||nx>n||ny<1||ny>m||vis[nx][ny])continue;
      if(g[nx][ny]!=g[sx][sy])continue;                    // 同色/同类型才扩展
      vis[nx][ny]=1; q.push({nx,ny});}}}

// 主函数: for i,j if(!vis[i][j]) flood(i,j), ++cnt;

```

> ⚠️ 8 连通时对角线可穿过「两个障碍的夹角」，题目要求不可穿越时需额外判断。
### B. 图论
#### 9. 存图三件套与适用场景

```cpp

// 9.1 链式前向星: 最省内存最快, 支持边编号(i^1 取反向边)
int hd[N],to[M],wt[M],nxt[M],cnt=1;            // cnt 从 1 开始, 反向边 = i^1
void add(int u,int v,int w){to[++cnt]=v;wt[cnt]=w;nxt[cnt]=hd[u];hd[u]=cnt;}
void add2(int u,int v,int w){add(u,v,w);add(v,u,w);}
// 遍历出边: for(int i=hd[u];i;i=nxt[i]){int v=to[i],w=wt[i];}
// 9.2 vector 邻接表: 写法最短, 遍历方便, 不支持边编号; 默认首选
vector<pair<int,int>> e[N];                    // 加边: e[u].push_back({v,w});
// 遍历: for(auto [v,w]:e[u]){ }
// 9.3 邻接矩阵: O(1) 查边, 适合 n <= 2000 的稠密图 / Floyd / 传递闭包
int g[N][N];                                   // 加边: g[u][v]=min(g[u][v],w);

```

| 存图方式 | 空间 | 查边 | 遍历出边 | 适用 |
|---|---|---|---|---|
| 链式前向星 | O(n+m) | O(deg) | O(deg) 最快 | 大图、需边编号（网络流/割边） |
| vector 邻接表 | O(n+m) | O(deg) | O(deg) | 默认首选 |
| 邻接矩阵 | O(n^2) | O(1) | O(n) | n<=2000 稠密图、Floyd、bitset 闭包 |
> ⚠️ 无向图边数开 2m，有向图开 m；链式前向星 `cnt` 必须从 1 开始才能用 `i^1`。
#### 10. 拓扑排序与 DAG 上 DP

```cpp

// 10.1 Kahn: O(n+m)。最终出队点数 < n 则有环
int deg[N],ord[N],tot;
bool topo(int n){
  queue<int> q; for(int i=1;i<=n;++i)if(!deg[i])q.push(i);
  while(!q.empty()){int u=q.front();q.pop();ord[++tot]=u;for(int v:e[u])if(--deg[v]==0)q.push(v);}
  return tot==n;                               // false 表示有环; 要字典序最小就换 priority_queue
}
// 10.2 DFS 三色判环: 0 未访问, 1 在栈中, 2 已完成
int col[N]; bool cyc;
void dfs(int u){
  col[u]=1;
  for(int v:e[u]){if(col[v]==1)cyc=true;else if(col[v]==0)dfs(v);}   // 指向栈中节点 => 有环
  col[u]=2;
}
// 10.3 DAG 上 DP: 按拓扑序转移(最长路/计数/方案数); O(n+m)
void dagdp(int n){for(int i=1;i<=n;++i){int u=ord[i];for(auto [v,w]:e[u])f[v]=max(f[v],f[u]+w);}}

```

> ⚠️ 有环图不能直接 DP；先 Tarjan 缩点成 DAG 再 DP 是通用套路。
#### 11. 最短路全家桶

```cpp

// 11.1 Dijkstra 堆优化: 不能有负权边, O(m log n)
const int INF=0x3f3f3f3f;
int dis[N];
void dijkstra(int s){
  memset(dis,0x3f,sizeof dis);
  priority_queue<pair<int,int>,vector<pair<int,int>>,greater<>> q;
  dis[s]=0; q.push({0,s});
  while(!q.empty()){
    auto [d,u]=q.top(); q.pop();
    if(d>dis[u])continue;                                  // 过期节点
    for(auto [v,w]:e[u])if(dis[u]+w<dis[v]){dis[v]=dis[u]+w;q.push({dis[v],v});}}
}
// 11.2 SPFA + SLF/LLL + 判负环: 最坏 O(nm), 可被构造数据卡死
int dis[N],cnt[N]; bool inq[N];
bool spfa(int s){                              // 返回 false <=> s 可达负环
  memset(dis,0x3f,sizeof dis); memset(cnt,0,sizeof cnt); memset(inq,0,sizeof inq);  // 多测必须清空
  deque<int> q; dis[s]=0; q.push_back(s); inq[s]=1;
  long long sum=0;                                         // 队内 dis 之和, 供 LLL 用
  while(!q.empty()){
    int u=q.front(); q.pop_front(); inq[u]=0; sum-=dis[u];
    for(auto [v,w]:e[u]){
      if(dis[u]+w<dis[v]){
        dis[v]=dis[u]+w; cnt[v]=cnt[u]+1;
        if(cnt[v]>=n)return false;                         // 最短路经过 >= n 条边 => 负环
        if(!inq[v]){
          inq[v]=1; sum+=dis[v];
          if(!q.empty()&&1LL*dis[v]*q.size()<sum)q.push_front(v);      // LLL
          else if(!q.empty()&&dis[v]<dis[q.front()])q.push_front(v);   // SLF
          else q.push_back(v);
        }
      }
    }
  }
  return true;
}

```

> ⚠️ **以 s 为源点判不出负环，只说明 s 到不了负环**，不代表图上没有负环。判整图负环要建超级源点 0 向所有点连权 0 边，再从 0 跑。
> ⚠️ 无负权边**一律用 Dijkstra**；SPFA 最坏 O(nm)，网格类数据可被轻易卡死。

```cpp

// 11.3 Floyd: 任意两点最短路, O(n^3), n <= 500 量级
for(int k=1;k<=n;++k)                          // k 必须在最外层!
  for(int i=1;i<=n;++i)for(int j=1;j<=n;++j)
    if(dis[i][k]+dis[k][j]<dis[i][j])dis[i][j]=dis[i][k]+dis[k][j];
// 传递闭包: bitset<N> b[N]; for(k)for(i)if(b[i][k])b[i]|=b[k];  // O(n^3/64)
// 判负环: 存在 i 使 dis[i][i] < 0
// 11.4 Johnson 全源最短路(简述): 有负权边但无负环, O(n*m*log m), 稀疏图优于 Floyd
// 超级源点 0 -> 所有点(权 0), SPFA 求势能 h[]; 有负环则无解
// 重赋权 w'(u,v)=w(u,v)+h[u]-h[v] >= 0, 对每个源点跑 Dijkstra; 还原 dis(u,v)=d'(u,v)-h[u]+h[v]

```

> ⚠️ Floyd 的 INF 用 0x3f3f3f3f（两倍不溢出 int）；用 0x7fffffff 时 `dis[i][k]+dis[k][j]` 会溢出成负数。
> ⚠️ 11.4 为简述，代码未展开（待验证）；CSP 中全源最短路通常直接用 Floyd。
#### 12. 最小生成树

```cpp

// 12.1 Kruskal + 并查集: O(m log m), 稀疏图首选
int fa[N];
int find(int x){return fa[x]==x?x:fa[x]=find(fa[x]);}
struct Edge{int u,v,w;} eg[M];
int kruskal(int n,int m){
  for(int i=1;i<=n;++i)fa[i]=i;
  sort(eg+1,eg+m+1,[](const Edge&a,const Edge&b){return a.w<b.w;});
  int sum=0,used=0;
  for(int i=1;i<=m;++i){
    int x=find(eg[i].u),y=find(eg[i].v);
    if(x==y)continue;
    fa[x]=y; sum+=eg[i].w; if(++used==n-1)break;
  }
  return used==n-1?sum:-1;                     // -1 表示不连通
}
// 12.2 Prim 朴素: O(n^2), 稠密图/完全图优于 Kruskal; g[][] 为邻接矩阵
int dis[N]; bool vis[N];
int prim(int n){
  memset(dis,0x3f,sizeof dis); memset(vis,0,sizeof vis); dis[1]=0; int sum=0;   // 多测要清 vis
  for(int i=1;i<=n;++i){
    int u=0;
    for(int v=1;v<=n;++v)if(!vis[v]&&(!u||dis[v]<dis[u]))u=v;
    if(dis[u]==INF)return -1;                              // 不连通
    vis[u]=1; sum+=dis[u];
    for(int v=1;v<=n;++v)if(!vis[v]&&g[u][v]<dis[v])dis[v]=g[u][v];}
  return sum;
}
// 12.3 非严格次小生成树(简述): 先求 MST, 枚举每条非树边 (u,v,w),
//      用倍增求 MST 上 u-v 路径的最大边权 mx, ans=min(ans, sum-mx+w); O(m log m)
// 严格次小生成树: 再维护"严格次大边权", 当 w == mx 时用严格次大值替换

```

> ⚠️ 堆优化 Prim 无法 decrease-key，复杂度不优于 Kruskal 且常数更大；稠密图直接用 O(n^2) 版本。
> ⚠️ 12.3 为简述，代码未展开（待验证）；了解「枚举非树边 + 路径最大值」即可。
#### 13. Tarjan 全家桶

```cpp

// 13.1 强连通分量 SCC + 缩点: O(n+m)。scc 编号是反拓扑序(编号小 => 靠近汇点)
vector<int> e[N];
int dfn[N],low[N],stk[N],top,tim,scc[N],scnt,sz[N];
void tarjan(int u){
  dfn[u]=low[u]=++tim; stk[++top]=u;
  for(int v:e[u]){
    if(!dfn[v]){tarjan(v);low[u]=min(low[u],low[v]);}
    else if(!scc[v])low[u]=min(low[u],dfn[v]);             // v 还在栈中
  }
  if(low[u]==dfn[u]){++scnt;int v;do{v=stk[top--];scc[v]=scnt;++sz[scnt];}while(v!=u);}
}
// 调用: for(int i=1;i<=n;++i)if(!dfn[i])tarjan(i);
// 缩点: for(u)for(v:e[u])if(scc[u]!=scc[v])add(scc[u],scc[v]);  // 先排序去重

```

> ⚠️ `else if(!scc[v])` 不能写成 `else`：指向已定型 SCC 的边用 dfn[v] 更新会使 low 变小而出错。

```cpp

// 13.2 割点 & 桥(无向图, 支持重边): 链式前向星 cnt 从 1 开始, O(n+m)
int hd[N],to[M],nxt[M],cnt=1;
int dfn[N],low[N],tim,root;
bool cut[N],isbridge[M];
void add(int u,int v){to[++cnt]=v;nxt[cnt]=hd[u];hd[u]=cnt;}
void tarjan(int u,int inedge){
  dfn[u]=low[u]=++tim; int child=0;
  for(int i=hd[u];i;i=nxt[i]){int v=to[i];
    if(i==(inedge^1))continue;                             // 只跳过"来时那条边", 重边不受影响
    if(!dfn[v]){
      ++child; tarjan(v,i); low[u]=min(low[u],low[v]);
      if(low[v]>dfn[u])isbridge[i]=isbridge[i^1]=true;      // 桥
      if(low[v]>=dfn[u]&&u!=root)cut[u]=true;               // 割点(非根)
    }else low[u]=min(low[u],dfn[v]);
  }
  if(u==root&&child>1)cut[u]=true;                         // 根: 至少两个孩子才是割点
}
// 13.3 边双 eDCC(简述): 删掉所有桥后的连通块; 求完桥对非桥边 DFS 染色即可, O(n+m)
// 13.4 点双 vDCC(简述): 栈存"点", low[v]>=dfn[u] 时弹栈直到 v, 再把 u 也压入该分量;
//      每个割点属于多个点双, 点双缩点后得到"圆方树"(约 2n 个点)

```

> ⚠️ 割点判定 `low[v]>=dfn[u]`，桥判定 `low[v]>dfn[u]`，差一个等号，写反全错。
> ⚠️ 用 `v!=fa` 判父亲在有重边时会漏判桥（第二条重边被当成回边）；必须用**边编号**判断。
> ⚠️ 13.3/13.4 为简述，代码未展开（待验证）；CSP 中掌握割点/桥即可，点双极少考。
#### 14. 2-SAT
每个变量 i 拆两点：i 表示「真」，i+n 表示「假」。约束 (a 取 av) 或 (b 取 bv) 连两条**逆否**边。

```cpp

// 2-SAT: O(n+m)。点 i = 真, i+n = 假
void add_clause(int a,bool av,int b,bool bv){  // (x_a == av) 或 (x_b == bv)
  int na=av?a+n:a, nb=bv?b+n:b;                // na = ¬(a==av), nb = ¬(b==bv)
  e[na].push_back(bv?b:b+n);                   // ¬(a==av) -> (b==bv)
  e[nb].push_back(av?a:a+n);                   // ¬(b==bv) -> (a==av)
}
bool solve(){
  for(int i=1;i<=2*n;++i)if(!dfn[i])tarjan(i);
  for(int i=1;i<=n;++i)if(scc[i]==scc[i+n])return false;   // 无解
  for(int i=1;i<=n;++i)val[i]=scc[i]<scc[i+n];             // Tarjan 编号是反拓扑序
  return true;}

```

> ⚠️ 取值方向：Tarjan 的 SCC 编号是**反拓扑序**，故 `scc[i] < scc[i+n]` 时 x_i 取真；换成 Kosaraju 或按拓扑序编号要反向。
> ⚠️ 常见改写：`x_a 或 x_b` → add_clause(a,1,b,1)；`x_a 蕴含 x_b` → add_clause(a,0,b,1)；`x_a 与 x_b 不同` → add_clause(a,1,b,0) + add_clause(a,0,b,1)。
#### 15. 最近公共祖先 LCA

```cpp

// 15.1 倍增法: 预处理 O(n log n), 单次查询 O(log n)
const int LG=20;                               // 2^20 > 1e6; n 到 1e5 用 17
int dep[N],fa[N][LG];
void dfs(int u,int p){
  dep[u]=dep[p]+1; fa[u][0]=p;
  for(int j=1;j<LG;++j)fa[u][j]=fa[fa[u][j-1]][j-1];
  for(int v:e[u])if(v!=p)dfs(v,u);}
int lca(int u,int v){
  if(dep[u]<dep[v])swap(u,v);
  int d=dep[u]-dep[v];
  for(int j=0;d;++j,d>>=1)if(d&1)u=fa[u][j];               // 先拉到同深度
  if(u==v)return u;
  for(int j=LG-1;j>=0;--j)if(fa[u][j]!=fa[v][j])u=fa[u][j],v=fa[v][j];
  return fa[u][0];
}
// 树上两点距离: dep[u]+dep[v]-2*dep[lca(u,v)]
// 15.2 Tarjan 离线 LCA: O(n + m*alpha(n)), 适合大量询问
int fa[N],ans[Q]; bool vis[N];
vector<pair<int,int>> qry[N];                  // qry[u] = {(v, 询问编号)}
int find(int x){return fa[x]==x?x:fa[x]=find(fa[x]);}
void tarjan(int u,int p){
  vis[u]=1; fa[u]=u;
  for(int v:e[u])if(v!=p){tarjan(v,u);fa[v]=u;}            // 回溯时把子树并到 u
  for(auto [v,id]:qry[u])if(vis[v])ans[id]=find(v);        // v 已访问 => LCA = find(v)
}

```

> ⚠️ 根的父亲初始化为 0 且 `fa[0][j]=0`，否则倍增跳出树外会读到脏值。LG 至少取 log2(n)+1。
> ⚠️ 离线算法必须先读完所有询问；`fa[v]=u` 必须在子节点 DFS **返回之后**执行。
#### 16. 树上问题

```cpp

// 16.1 树的直径: 两次 DFS/BFS, O(n); 不能有负权边
int far; long long best;
void dfs(int u,int p,long long d){
  if(d>best)best=d,far=u;
  for(auto [v,w]:e[u])if(v!=p)dfs(v,u,d+w);
}
// 调用: best=-1,dfs(1,0,0); best=-1,dfs(far,0,0); 此时 best 即直径长度
// 16.2 树的直径(树形 DP): O(n), 可处理负权边
long long dp[N],D;
void dfs2(int u,int p){
  dp[u]=0;
  for(auto [v,w]:e[u])if(v!=p){dfs2(v,u);
    D=max(D,dp[u]+dp[v]+w);                                // 先用旧 dp[u] 再更新, 避免同子树走两次
    dp[u]=max(dp[u],dp[v]+w);}
}
// 16.3 树的重心: O(n)。删去后最大连通块 <= n/2; 重心至多两个且相邻
int sz[N],mx[N],ct;                           // 依赖全局 n
void dfs3(int u,int p){
  sz[u]=1; mx[u]=0;
  for(int v:e[u])if(v!=p){dfs3(v,u);sz[u]+=sz[v];mx[u]=max(mx[u],sz[v]);}
  mx[u]=max(mx[u],n-sz[u]);                                // "向上"的那棵子树
  if(!ct||mx[u]<mx[ct])ct=u;                               // 重量最小的点即重心(注意 ct 初值)
}
// 16.4 树上差分: 先做修改, 最后一遍 DFS 求子树和还原; O(n + k log n)
int d[N];                                      // 差分数组; 依赖 15.1 的 lca / fa[][]
void add_point(int x,int y,int v){int l=lca(x,y); d[x]+=v; d[y]+=v; d[l]-=v; d[fa[l][0]]-=v;}  // 点差分
void add_edge(int x,int y,int v){int l=lca(x,y); d[x]+=v; d[y]+=v; d[l]-=2*v;}                // 边差分
void dfs4(int u,int p){for(int v:e[u])if(v!=p){dfs4(v,u);d[u]+=d[v];}}  // 自底向上求和还原
// 16.5 欧拉序: DFS 时每到一个点(含回溯)都记录, 长度 2n-1
// pos[u] = u 首次出现的位置; LCA(u,v) = E[pos[u]..pos[v]] 中深度最小的点
int E[2*N],dd[2*N],pos[N],tot;
void dfs5(int u,int p,int d){
  E[++tot]=u; dd[tot]=d; pos[u]=tot;
  for(int v:e[u])if(v!=p){dfs5(v,u,d+1);E[++tot]=u;dd[tot]=d;}}
// 配 ST 表: 预处理 O(n log n), 查询 O(1)

```

> ⚠️ 点差分要减到 `fa[lca]`，边差分只减到 lca（减 2v）；根的 `fa[root][0]=0`，减在下标 0 上不影响答案。
> ⚠️ 另一种「欧拉序」是括号序（入栈出栈各记一次，长度 2n），用于把子树变成连续区间 `[in[u],out[u]]`，两者别混。
#### 17. 二分图与网络流

```cpp

// 17.1 染色判定二分图: O(n+m)。存在奇环 <=> 不是二分图
int col[N];                                    // 0 未染色, 1 / -1 两色
bool dfs(int u,int c){col[u]=c;
  for(int v:e[u]){if(col[v]==c)return false;if(!col[v]&&!dfs(v,-c))return false;}  // 同色 => 奇环
  return true;}
// 主函数: for i if(!col[i] && !dfs(i,1)) { 不是二分图 }  —— 图可能不连通, 每个未染色点都要跑
// 17.2 匈牙利(Kuhn) 二分图最大匹配: O(V*E)
int match[N]; bool vis[N];
bool dfs2(int u){
  for(int v:e[u]){                             // e 只存 左部 -> 右部 的边
    if(vis[v])continue;
    vis[v]=1;
    if(!match[v]||dfs2(match[v])){match[v]=u;return true;}
  }
  return false;
}
int hungary(int n){
  int res=0; memset(match,0,sizeof match);                        // 多测要清 match
  for(int i=1;i<=n;++i){memset(vis,0,sizeof vis);if(dfs2(i))++res;}   // vis 只标记右部, 每轮清空
  return res;}                                 // match 只记"右部匹配到谁", 左部不需要 match

```

| König 定理与常用转化（二分图） | 公式 |
|---|---|
| 最大匹配 | = 最小点覆盖 |
| 最大独立集 | = 总点数 - 最大匹配 |
| 最小边覆盖 | = 总点数 - 最大匹配 |
| DAG 最小路径覆盖 | = n - 拆点二分图最大匹配 |

```cpp

// 17.3 Dinic 最大流: 一般图 O(n^2 m), 单位容量二分图 O(m*sqrt(n))
struct Edge{int to,nxt,cap;} e[M];
int hd[N],cnt=1,dep[N],cur[N],S,T;
void add(int u,int v,int c){e[++cnt]={v,hd[u],c};hd[u]=cnt;e[++cnt]={u,hd[v],0};hd[v]=cnt;}
bool bfs(){                                    // 在残量网络上分层
  memset(dep,0,sizeof dep); queue<int> q; dep[S]=1; q.push(S);
  while(!q.empty()){int u=q.front();q.pop();
    for(int i=hd[u];i;i=e[i].nxt){int v=e[i].to;if(e[i].cap&&!dep[v]){dep[v]=dep[u]+1;q.push(v);}}}
  return dep[T];}
int dfs(int u,int f){                          // 当前弧优化
  if(u==T)return f;
  for(int &i=cur[u];i;i=e[i].nxt){int v=e[i].to;
    if(e[i].cap&&dep[v]==dep[u]+1){int d=dfs(v,min(f,e[i].cap));if(d){e[i].cap-=d;e[i^1].cap+=d;return d;}}}
  return 0;
}
int dinic(){int flow=0,f; while(bfs()){memcpy(cur,hd,sizeof hd);while((f=dfs(S,0x3f3f3f3f)))flow+=f;} return flow;}
// 二分图匹配建模: S->左部容量 1, 右部->T 容量 1, 中间边容量 1, 答案即最大流

```

> ⚠️ 无向边要建**两条有向边**各带反向边，不能只 add(u,v,c) 一次。

```cpp

// 17.4 费用流(SSP/EK, SPFA 找单位费用最小增广路): 单次 O(nm), 总 O(n*m*f)
struct Edge{int to,nxt,cap,w;} e[M];
int hd[N],cnt=1,dis[N],inq[N],pre[N],pe[N],S,T;
void add(int u,int v,int c,int w){e[++cnt]={v,hd[u],c,w};hd[u]=cnt;e[++cnt]={u,hd[v],0,-w};hd[v]=cnt;}
bool spfa(){
  memset(dis,0x3f,sizeof dis); memset(inq,0,sizeof inq);
  queue<int> q; dis[S]=0; q.push(S); inq[S]=1;
  while(!q.empty()){int u=q.front();q.pop();inq[u]=0;
    for(int i=hd[u];i;i=e[i].nxt){int v=e[i].to;
      if(e[i].cap&&dis[u]+e[i].w<dis[v]){dis[v]=dis[u]+e[i].w;pre[v]=u;pe[v]=i;if(!inq[v])inq[v]=1,q.push(v);}}}
  return dis[T]<0x3f3f3f3f;}
void mcmf(int &flow,int &cost){
  flow=cost=0;
  while(spfa()){int f=0x3f3f3f3f;
    for(int v=T;v!=S;v=pre[v])f=min(f,e[pe[v]].cap);
    for(int v=T;v!=S;v=pre[v]){e[pe[v]].cap-=f;e[pe[v]^1].cap+=f;cost+=f*e[pe[v]].w;}
    flow+=f;}}

```

> ⚠️ 有负费用边时 SPFA 版仍正确；换 Dijkstra 版必须先用 SPFA 求初始势能 h[]，每轮增广后 `h[i]+=dis[i]`（Primal-Dual）。
#### 18. 差分约束 / 欧拉路径 / 基环树

```cpp

// 18.1 差分约束(简述):
// x_i - x_j <= c  =>  加边 j -> i, 权 c, 跑最短路
// x_i - x_j >= c  =>  加边 j -> i, 权 c, 跑最长路(或改写成 x_j - x_i <= -c 跑最短路)
// x_i - x_j == c  =>  上面两条都加
// 超级源点 0 向所有点连权 0 的边, dis[0]=0; 有负环 => 无解, 否则 x_i = dis[i]
// 求最大解跑最短路, 求最小解跑最长路; 用 SPFA 判负环, 最坏 O(nm)
// 18.2 欧拉路径/回路 Hierholzer: O(n+m), 用栈存"回溯点", 答案逆序
int hd[N],to[M],nxt[M],cnt=1;
bool vis[M];
int stk[M],top;
void dfs(int u){
  while(hd[u]){
    int i=hd[u]; hd[u]=nxt[i];                 // 当前弧: 边用完就删
    if(vis[i])continue;
    vis[i]=1; vis[i^1]=1;                      // 无向图: 反向边一起标记
    dfs(to[i]);}
  stk[++top]=u;                                // 回溯时入栈 => 逆序输出
}
// 输出: while(top) printf("%d ", stk[top--]);
// 18.3 基环树: n 点 n 边的连通无向图, 恰好一个环, 环上每点挂一棵树
// 找环(拓扑剥叶): 不断删度为 1 的点, 剩下的就是环上的点
void find_circle(int n){queue<int> q; for(int i=1;i<=n;++i)if(deg[i]==1)q.push(i);
  while(!q.empty()){int u=q.front();q.pop();oncir[u]=false;for(int v:e[u])if(--deg[v]==1)q.push(v);}}
// 基环内向树(每点出度 1): 常配合"跳父亲 + 访问标记"找环, 或直接 Tarjan
// 处理套路: 断环成链 —— 枚举环上一条边 (u,v), 分别"删边"和"强制选边"做两次树形 DP 取最优

```

> ⚠️ 超级源点不可省：只从某点跑会漏掉不可达部分的负环。建图方向口诀：`x_i <= x_j + c` → 边 `j → i` 权 c。
> ⚠️ 欧拉路径判定：**非零度点连通** 且（回路：所有点度为偶 / 有向图入度=出度）或（路径：恰好两个奇度点，从奇度点出发；有向图起点出-入=1，终点入-出=1）。
> ⚠️ 有向图不能盲目标记反向边 `i^1`——反向边可能是真实存在的边；有向图只标记当前边。
> ⚠️ 基环树断环时**两种情况都要算**（删边 / 强制选边）；环上 DP 注意不能同时选相邻环点。
### 附：CSP 图论易错清单
- 数组大小：无向图边数组开 2m，Dinic 边数组开 2*(m+n)，SCC 缩点后重边先去重。
- 1-based 与 0-based 混用是最高频 RE/WA 来源；本页统一 1-based，输入 0-based 时先 +1。
- 多测务必清空 dfn/low/scc/tim/scnt/hd/cnt/tot 等全局量。
- `0x3f3f3f3f` 做 INF 可安全相加两次；不要用 `0x7fffffff`。
- 递归深度：链式图 DFS 可达 1e5 层，必要时改迭代或改用 BFS。
- 无负权边优先 Dijkstra；SPFA 在 CSP 中容易被卡到 O(nm)。
- 树题先想「是否要换根 / 是否用 LCA + 差分」再动手写暴力。


## 第 03 章 动态规划

CSP 中 DP 是第 3~5 题的主力，常见形态是「线性/树形/状压 + 一个优化」。先定状态，再定转移顺序，最后估复杂度。

| 模型 | 状态 | 复杂度 | 常见优化 |
| --- | --- | --- | --- |
| 线性 | f[i] / f[i][j] | O(n) ~ O(n^2) | 前缀和、滚动数组 |
| 背包 | f[j] | O(nW) | 二进制拆分、单调队列、bitset |
| 区间 | f[i][j] | O(n^3) | 四边形不等式 → O(n^2) |
| 树形 | f[u][...] | O(nm) | 换根、上下界剪枝 |
| 状压 | f[S] / f[S][i] | O(2^n * n) | 枚举子集、轮廓线 |
| 数位 | f[pos][state] | O(位数 * 状态数) | 记忆化 |
| 期望 | E[u] | 同图 DP | DAG 逆推 |

### 1. 线性 DP 与状态设计
状态设计三步：**① 阶段**（已处理到哪）→ **② 附加信息**（还需知道什么才能转移）→ **③ 值**（最值 / 计数 / 可行性）。能压维就压维：f[i][*] 只由 f[i-1][*] 转移就用滚动数组；转移是连续区间就用前缀和。
#### 1.1 数字三角形（滚动数组）

```cpp

// 数字三角形: 自底向上, 一维滚动. O(n^2) 时间, O(n) 空间
for (int j = 1; j <= n; j++) f[j] = a[n][j];          // 最底层
for (int i = n - 1; i >= 1; i--)
  for (int j = 1; j <= i; j++)
    f[j] = max(f[j], f[j + 1]) + a[i][j];             // f[j]/f[j+1] 都是下一层

```

#### 1.2 最大子段和

```cpp

// 最大子段和: cur = 以当前位置结尾的最大和. O(n)
long long best = -1e18, cur = 0;
for (int i = 1; i <= n; i++)
  cur = max(cur + a[i], (long long)a[i]), best = max(best, cur);

```

#### 1.3 多维 DP（方格取数，四维压三维）

```cpp

// 方格取数: 两人同时从 (1,1) 走到 (n,n), 同格只算一次
// f[k][i][j]: 走了 k 步, 两人分别在 (i,k-i) 和 (j,k-j). O(n^3)
for (int k = 2; k <= 2 * n; k++)
  for (int i = 1; i <= n; i++)
    for (int j = 1; j <= n; j++) {
      int y1 = k - i, y2 = k - j;                       // 行号 -> 列号
      if (y1 < 1 || y1 > n || y2 < 1 || y2 > n) continue;
      long long add = (i == j) ? a[i][y1] : a[i][y1] + a[j][y2];
      f[k & 1][i][j] = max(max(f[~k & 1][i][j], f[~k & 1][i-1][j]),
                           max(f[~k & 1][i][j-1], f[~k & 1][i-1][j-1])) + add;
    }

```

> ⚠️ 滚动数组务必确认「本轮用到的旧值不会被本轮覆盖」；多维滚动先想清楚滚掉哪一维、读写是否同层。

### 2. 背包九讲精炼
#### 2.1 01 背包

```cpp

// 01 背包: f[j] = 容量 j 的最大价值; 体积 w[i], 价值 v[i]. O(nW)
// 至多 W: 全部初始化为 0; 恰好装满: f[0]=0, 其余 -INF
const long long NEG = -0x3f3f3f3f3f3f3f3fLL;
for (int j = 0; j <= W; j++) f[j] = (j == 0 ? 0 : NEG);   // 恰好装满
for (int i = 1; i <= n; i++)
  for (int j = W; j >= w[i]; j--)                          // 必须逆序!
    f[j] = max(f[j], f[j - w[i]] + v[i]);

```

> ⚠️ 逆序是为了让 f[j-w[i]] 仍是「第 i 件未考虑」的旧值（每件只用一次）。写成正序就退化成完全背包。
#### 2.2 完全背包

```cpp

// 完全背包: 每件无限个, 容量正序. O(nW)
for (int i = 1; i <= n; i++)
  for (int j = w[i]; j <= W; j++) f[j] = max(f[j], f[j - w[i]] + v[i]);

```

#### 2.3 多重背包（二进制拆分）

```cpp

// 多重背包: 第 i 件有 c0[i] 个, 拆成 1,2,4,...,余数 后做 01 背包
// O(W * sum log c[i])
int idx = 0;
for (int i = 1; i <= n; i++) {
  int c = c0[i];
  for (int k = 1; k <= c; k <<= 1) { c -= k; ww[++idx] = k * w[i]; vv[idx] = k * v[i]; }
  if (c) { ww[++idx] = c * w[i]; vv[idx] = c * v[i]; }
}
for (int i = 1; i <= idx; i++)
  for (int j = W; j >= ww[i]; j--) f[j] = max(f[j], f[j - ww[i]] + vv[i]);

```

#### 2.4 多重背包（单调队列优化）
转移 f[j] = max_{0<=k<=c} (g[j-k*w] + k*v)。按余数 r 分组，同组内 j = r + k*w，令 g[k] = f[r+k*w] - k*v，则 f_new[r+k*w] = max_{k-c<=k'<=k} g[k'] + k*v，即滑动窗口最大值。**可原地更新**（顺序枚举 k 时读到的 f[j] 仍是旧值）。

```cpp

// 多重背包 · 单调队列优化. O(nW); 队列存 (值, 下标 k)
for (int i = 1; i <= n; i++) {
  for (int r = 0; r < w[i] && r <= W; r++) {              // 按余数分组
    int L = 0, R = -1;
    for (int k = 0; r + k * w[i] <= W; k++) {
      int j = r + k * w[i];
      long long cur = f[j] - 1LL * k * v[i];
      while (L <= R && q[R].first <= cur) R--;            // 单调队列
      q[++R] = {cur, k};
      while (q[L].second < k - c0[i]) L++;                // 超出个数限制
      f[j] = q[L].first + 1LL * k * v[i];
    }
  }
}

```

> ⚠️ 内层上界是 r + k*w[i] <= W；队列要开在分组外、每组复位。w[i] > W 的整件物品无贡献，需特判跳过。
#### 2.5 分组背包
每组至多选一件。**容量循环必须在组内物品循环的外层**，否则同组会被选多次。

```cpp

// 分组背包: 第 k 组有 cnt[k] 件物品 (Wk[t], Vk[t]). O(W * sum cnt)
for (int k = 1; k <= ts; k++)
  for (int j = W; j >= 0; j--)                            // 容量在外
    for (int t = 0; t < cnt[k]; t++)                      // 组内物品在内
      if (j >= Wk[k][t]) f[j] = max(f[j], f[j - Wk[k][t]] + Vk[k][t]);

```

#### 2.6 依赖背包
- 附件少（金明的预算方案：每主件 ≤ 2 个附件）：把「主件 + 附件子集」枚举成 2^t 个方案，转**分组背包**。
- 附件是任意多叉树：直接做**树上背包**（见 5.3），复杂度 O(nm)。

```cpp

// 金明式依赖 -> 分组背包: plan[k] 预存组内所有 (费用, 价值) 方案. O(W * sum |plan[k]|)
for (int k = 1; k <= ts; k++)
  for (int j = W; j >= 0; j--)
    for (auto &pr : plan[k])
      if (j >= pr.first) f[j] = max(f[j], f[j - pr.first] + pr.second);

```

#### 2.7 方案数背包 / 恰好装满 vs 至多

```cpp

// 方案数: 把 max 换成加法, 初值 dp[0] = 1. O(nW)
dp[0] = 1;
for (int i = 1; i <= n; i++)                   // 01: 逆序, 每件用一次
  for (int j = W; j >= w[i]; j--) dp[j] += dp[j - w[i]];
for (int i = 1; i <= n; i++)                   // 完全: 正序, 每件无限
  for (int j = w[i]; j <= W; j++) dp[j] += dp[j - w[i]];
// 答案: 恰好装满 -> dp[W]; 至多 -> sum_{j<=W} dp[j]

```

> ⚠️ 初始化决定语义：**恰好**装满必须 f[0]=0、其余 -INF（求 max）/INF（求 min）；**至多**不超过容量则全 0。恰好装满时最优解不一定是 f[W]（可能装不满），求最优方案数要扫一遍所有取到最优值的 j。
#### 2.8 求具体方案

```cpp

// g[i][j]: 前 i 件物品容量 j 时是否选了第 i 件. O(nW)
for (int i = 1; i <= n; i++)
  for (int j = W; j >= w[i]; j--)
    if (f[i-1][j-w[i]] + v[i] > f[i-1][j]) { f[i][j] = f[i-1][j-w[i]] + v[i]; g[i][j] = 1; }
    else f[i][j] = f[i-1][j];
for (int i = n, j = W; i >= 1; i--)            // 从最后一件倒着回溯
  if (g[i][j]) { cout << i << ' '; j -= w[i]; }

```

### 3. LIS / LCS / 最短编辑距离
#### 3.1 LIS O(n^2) 与方案还原

```cpp

// LIS O(n^2) + 方案还原; p[i] 记录前驱
int ans = 0, ed = 1;
for (int i = 1; i <= n; i++) {
  f[i] = 1; p[i] = 0;
  for (int j = 1; j < i; j++)
    if (a[j] < a[i] && f[j] + 1 > f[i]) { f[i] = f[j] + 1; p[i] = j; }  // 非严格改 <=
  if (f[i] > ans) ans = f[i], ed = i;
}
for (int x = ed; x; x = p[x]) stk.push_back(a[x]);       // 逆序输出即一个 LIS

```

#### 3.2 LIS O(n log n)（贪心 + 二分）
d[l] = 所有长度为 l 的上升子序列中末尾元素的最小值。**严格上升用 lower_bound（第一个 >= a[i]），非严格（不下降）用 upper_bound（第一个 > a[i]）**。

```cpp

// LIS O(n log n) + 方案还原
int len = 0, pos[N] = {0}, pre[N] = {0};
for (int i = 1; i <= n; i++) {
  int p = lower_bound(d + 1, d + len + 1, a[i]) - d;   // 非严格: 换成 upper_bound
  d[p] = a[i]; pos[p] = i;
  pre[i] = (p > 1 ? pos[p - 1] : 0);
  if (p > len) len = p;
}
for (int x = pos[len]; x; x = pre[x]) stk.push_back(a[x]);   // 还原一个 LIS(逆序)

```

> ⚠️ d[] 本身**不是**合法 LIS，只能求长度；还原必须额外记 pos[]（每个长度最后被谁更新）与 pre[]。最长下降子序列 = 取负求 LIS，或倒序 + 严格性互换。
#### 3.3 LCS 与方案还原

```cpp

// LCS. O(nm); 滚动数组只能求长度, 还原必须存满表
for (int i = 1; i <= n; i++)
  for (int j = 1; j <= m; j++)
    if (a[i] == b[j]) f[i][j] = f[i-1][j-1] + 1;
    else f[i][j] = max(f[i-1][j], f[i][j-1]);
int i = n, j = m; string s;
while (i && j) {
  if (a[i] == b[j]) s += a[i], i--, j--;
  else if (f[i-1][j] >= f[i][j-1]) i--; else j--;
}
reverse(s.begin(), s.end());

```

#### 3.4 最短编辑距离

```cpp

// 编辑距离 (插入/删除/替换, 各代价 1). O(nm)
for (int i = 0; i <= n; i++) f[i][0] = i;
for (int j = 0; j <= m; j++) f[0][j] = j;
for (int i = 1; i <= n; i++)
  for (int j = 1; j <= m; j++)
    f[i][j] = min(min(f[i-1][j] + 1, f[i][j-1] + 1), f[i-1][j-1] + (a[i] != b[j]));

```

### 4. 区间 DP
套路：f[i][j] 表示区间 [i, j] 的最优值，按**区间长度**从小到大枚举；转移一般是「枚举分割点 k」或「由 f[i+1][j-1] 收缩」。
#### 4.1 石子合并（环形 → 破环成链）

```cpp

// 环形石子合并: 破环成链, 在 2n 的链上做区间 DP, 取长度 n 的窗口最优. O(n^3)
for (int i = 1; i <= 2 * n; i++) s[i] = s[i-1] + a[(i - 1) % n + 1];
memset(f, 0x3f, sizeof f);
for (int i = 1; i <= 2 * n; i++) f[i][i] = 0;
for (int len = 2; len <= n; len++)
  for (int i = 1, j = len; j <= 2 * n; i++, j++)
    for (int k = i; k < j; k++)
      f[i][j] = min(f[i][j], f[i][k] + f[k+1][j] + s[j] - s[i-1]);
int ans = INF;                                 // ans 与 f 同类型, 避免 min 类型不匹配
for (int i = 1; i <= n; i++) ans = min(ans, f[i][i + n - 1]);

```

#### 4.2 括号匹配

```cpp

// 最长合法括号子序列长度 (s[1..n]). O(n^3)
for (int len = 2; len <= n; len++)
  for (int i = 1, j = len; j <= n; i++, j++) {
    if ((s[i] == '(' && s[j] == ')') || (s[i] == '[' && s[j] == ']'))
      f[i][j] = max(f[i][j], f[i+1][j-1] + 2);
    for (int k = i; k < j; k++) f[i][j] = max(f[i][j], f[i][k] + f[k+1][j]);
  }

```

#### 4.3 回文区间 DP

```cpp

// 最长回文子序列长度; 最少插入次数构成回文 = n - 该值. O(n^2)
for (int i = 1; i <= n; i++) f[i][i] = 1;
for (int len = 2; len <= n; len++)
  for (int i = 1, j = len; j <= n; i++, j++)
    if (a[i] == a[j]) f[i][j] = f[i+1][j-1] + 2;
    else f[i][j] = max(f[i+1][j], f[i][j-1]);

```

> ⚠️ 区间 DP 边界：len=1（或 2）必须手动初始化，f[i+1][j-1] 在 len=2 时是空区间，按题意给 0。环形题最后要在长度为 n 的窗口里取最优。
#### 4.4 四边形不等式加速
w 满足四边形不等式（交叉小于包含：a<=b<=c<=d 时 w(a,c)+w(b,d) <= w(a,d)+w(b,c)）时，f[i][j] = min_k (f[i][k] + f[k+1][j] + w(i,j)) 的决策点满足 opt[i][j-1] <= opt[i][j] <= opt[i+1][j]，均摊 O(n^2)。

```cpp

// 四边形不等式优化区间 DP. O(n^2)
for (int i = 1; i <= n; i++) { f[i][i] = 0; opt[i][i] = i; }
for (int len = 2; len <= n; len++)
  for (int i = 1, j = len; j <= n; i++, j++) {
    f[i][j] = INF;
    for (int k = opt[i][j-1]; k <= opt[i+1][j]; k++)     // 决策区间被夹住
      if (f[i][j] > f[i][k] + f[k+1][j] + w(i, j)) {
        f[i][j] = f[i][k] + f[k+1][j] + w(i, j); opt[i][j] = k;
      }
  }

```

### 5. 树形 DP
#### 5.1 链式前向星 + 子树大小/深度

```cpp

int head[N], nxt[N << 1], to[N << 1], ecnt;
void add(int u, int v) { to[++ecnt] = v; nxt[ecnt] = head[u]; head[u] = ecnt; }
void dfs1(int u, int fa) {                    // 预处理 sz / dep. O(n)
  sz[u] = 1; dep[u] = dep[fa] + 1;      // 根深度为 1; 需根深度为 0 时先置 dep[0] = -1
  for (int i = head[u]; i; i = nxt[i]) {
    int v = to[i]; if (v == fa) continue;
    dfs1(v, u); sz[u] += sz[v];
  }
}

```

#### 5.2 最大独立集 / 最小点覆盖

```cpp

// 没有上司的舞会: f[u][1] 选 u, f[u][0] 不选 u. O(n)
void dfs(int u, int fa) {
  f[u][1] = val[u]; f[u][0] = 0;
  for (int i = head[u]; i; i = nxt[i]) {
    int v = to[i]; if (v == fa) continue;
    dfs(v, u);
    f[u][1] += f[v][0];                       // 选了 u 则儿子都不能选
    f[u][0] += max(f[v][0], f[v][1]);
  }
}
// 最小点覆盖 = 总点数 - 最大独立集

```

#### 5.3 树上背包
合并子树时按**已合并大小**限制循环上界，总复杂度 O(nm)（而不是 O(n m^2)）。

```cpp

// 选课: f[u][j] = u 的子树中选 j 个点的最大价值, u 必选. O(nm)
int dfs(int u, int fa) {
  int p = 1; f[u][1] = val[u];
  for (int i = head[u]; i; i = nxt[i]) {
    int v = to[i]; if (v == fa) continue;
    int siz = dfs(v, u);
    for (int a = min(p, m); a >= 1; a--)      // 倒序, 只用已合并的部分
      for (int b = 1; b <= siz && a + b <= m; b++)
        f[u][a + b] = max(f[u][a + b], f[u][a] + f[v][b]);
    p += siz;                                 // 上界剪枝的关键
  }
  return p;
}

```

> ⚠️ 树上背包的内存是 n*m，f[u] 必须开成 f[N][M]。合并时 a 倒序 + p 剪枝是 O(nm) 的关键，漏了会退化成 O(n m^2)。
#### 5.4 换根 DP（二次扫描）
先任取根自底向上求一次，再用 f[v] 与 f[u] 的递推关系自上而下推第二次。

```cpp

// f[u] = 所有点到 u 的距离之和. O(n)
dep[0] = -1;                               // 使根深度为 0, 否则 f[1] 整体偏大 n
f[1] = 0;
dfs1(1, 0);
for (int i = 1; i <= n; i++) f[1] += dep[i];  // 先算根的值
void dfs2(int u, int fa) {
  for (int i = head[u]; i; i = nxt[i]) {
    int v = to[i]; if (v == fa) continue;
    f[v] = f[u] - 2 * sz[v] + n;              // 子树内 -1, 其余 +1
    dfs2(v, u);
  }
}

```

#### 5.5 树的直径（DP 版，可带负边权）

```cpp

// d1/d2 = 向下的最长/次长链, 边权 wt. O(n)
void dfs(int u, int fa) {
  d1[u] = d2[u] = 0;
  for (int i = head[u]; i; i = nxt[i]) {
    int v = to[i]; if (v == fa) continue;
    dfs(v, u);
    int d = d1[v] + wt[i];
    if (d > d1[u]) { d2[u] = d1[u]; d1[u] = d; }
    else if (d > d2[u]) d2[u] = d;
  }
  ans = max(ans, d1[u] + d2[u]);              // 经过 u 的最长路
}

```

### 6. 状压 DP
#### 6.1 枚举子集 与 子集和（SOS）

```cpp

// 枚举 s 的所有非空子集, 总复杂度 O(3^n)
for (int s = 1; s < (1 << n); s++)
  for (int t = s; t; t = (t - 1) & s) { /* 处理子集 t */ }

// 子集和 DP (SOS): f[s] = sum_{t 是 s 的子集} a[t]. O(n 2^n)
for (int i = 0; i < n; i++)
  for (int s = 0; s < (1 << n); s++)
    if (s >> i & 1) f[s] += f[s ^ (1 << i)];

```

#### 6.2 TSP（哈密顿回路）

```cpp

// f[S][i] = 走过集合 S 且当前在 i 的最小代价. O(2^n * n^2), n <= 18
long long d[N][N], f[1 << 18][18];       // 距离矩阵与 DP 表
memset(f, 0x3f, sizeof f); f[1][0] = 0;
for (int S = 1; S < (1 << n); S++)
  for (int i = 0; i < n; i++) {
    if (f[S][i] >= INF) continue;
    for (int j = 0; j < n; j++) {
      if (S >> j & 1) continue;
      f[S | 1 << j][j] = min(f[S | 1 << j][j], f[S][i] + d[i][j]);
    }
  }
long long ans = INF;
for (int i = 0; i < n; i++) ans = min(ans, f[(1 << n) - 1][i] + d[i][0]);

```

#### 6.3 棋盘覆盖（逐行状压）
先 dfs 预处理**行内合法状态**（互不侵犯要求行内 1 不相邻），再逐行用位运算判两行兼容。

```cpp

// 互不侵犯: n*n 棋盘放 k 个国王 (八连通不互邻). O(n * cnt^2 * k)
void gen(int x, int num, int cur) {           // 预处理一行内的合法状态
  if (cur >= n) { sit[++cnt] = x; sta[cnt] = num; return; }
  gen(x, num, cur + 1);                       // 不放
  gen(x + (1 << cur), num + 1, cur + 2);      // 放, 隔一格
}
bool ok(int a, int b) {                       // 相邻两行是否兼容
  return !(sit[a] & sit[b]) && !((sit[a] << 1) & sit[b]) && !(sit[a] & (sit[b] << 1));
}
for (int j = 1; j <= cnt; j++) f[1][j][sta[j]] = 1;
for (int i = 2; i <= n; i++)
  for (int a = 1; a <= cnt; a++)
    for (int b = 1; b <= cnt; b++) {
      if (!ok(a, b)) continue;
      for (int l = sta[a]; l <= k; l++) f[i][a][l] += f[i-1][b][l - sta[a]];
    }

```

#### 6.4 轮廓线 DP（插头 DP 入门）
逐格转移，轮廓线宽度 m：s 的第 j 位 = 1 表示该位置已被覆盖（上方竖放下来或左侧横放过来）。

```cpp

// 轮廓线 DP: n*m 棋盘用 1*2 骨牌铺满的方案数. O(n*m*2^m)
long long f[2][1 << 12], *f0 = f[0], *f1 = f[1];
fill(f1, f1 + (1 << m), 0); f1[0] = 1;
for (int i = 0; i < n; i++)
  for (int j = 0; j < m; j++) {
    swap(f0, f1); fill(f1, f1 + (1 << m), 0);
    for (int s = 0; s < (1 << m); s++) {
      long long u = f0[s]; if (!u) continue;
      if (s >> j & 1) f1[s ^ 1 << j] += u;                          // 已被覆盖, 不放
      else {
        if (j != m - 1 && !(s >> j & 3)) f1[s ^ 1 << (j + 1)] += u; // 横放
        f1[s ^ 1 << j] += u;                                        // 竖放
      }
    }
  }
// 答案: f1[0]

```

> ⚠️ 真正的插头 DP（回路计数、哈密顿路径）还要在轮廓线上编码**连通性**（最小表示法 / 括号表示），状态数远大于 2^m，通常配哈希表转移；CSP 里出现概率低，先掌握上面这个 2^m 轮廓线模型。

### 7. 数位 DP
记忆化递归框架 dfs(pos, state, lim, lead)。只有 !lim && !lead 的状态才能记忆化，否则会把「贴着上界」的答案污染到通用状态里。

```cpp

// 数位 DP: 统计 [0, x] 中相邻两位数字之差 >= 2 的数的个数 (windy 数). O(位数 * 状态数 * 10)
long long f[12][10];                              // f[pos][pre], 仅用于 !lim && !lead
int a[12];
long long dfs(int pos, int pre, bool lim, bool lead) {
  if (pos == 0) return lead ? 0 : 1;              // 排除数字 0 本身
  if (!lim && !lead && f[pos][pre] != -1) return f[pos][pre];
  int up = lim ? a[pos] : 9;
  long long res = 0;
  for (int d = 0; d <= up; d++) {
    if (!lead && abs(d - pre) < 2) continue;      // 题目约束
    if (lead && d == 0) res += dfs(pos - 1, 0, lim && d == up, true);   // 仍在前导零
    else res += dfs(pos - 1, d, lim && d == up, false);
  }
  if (!lim && !lead) f[pos][pre] = res;
  return res;
}
long long calc(long long x) {                     // 统计 [0, x]; 答案 = calc(r) - calc(l - 1)
  if (x < 0) return 0;
  int len = 0;
  while (x) a[++len] = x % 10, x /= 10;           // 低位在 a[1]
  memset(f, -1, sizeof f);
  return dfs(len, 0, true, true);
}

```

> ⚠️ 三个易错点：① lim 为真时不能记忆化；② 前导零必须单独用 lead 传递，否则 000123 会被当成 3 位数；③ 记忆化数组必须整体清成 -1，多组询问每组重清。

### 8. 计数 DP 与期望 DP
#### 8.1 计数 DP
核心是**想清楚每个方案被数的次数**，避免重复计数（按最后一个元素 / 第一次出现的位置分类）。

```cpp

// 整数划分: 把 n 拆成若干正整数之和(无序) 的方案数 = 完全背包计数. O(n^2)
dp[0] = 1;
for (int i = 1; i <= n; i++)                  // 枚举可用的数 i
  for (int j = i; j <= n; j++) dp[j] += dp[j - i];   // 正序 = 完全背包
// 卡特兰数: C[i] = sum_{j=1..i} C[j-1] * C[i-j], C[0] = 1

```

#### 8.2 概率正推 / 期望逆推
**概率正推**（从起点推概率），**期望逆推**（从终点推期望）。带环的期望要列方程高斯消元，DAG 上直接逆序递推。

```cpp

// 概率 DP 正推: p[i] = 到达 i 的概率. O(n + m)
p[0] = 1;
for (int i = 0; i < n; i++)
  for (auto &pr : g[i]) p[pr.to] += p[i] * pr.prob;    // g 须按 DP 序使用

// 期望 DP 逆推: E[u] = sum_{u->v} (w(u,v) + E[v]) / outdeg(u)
double E[N]; bool vis[N];
void dfs(int u) {
  if (vis[u]) return; vis[u] = true;
  if (g[u].empty()) { E[u] = 0; return; }
  E[u] = 0;
  for (auto &e : g[u]) { dfs(e.to); E[u] += e.w + E[e.to]; }
  E[u] /= g[u].size();
}

```

> ⚠️ 期望线性性只管**和**，不管积；E[XY] = E[X]E[Y] 只在独立时成立。求「期望的平方」「期望的倒数」等非线性量时，必须把相应信息加进状态。

### 9. DP 优化
#### 9.1 前缀和优化
转移是连续区间求和/最值时，用前缀和把一维 O(n) 降到 O(1)。

```cpp

// f[i] = sum_{j=i-k}^{i-1} f[j]. O(n)
s[0] = 1;
for (int i = 1; i <= n; i++) {
  f[i] = s[i-1] - (i - k - 1 >= 0 ? s[i-k-1] : 0);
  s[i] = s[i-1] + f[i];
}
// 二维前缀和: sum(x1..x2,y1..y2) = s[x2][y2]-s[x1-1][y2]-s[x2][y1-1]+s[x1-1][y1-1]

```

#### 9.2 单调队列优化
转移形如 f[i] = min_{j in [i-k, i-1]} (g[j]) + w[i] 时，用单调队列维护窗口最值。

```cpp

// 滑动窗口最小值 + 单调队列转移. O(n)
int L = 0, R = -1;
for (int i = 1; i <= n; i++) {
  while (L <= R && q[L] < i - k) L++;                 // 出窗口
  while (L <= R && val[q[R]] >= val[i]) R--;          // 维护单调
  q[++R] = i;
  f[i] = val[q[L]] + w[i];
}

```

#### 9.3 斜率优化
把 f[i] = min_j (a[i]*x[j] + y[j]) + b[i] 看成用斜率 a[i] 的直线去切点集 (x[j], y[j]) 的凸包。**斜率与横坐标都单调**用单调队列；**只有斜率单调**时在凸包上二分；都不单调用 CDQ 分治或李超线段树。

```cpp

// 斜率优化 · 单调队列版: 维护下凸壳; dp[i] = min_{j<i} { dp[j] + (s[i]-s[j])^2 }, s 单调递增. O(n)
inline long long X(int j) { return s[j]; }
inline long long Y(int j) { return dp[j] + s[j] * s[j]; }
inline bool bad(int a, int b, int c) {        // b 不在下凸壳上
  return (__int128)(Y(b) - Y(a)) * (X(c) - X(b))
       >= (__int128)(Y(c) - Y(b)) * (X(b) - X(a));
}
int q[N], l = 1, r = 0;
void solve() {
  q[++r] = 0;                                 // 决策点 0: dp[0] = s[0] = 0
  for (int i = 1; i <= n; i++) {
    long long k = 2 * s[i];
    while (l < r && Y(q[l+1]) - Y(q[l]) <= k * (X(q[l+1]) - X(q[l]))) l++;
    dp[i] = Y(q[l]) - k * X(q[l]) + s[i] * s[i];
    while (l < r && bad(q[r-1], q[r], i)) r--;        // 弹掉被盖住的决策
    q[++r] = i;
  }
}
// 斜率不单调时改用凸壳二分: 找到第一个使 Y(q[mid+1])-k*X(q[mid+1]) 不劣于 q[mid] 的位置
int query(long long k) {
  int lo = l, hi = r;
  while (lo < hi) {
    int mid = (lo + hi) >> 1;
    if (Y(q[mid+1]) - Y(q[mid]) <= k * (X(q[mid+1]) - X(q[mid]))) lo = mid + 1;
    else hi = mid;
  }
  return q[lo];
}

```

> ⚠️ 一律用 __int128 或交叉相乘判斜率，用 double 比较叉积在坐标大时会 WA。下凸壳求 min、上凸壳求 max；弹队首的等号取法决定取最左还是最右最优解，多解时按题意选。
#### 9.4 决策单调性（分治 / 四边形不等式）
若 opt(i) 单调不减，可用分治在 O(n log n) 内求出所有 dp 值（w 需能 O(1) 或均摊 O(1) 计算）。

```cpp

// 分治优化: dp[i] = min_{j<=i} w(j, i) 且最优决策 opt(i) 单调不减. O(n log n)
void solve(int l, int r, int ol, int orr) {
  if (l > r) return;
  int mid = (l + r) >> 1, pos = ol;
  for (int j = ol; j <= min(mid, orr); j++)
    if (w(j, mid) < dp[mid]) { dp[mid] = w(j, mid); pos = j; }
  solve(l, mid - 1, ol, pos);
  solve(mid + 1, r, pos, orr);                // 调用: solve(1, n, 1, n)
}

```

#### 9.5 bitset 优化
把布尔/计数 DP 打包成位运算，常数除 64。适合可达性、方案存在性、多重背包可行性。

```cpp

// 01 背包可行性: f 第 j 位 = 容量 j 可达. O(n * W / 64)
bitset<MAXW> f; f[0] = 1;
for (int i = 1; i <= n; i++) f |= f << w[i];

// 多重背包可行性 (每件 c0[i] 个): 二进制拆分 + bitset (独立示例)
bitset<MAXW> g; g[0] = 1;
for (int i = 1; i <= n; i++) {
  int c = c0[i];
  for (int k = 1; k <= c; k <<= 1) { c -= k; g |= g << (k * w[i]); }
  if (c) g |= g << (c * w[i]);
}

```

> ⚠️ bitset 的位数必须是编译期常量，且移位溢出的高位直接丢弃（不报错），容量上界要开够：MAXW >= W + max(w)。计数问题不能用 bitset 直接加，除非把每一位拆成独立的多位域。

### 10. 常见坑

| 坑 | 症状 | 修法 |
| --- | --- | --- |
| 初始化错 | 恰好装满当成至多，答案偏大 | max 用 -INF、min 用 INF，只把 f[0] 置 0 |
| 转移顺序错 | 01 背包写成正序，物品被重复选 | 01 逆序、完全正序、分组容量在外 |
| 循环边界 | 区间 DP 越界访问 f[i+1][j-1] | 先枚举 len，len=1/2 手动初始化 |
| 记忆化污染 | 数位 DP 把贴上限的答案记进 f | 只在 !lim && !lead 时写 f |
| 溢出 | 方案数/距离/乘法爆 int | 计数、答案、中间量统一 long long，叉积用 __int128 |
| 复杂度误判 | O(n^3)/O(2^n n) 直接 TLE | n<=500 容 O(n^3)，n<=20 容 O(2^n n)，n<=1e6 只容 O(n) |
| 滚动数组 | 覆盖了本轮还要用的旧值 | 明确「本层/上层」，必要时开 2 个数组 swap |
| 多组数据 | 数组没清空，第二组答案错 | memset 或重新初始化，注意 f 的 -1 标记 |

> ⚠️ CSP 上机 4 小时 5 题，DP 题的性价比取决于复杂度是否压得住：n=1e5 配 O(n sqrt n) 会挂，n=2000 配 O(n^2) 才稳，先写暴力对拍再上优化。空间上 int f[5000][5000] 已经 100MB、逼近 256MB 限制，二维 DP 优先滚动数组，树上背包与区间 DP 按 n 的实际范围开数组。


## 第 04 章 数据结构与字符串

> 多组数据时记得清空 ls/rs/rev/ch 等数组。代码默认以 `#include <bits/stdc++.h>` + `using namespace std;` 开头（CSP 允许），不再重复；下标无说明从 1 开始。同一小节内代码块共用数组名，实际使用时按需保留一种。
### A. 数据结构
#### 1. 并查集

```cpp

// 1.1 路径压缩 + 按大小合并, 总 O(n alpha(n))
int fa[N],sz[N];
void init(int n){for(int i=1;i<=n;i++)fa[i]=i,sz[i]=1;}
int find(int x){return fa[x]==x?x:fa[x]=find(fa[x]);}
bool unite(int x,int y){x=find(x),y=find(y);if(x==y)return 0;if(sz[x]<sz[y])swap(x,y);fa[y]=x,sz[x]+=sz[y];return 1;}
// 1.2 带权并查集: dis[x]=val[x]-val[fa[x]] (模 M), O(alpha(n)); qfind 替换上面的 find
int dis[N];
void init2(int n){init(n);for(int i=1;i<=n;i++)dis[i]=0;}   // 带权版本必须额外清空 dis
int qfind(int x){if(fa[x]==x)return x; int y=qfind(fa[x]);   // fa[x] 此刻仍是旧父亲, 其 dis 已指向根
  return dis[x]=(dis[x]+dis[fa[x]])%M,fa[x]=y;}
int query(int x,int y){qfind(x),qfind(y);return fa[x]!=fa[y]?-1:(dis[y]-dis[x]+M)%M;}
bool qunite(int x,int y,int d){                 // 断言 val[y]-val[x]=d, 返回是否相容
  qfind(x),qfind(y); d=(d+M-dis[y])%M,d=(d+dis[x])%M; x=fa[x],y=fa[y];
  if(x==y)return d==0; if(sz[x]<sz[y])swap(x,y),d=(M-d)%M;
  return fa[y]=x,sz[x]+=sz[y],dis[y]=d,1;}
// 1.3 种类并查集(拆点): x 自身 | x+n 猎物 | x+2n 天敌; k 个种类开 k 倍点
int cf[3*N];
int cfind(int x){return cf[x]==x?x:cf[x]=cfind(cf[x]);}
void cmerge(int x,int y){x=cfind(x),y=cfind(y);if(x!=y)cf[x]=y;}
// 同类 cmerge(x,y),cmerge(x+n,y+n),cmerge(x+2n,y+2n);  x 吃 y cmerge(x,y+2n),cmerge(x+n,y),cmerge(x+2n,y+n)
// 冲突: 同类 cfind(x)==cfind(y+n)||cfind(x+n)==cfind(y);  x 吃 y cfind(x)==cfind(y)||cfind(x)==cfind(y+n)
// 与"权值模 3 的带权并查集"等价
// 1.4 可撤销并查集: 只按大小合并 + 栈记录, 单次 O(log n)
int rfa[N],rsz[N],top; struct Op{int x,y,sy;} st[N*20];
int rfind(int x){while(rfa[x]!=x)x=rfa[x];return x;}   // 绝不能路径压缩!
bool runite(int x,int y){
  x=rfind(x),y=rfind(y);
  if(x==y){st[++top]={0,0,0};return 0;}           // 占位, 使回滚步数对齐
  if(rsz[x]<rsz[y])swap(x,y); st[++top]={x,y,rsz[y]};
  rfa[y]=x,rsz[x]+=rsz[y]; return 1;}
void undo(){Op o=st[top--];if(o.x)rfa[o.y]=o.y,rsz[o.x]-=o.sy;}
// 用法: int save=top; ...操作...; while(top>save)undo();

```

> ⚠️ 递归 find 深链可能爆栈，可改迭代；可撤销并查集**绝不能路径压缩**（否则无法还原），退化到 O(log n) 但仍正确，常用于线段树分治 / 回滚莫队。
#### 2. 树状数组

```cpp

// 2.1 单点改+区间查 / 2.2 区间改(差分)+单点查, 均 O(log n)
long long t[N]; int n;
void add(int i,long long v){for(;i<=n;i+=i&-i)t[i]+=v;}
long long pre(int i){long long s=0;for(;i>0;i-=i&-i)s+=t[i];return s;}
long long qry(int l,int r){return pre(r)-pre(l-1);}          // 2.1
void upd(int l,int r,long long v){add(l,v),add(r+1,-v);}     // 2.2
// 2.3 区间改 + 区间查(两个 BIT 维护 d[i] 与 d[i]*i), O(log n)
// 公式 sum_{i<=r} a[i] = (r+1)*sum d[i] - sum d[i]*i
long long t1[N],t2[N];
void tadd(int k,long long v){long long v1=1LL*k*v;   // 必须先用原下标算; 循环里 k 已变成树上下标
  for(;k<=n;k+=k&-k)t1[k]+=v,t2[k]+=v1;}
long long tpre(long long*t,int k){long long s=0;for(;k>0;k-=k&-k)s+=t[k];return s;}
void tupd(int l,int r,long long v){tadd(l,v),tadd(r+1,-v);}
long long preSum(int k){return 1LL*(k+1)*tpre(t1,k)-tpre(t2,k);}
long long qry2(int l,int r){return preSum(r)-preSum(l-1);}
// 2.4 求逆序对(权值 BIT) + 2.5 树状数组上二分求全局第 k 小
int a[N],b[N];
long long inv(int n){
  for(int i=1;i<=n;i++)b[i]=a[i]; sort(b+1,b+n+1);
  int m=unique(b+1,b+n+1)-b-1; long long ans=0;
  for(int i=1;i<=n;i++){int p=lower_bound(b+1,b+m+1,a[i])-b; ans+=(i-1)-pre(p); add(p,1);}
  return ans;}                                       // 前面严格大于 a[i] 的个数
int kth(int k){                                      // 权值 BIT 上二分; 越界返回 n+1
  int x=0,i=1<<(31-__builtin_clz(n)); long long s=0;
  for(;i;i>>=1) if(x+i<=n&&s+t[x+i]<k)x+=i,s+=t[x];
  return x+1;}

```

> ⚠️ `__builtin_clz(0)` 未定义，n 是 2 的幂时循环上界直接取 n；求第 k 大先转成第 (总数-k+1) 小。区间改区间查的 `t2` 必须用**原下标**乘 v。
#### 3. 线段树

```cpp

// 3.1 区间加 + 区间和(懒标记), O(log n) 每次, 空间 4n; build: 叶子置 a[l] 后 pushup
long long d[4*N],b[4*N];
void applyNode(int p,int len,long long v){d[p]+=v*len,b[p]+=v;}
void pushdown(int p,int l,int r){
  if(!b[p]||l==r)return; int m=(l+r)>>1;
  applyNode(p<<1,m-l+1,b[p]),applyNode(p<<1|1,r-m,b[p]),b[p]=0;}
void upd(int L,int R,long long v,int p=1,int l=1,int r=0){
  if(!r)r=n; if(L<=l&&r<=R){applyNode(p,r-l+1,v);return;}
  pushdown(p,l,r); int m=(l+r)>>1;
  if(L<=m)upd(L,R,v,p<<1,l,m); if(R>m)upd(L,R,v,p<<1|1,m+1,r);
  d[p]=d[p<<1]+d[p<<1|1];}
long long qry(int L,int R,int p=1,int l=1,int r=0){
  if(!r)r=n; if(L<=l&&r<=R)return d[p];
  pushdown(p,l,r); int m=(l+r)>>1; long long s=0;
  if(L<=m)s+=qry(L,R,p<<1,l,m); if(R>m)s+=qry(L,R,p<<1|1,m+1,r);
  return s;}
// 3.2 区间赋值 + 区间加 + 区间和 + 区间最值(双标记), O(log n); 查询用 qry3(...,isMax)
long long sum[4*N],mx[4*N],add[4*N],setv[4*N]; bool has[4*N];
void applySet(int p,int len,long long v){sum[p]=v*len,mx[p]=v,setv[p]=v,has[p]=1,add[p]=0;}
void applyAdd(int p,int len,long long v){sum[p]+=v*len,mx[p]+=v; if(has[p])setv[p]+=v; else add[p]+=v;}
void pushdown2(int p,int l,int r){                 // 先赋值后加法
  if(l==r)return; int m=(l+r)>>1;
  if(has[p])applySet(p<<1,m-l+1,setv[p]),applySet(p<<1|1,r-m,setv[p]),has[p]=0;
  if(add[p])applyAdd(p<<1,m-l+1,add[p]),applyAdd(p<<1|1,r-m,add[p]),add[p]=0;}
void upd2(int L,int R,long long v,int op,int p=1,int l=1,int r=0){  // op=1 赋值, op=0 加
  if(!r)r=n; if(L<=l&&r<=R){op?applySet(p,r-l+1,v):applyAdd(p,r-l+1,v);return;}
  pushdown2(p,l,r); int m=(l+r)>>1;
  if(L<=m)upd2(L,R,v,op,p<<1,l,m); if(R>m)upd2(L,R,v,op,p<<1|1,m+1,r);
  sum[p]=sum[p<<1]+sum[p<<1|1],mx[p]=max(mx[p<<1],mx[p<<1|1]);}
long long qry3(int L,int R,int p=1,int l=1,int r=0,bool isMax=0){   // 区间和; isMax=1 求最值
  if(!r)r=n; if(L<=l&&r<=R)return isMax?mx[p]:sum[p];
  pushdown2(p,l,r); int m=(l+r)>>1;
  if(R<=m)return qry3(L,R,p<<1,l,m,isMax); if(L>m)return qry3(L,R,p<<1|1,m+1,r,isMax);
  return isMax?max(qry3(L,R,p<<1,l,m,1),qry3(L,R,p<<1|1,m+1,r,1))
              :qry3(L,R,p<<1,l,m)+qry3(L,R,p<<1|1,m+1,r);}
// 3.3 动态开点 + 权值线段树(第 k 小 / 排名), 单点改 O(log V)
int ls[N*(LOG+2)],rs[N*(LOG+2)],cnt,rt; long long sval[N*(LOG+2)];
void dupd(int&p,int l,int r,int x,long long v){
  if(!p)p=++cnt,ls[p]=rs[p]=0,sval[p]=0; if(l==r){sval[p]+=v;return;} int m=(l+r)>>1;
  x<=m?dupd(ls[p],l,m,x,v):dupd(rs[p],m+1,r,x,v);
  sval[p]=sval[ls[p]]+sval[rs[p]];}
int kth(int p,int l,int r,int k){                   // 区间内第 k 小, 返回下标
  if(l==r)return l; int m=(l+r)>>1;
  return sval[ls[p]]>=k?kth(ls[p],l,m,k):kth(rs[p],m+1,r,k-sval[ls[p]]);}
int rnk(int p,int l,int r,int x){                   // <= x 的个数
  if(!p||r<=x)return sval[p]; int m=(l+r)>>1;
  return x<=m?rnk(ls[p],l,m,x):sval[ls[p]]+rnk(rs[p],m+1,r,x);}
// 3.4 线段树合并: 均摊 O(总点数), 整棵树合并 O(n log n)
int merge(int a,int b,int l,int r){
  if(!a||!b)return a|b; if(l==r){sval[a]+=sval[b];return a;} int m=(l+r)>>1;
  ls[a]=merge(ls[a],ls[b],l,m),rs[a]=merge(rs[a],rs[b],m+1,r);
  return sval[a]=sval[ls[a]]+sval[rs[a]],a;}
// 3.5 扫描线求矩形面积并: O(n log n)
int n2,xs[2*N],tot; long long cov[8*N],len[8*N];   // 覆盖次数 / 被覆盖长度, 标记永不下传
struct Edge{int x1,x2,y,o;} e[2*N];
void pushupSeg(int p,int l,int r){
  if(cov[p])len[p]=xs[r]-xs[l]; else len[p]=(l+1==r)?0:len[p<<1]+len[p<<1|1];}
void supd(int L,int R,int o,int p=1,int l=1,int r=0){
  if(!r)r=tot; if(L<=l&&r<=R){cov[p]+=o,pushupSeg(p,l,r);return;}
  int m=(l+r)>>1;
  if(L<m)supd(L,R,o,p<<1,l,m); if(R>m)supd(L,R,o,p<<1|1,m,r);
  pushupSeg(p,l,r);}
long long solve(){                                 // 读入 n2 个矩形 x1,y1,x2,y2 后调用
  sort(xs+1,xs+2*n2+1); tot=unique(xs+1,xs+2*n2+1)-xs-1;
  sort(e+1,e+2*n2+1,[](const Edge&a,const Edge&b){return a.y<b.y;});
  long long ans=0;
  for(int i=1;i<2*n2;i++){supd(e[i].x1,e[i].x2,e[i].o); ans+=1LL*(e[i+1].y-e[i].y)*len[1];}
  return ans;}
// 3.6 李超线段树(直线版, 简述): 每点存中点最优直线, 插入时与节点直线比较, 输的那条只往一侧递归
// (两直线最多一个交点), 故插入直线 O(log V)、查询 O(log V); 插入线段需拆成 O(log V) 个整区间
double K[N],B[N]; int id[N];
double f(int i,double x){return K[i]*x+B[i];}
void ins(int i,int p,int l,int r){
  if(!id[p]){id[p]=i;return;} int m=(l+r)>>1;
  if(f(i,m)>f(id[p],m))swap(i,id[p]);
  if(l==r)return;
  if(f(i,l)>f(id[p],l))ins(i,p<<1,l,m); else if(f(i,r)>f(id[p],r))ins(i,p<<1|1,m+1,r);}
double lqry(int x,int p,int l,int r){
  double res=id[p]?f(id[p],x):-1e18; if(l==r)return res; int m=(l+r)>>1;
  return x<=m?max(res,lqry(x,p<<1,l,m)):max(res,lqry(x,p<<1|1,m+1,r));}

```

> ⚠️ 双标记下传顺序**先赋值后加法**，`applyAdd` 遇到已有赋值标记要并进 setv 而不能新开 add；扫描线线段树不是满二叉树，**空间开 8n**。
#### 4. 可持久化线段树（主席树）——静态区间第 k 小

```cpp

// O(n log n) 建树, O(log n) 询问, 空间约 n*log2(值域)（n=1e5 开 N<<5）
int n,m,a[N],ind[N],len_;   // ind 为离散化数组
int tot,sum[N<<5],ls[N<<5],rs[N<<5],root[N];
int getid(int v){return lower_bound(ind+1,ind+len_+1,v)-ind;}
int build(int l,int r){int p=++tot; if(l==r)return p; int mid=(l+r)>>1;
  return ls[p]=build(l,mid),rs[p]=build(mid+1,r),p;}
int update(int pre,int l,int r,int k){
  int p=++tot; ls[p]=ls[pre],rs[p]=rs[pre],sum[p]=sum[pre]+1;
  if(l==r)return p; int mid=(l+r)>>1;
  k<=mid?ls[p]=update(ls[pre],l,mid,k):rs[p]=update(rs[pre],mid+1,r,k);
  return p;}
int query(int u,int v,int l,int r,int k){          // (u,v] 中第 k 小, 返回离散化下标
  if(l==r)return l; int mid=(l+r)>>1,x=sum[ls[v]]-sum[ls[u]];
  return k<=x?query(ls[u],ls[v],l,mid,k):query(rs[u],rs[v],mid+1,r,k-x);}
void init(){
  for(int i=1;i<=n;i++)ind[i]=a[i];
  sort(ind+1,ind+n+1),len_=unique(ind+1,ind+n+1)-ind-1;
  root[0]=build(1,len_);
  for(int i=1;i<=n;i++)root[i]=update(root[i-1],1,len_,getid(a[i]));}
// 答案 = ind[query(root[l-1],root[r],1,len_,k)]

```

> ⚠️ 主席树节点数与"修改次数 * log 值域"同阶；带修改（可持久化 BIT 套权值树）要再放大。
#### 5. ST 表与稀疏表 LCA

```cpp

// 5.1 一维 ST 表: O(n log n) 预处理, O(1) 查询, 不支持修改
int a[N],lg[N],f[LOG+1][N];
void build(int n){
  lg[1]=0; for(int i=2;i<=n;i++)lg[i]=lg[i>>1]+1;
  for(int i=1;i<=n;i++)f[0][i]=a[i];
  for(int j=1;j<=LOG;j++)for(int i=1;i+(1<<j)-1<=n;i++)
    f[j][i]=max(f[j-1][i],f[j-1][i+(1<<(j-1))]);}
int qry(int l,int r){int s=lg[r-l+1];return max(f[s][l],f[s][r-(1<<s)+1]);}
// 5.2 二维 ST 表: O(nm log n log m) 预处理, O(1) 查询子矩阵最值(空间同阶, n,m 大时慎用)
const int NS=505; int nn,mm,g2[NS][NS],f2[LOG][LOG][NS][NS];   // NS 为行列上界, 空间 O(NS^2 log^2)
void build2(){
  for(int i=1;i<=nn;i++)for(int j=1;j<=mm;j++)f2[0][0][i][j]=g2[i][j];
  for(int k=0;k<LOG;k++)for(int l=0;l<LOG;l++){ if(!k&&!l)continue;
    for(int i=1;i+(1<<k)-1<=nn;i++)for(int j=1;j+(1<<l)-1<=mm;j++){
      int v=k?max(f2[k-1][l][i][j],f2[k-1][l][i+(1<<(k-1))][j])   // 只能从已算好的邻居取值
               :max(f2[k][l-1][i][j],f2[k][l-1][i][j+(1<<(l-1))]);
      if(k&&l)v=max(v,max(f2[k][l-1][i][j],f2[k][l-1][i][j+(1<<(l-1))]));
      f2[k][l][i][j]=v;}}}
int qry2(int x1,int y1,int x2,int y2){
  int kx=lg[x2-x1+1],ky=lg[y2-y1+1],dx=x2-(1<<kx)+1,dy=y2-(1<<ky)+1;
  return max(max(f2[kx][ky][x1][y1],f2[kx][ky][dx][y1]),max(f2[kx][ky][x1][dy],f2[kx][ky][dx][dy]));}
// 5.3 稀疏表求 LCA: 欧拉序 + ST, O(n log n) 预处理, O(1) 查询
vector<int> g[N];
int dep[N],fir[N],euler[2*N],tot,lg2[2*N],st[LOG][2*N];
void dfs(int u,int f){
  dep[u]=dep[f]+1,fir[u]=tot,euler[tot++]=u;
  for(int v:g[u])if(v!=f)dfs(v,u),euler[tot++]=u;}    // 欧拉序长度 2n-1
void build3(int root){
  tot=0,dfs(root,0);
  for(int i=0;i<tot;i++)st[0][i]=euler[i];
  for(int i=2;i<=tot;i++)lg2[i]=lg2[i>>1]+1;
  for(int j=1;(1<<j)<=tot;j++)for(int i=0;i+(1<<j)<=tot;i++){
    int x=st[j-1][i],y=st[j-1][i+(1<<(j-1))];
    st[j][i]=dep[x]<dep[y]?x:y;}}
int lca(int u,int v){
  int l=fir[u],r=fir[v]; if(l>r)swap(l,r);
  int k=lg2[r-l+1],x=st[k][l],y=st[k][r-(1<<k)+1];
  return dep[x]<dep[y]?x:y;}

```

#### 6. 单调栈与单调队列

```cpp

// 6.1 下一个更大元素 nxt[i]: 右侧第一个 > a[i] 的下标, O(n)
int stk[N],top=0,nxt[N];
void nextGreater(){for(int i=n;i>=1;i--){while(top&&a[stk[top]]<=a[i])top--; nxt[i]=top?stk[top]:n+1; stk[++top]=i;}}
// 6.2 柱状图最大子矩形, O(n)
long long maxRect(int n,int h[]){
  static int s2[N]; int tp=0; long long ans=0;
  for(int i=1;i<=n+1;i++){
    int cur=(i<=n?h[i]:0);
    while(tp&&h[s2[tp]]>=cur){int H=h[s2[tp]]; tp--; ans=max(ans,1LL*H*(i-(tp?s2[tp]+1:1)));}
    s2[++tp]=i;}
  return ans;}
// 6.3 单调队列: 滑动窗口最大值, O(n); 求最小值把 <= 改成 >=
int q[N],head=1,tail=0;
void slideWin(int k){
  for(int i=1;i<=n;i++){
    while(head<=tail&&a[q[tail]]<=a[i])tail--;
    q[++tail]=i;
    while(q[head]<=i-k)head++;                 // 弹出过期
    if(i>=k)printf("%d ",a[q[head]]);}}

```

#### 7. 堆、可并堆与对顶堆

```cpp

// 7.1 priority_queue: 每次操作 O(log n)
priority_queue<int> q1;                                              // 大根堆
priority_queue<int,vector<int>,greater<int>> q2;                     // 小根堆
struct Node{int d,u; bool operator<(const Node&o)const{return d>o.d;}};  // Dijkstra 用
// 7.2 左偏树(可并堆), 合并 O(log n); d[0] 必须初始化为 -1
int ls[N],rs[N],val[N],d[N],tot;
int merge(int x,int y){
  if(!x||!y)return x|y; if(val[x]>val[y])swap(x,y);   // 小根堆
  rs[x]=merge(rs[x],y);
  if(d[ls[x]]<d[rs[x]])swap(ls[x],rs[x]);             // 保持左偏
  return d[x]=d[rs[x]]+1,x;}
int push(int x,int v){val[++tot]=v,d[tot]=0;return merge(x,tot);}
int pop(int x){return merge(ls[x],rs[x]);}
// 7.3 对顶堆求中位数: 插入 O(log n), 取中位数 O(1)
priority_queue<int> L;                                   // 较小一半(大根堆)
priority_queue<int,vector<int>,greater<int>> R;          // 较大一半(小根堆)
void addm(int x){
  if(L.empty()||x<=L.top())L.push(x); else R.push(x);
  if(L.size()>R.size()+1)R.push(L.top()),L.pop();
  if(R.size()>L.size())L.push(R.top()),R.pop();}
double median(){return L.size()==R.size()?(L.top()+R.top())/2.0:L.top();}

```

> ⚠️ 叶子 dist 应为 0，故空节点 `d[0]` 必须是 **-1**，否则左偏性质与 log 复杂度全崩。
#### 8. 分块与莫队

```cpp

// 8.1 分块: 区间加 + 区间和, 每次 O(sqrt n)
int n,B,nb,bl[N],L[N],R[N]; long long a[N],sum[N],tag[N];
void build(){
  B=sqrt(n)+1,nb=(n+B-1)/B;
  for(int i=1;i<=n;i++)bl[i]=(i-1)/B+1,sum[bl[i]]+=a[i];
  for(int b=1;b<=nb;b++)L[b]=(b-1)*B+1,R[b]=min(n,b*B);}
void upd(int l,int r,long long v){
  if(bl[l]==bl[r]){for(int i=l;i<=r;i++)a[i]+=v,sum[bl[i]]+=v;return;}
  for(int i=l;i<=R[bl[l]];i++)a[i]+=v,sum[bl[i]]+=v;
  for(int i=L[bl[r]];i<=r;i++)a[i]+=v,sum[bl[i]]+=v;
  for(int b=bl[l]+1;b<bl[r];b++)tag[b]+=v,sum[b]+=v*(R[b]-L[b]+1);}
long long qry(int l,int r){
  long long s=0;
  if(bl[l]==bl[r]){for(int i=l;i<=r;i++)s+=a[i]+tag[bl[i]];return s;}
  for(int i=l;i<=R[bl[l]];i++)s+=a[i]+tag[bl[i]];
  for(int i=L[bl[r]];i<=r;i++)s+=a[i]+tag[bl[i]];
  for(int b=bl[l]+1;b<bl[r];b++)s+=sum[b];
  return s;}
// 8.2 普通莫队(含奇偶化排序), 块长 n/sqrt(m); 总 O(n sqrt m)
int unit,cur,ans[M],cnt[N];
struct Q{int l,r,id;} q[M];
bool operator<(const Q&x,const Q&y){
  int bx=x.l/unit,by=y.l/unit; if(bx!=by)return bx<by;
  return (bx&1)?x.r<y.r:x.r>y.r;}   // 奇偶化: 奇数块 r 升序, 偶数块 r 降序, 约快 30%
void solve(int m,int n){
  unit=max(1,(int)(n/sqrt(m))); sort(q+1,q+m+1);
  int l=1,r=0;
  for(int i=1;i<=m;i++){
    while(r<q[i].r)add(++r); while(r>q[i].r)del(r--);
    while(l>q[i].l)add(--l); while(l<q[i].l)del(l++);
    ans[q[i].id]=cur;}}
// 8.3 带修莫队, 块长 n^{2/3}, 总 O(n^{5/3})
struct QQ{int l,r,t,id;} qq[M];
struct C{int p; long long x;} c[M];                        // 第 i 次修改: 位置 p 改成 x
bool operator<(const QQ&x,const QQ&y){
  int bx=x.l/unit,by=y.l/unit; if(bx!=by)return bx<by;
  int rx=x.r/unit,ry=y.r/unit; if(rx!=ry)return (bx&1)?rx<ry:rx>ry;
  return (rx&1)?x.t>y.t:x.t<y.t;}
void solve2(int qcnt){
  unit=pow(qcnt,2.0/3.0),sort(qq+1,qq+qcnt+1);
  int l=1,r=0,t=0;
  for(int i=1;i<=qcnt;i++){
    while(r<qq[i].r)add(a[++r]); while(r>qq[i].r)del(a[r--]);
    while(l>qq[i].l)add(a[--l]); while(l<qq[i].l)del(a[l++]);
    while(t<qq[i].t){t++; int p=c[t].p; if(l<=p&&p<=r)del(a[p]),add(c[t].x); swap(a[p],c[t].x);}
    while(t>qq[i].t){int p=c[t].p; if(l<=p&&p<=r)del(a[p]),add(c[t].x); swap(a[p],c[t].x); t--;}
    ans[qq[i].id]=cur;}}

```

> ⚠️ 块长：普通莫队 `n/sqrt(m)`（m 为询问数），带修莫队 `n^{2/3}`；移动时间指针必须用 `swap` 才能双向撤销。
#### 9. 平衡树

```cpp

// 9.1 FHQ Treap: 各操作期望 O(log n)
int ls[N],rs[N],sz[N],val[N],pri[N],rev[N],tot;
int newNode(int v){val[++tot]=v,sz[tot]=1,pri[tot]=rand(),ls[tot]=rs[tot]=rev[tot]=0;return tot;}
void pushup(int p){sz[p]=sz[ls[p]]+sz[rs[p]]+1;}
void pushdown(int p){if(!rev[p])return; swap(ls[p],rs[p]),rev[ls[p]]^=1,rev[rs[p]]^=1,rev[p]=0;}
void split(int p,int k,int&x,int&y){              // 按大小: x 取前 k 个
  if(!p){x=y=0;return;} pushdown(p);
  if(sz[ls[p]]<k)x=p,split(rs[p],k-sz[ls[p]]-1,rs[p],y);
  else y=p,split(ls[p],k,x,ls[p]);
  pushup(p);}
void splitv(int p,int v,int&x,int&y){             // 按值: x 中 val<=v
  if(!p){x=y=0;return;}
  if(val[p]<=v)x=p,splitv(rs[p],v,rs[p],y); else y=p,splitv(ls[p],v,x,ls[p]);
  pushup(p);}
int merge(int x,int y){
  if(!x||!y)return x|y;
  if(pri[x]<pri[y]){pushdown(x),rs[x]=merge(rs[x],y),pushup(x);return x;}
  pushdown(y),ls[y]=merge(x,ls[y]),pushup(y);return y;}
int kth(int p,int k){                             // 第 k 小
  while(p){pushdown(p);
    if(sz[ls[p]]>=k)p=ls[p];
    else if(sz[ls[p]]+1==k)return val[p];
    else k-=sz[ls[p]]+1,p=rs[p];}
  return -1;}
// 插入 v:  splitv(root,v,x,y); root=merge(merge(x,newNode(v)),y);
// 前驱:     splitv(root,v-1,x,y); ans=kth(x,sz[x]); root=merge(x,y);
// 后继:     splitv(root,v,x,y);   ans=kth(y,1);     root=merge(x,y);
// 区间翻转: split(root,r,x,z); split(x,l-1,x,y); rev[y]^=1; root=merge(merge(x,y),z);

```

> ⚠️ 带区间翻转时 **split 与 kth 路上必须 pushdown**；纯权值平衡树（splitv）不需要翻转标记。
Splay（简述）：核心是 rotate + 双旋 `splay(x,goal)`，把访问节点提到根，均摊 O(log n)，适合 LCT 或"反复把某点提到根"的场景。`rotate(x)` 用 `get(x)=ch[fa[x]][1]==x` 分左右旋（x 转到父亲位置，x 的 k^1 儿子过继给 y）；`splay` 中先按 `get(x)==get(y)` 判断同侧（先旋 y）还是异侧（先旋 x），双旋后再 `rotate(x)`，最后 `if(!goal)root=x;`。CSP 做区间翻转用 FHQ Treap 更省事。
#### 10. 树链剖分（重链剖分 + 线段树）

```cpp

// 预处理 O(n), 单次路径操作 O(log^2 n), 子树操作 O(log n)
vector<int> g[N];
int fa[N],dep[N],siz[N],son[N],top[N],dfn[N],rnk[N],idx;
void dfs1(int u,int f){
  fa[u]=f,dep[u]=dep[f]+1,siz[u]=1,son[u]=0;
  for(int v:g[u]){ if(v==f)continue; dfs1(v,u),siz[u]+=siz[v]; if(siz[v]>siz[son[u]])son[u]=v; }}
void dfs2(int u,int ftop){                        // 必须先走重儿子, 保证子树是连续区间
  top[u]=ftop,dfn[u]=++idx,rnk[idx]=u;
  if(son[u])dfs2(son[u],ftop);
  for(int v:g[u])if(v!=son[u]&&v!=fa[u])dfs2(v,v);}
void pathUpd(int u,int v,long long x){            // 路径修改, 查询同理换成 qry
  while(top[u]!=top[v]){
    if(dep[top[u]]<dep[top[v]])swap(u,v);
    upd(dfn[top[u]],dfn[u],x);  u=fa[top[u]];}    // upd 为 3.1 的线段树
  if(dep[u]>dep[v])swap(u,v); upd(dfn[u],dfn[v],x);}
int lca(int u,int v){
  while(top[u]!=top[v])dep[top[u]]>dep[top[v]]?u=fa[top[u]]:v=fa[top[v]];
  return dep[u]<dep[v]?u:v;}
// 子树 u 在 dfn 上恰为 [dfn[u], dfn[u]+siz[u]-1]

```

> ⚠️ 剖分必须**先走重儿子**；跳链时比较的是 `dep[top[u]]` 而不是 `dep[u]`。
### B. 字符串
#### 11. 字符串哈希

```cpp

// 单模数自然溢出(mod 2^64): 预处理 O(n), 子串哈希 O(1); 回文判定需再维护反串哈希
typedef unsigned long long ull;
const ull B=131; ull h[N],pw[N];
void build(const char*s,int n){pw[0]=1;for(int i=1;i<=n;i++)pw[i]=pw[i-1]*B,h[i]=h[i-1]*B+s[i];}
ull sub(int l,int r){return h[r]-h[l-1]*pw[r-l+1];}
bool isPal(int l,int r){return sub(l,r)==rsub(n-r+1,n-l+1);}
// 双模数(更稳), 打包成一个 long long 比较
const int M1=1e9+7,M2=1e9+9,B1=131,B2=13331;
int h1[N],h2[N],p1[N],p2[N];
void build2(const char*s,int n){
  p1[0]=p2[0]=1;
  for(int i=1;i<=n;i++){
    p1[i]=1LL*p1[i-1]*B1%M1,h1[i]=(1LL*h1[i-1]*B1+s[i])%M1;
    p2[i]=1LL*p2[i-1]*B2%M2,h2[i]=(1LL*h2[i-1]*B2+s[i])%M2;}}
long long sub2(int l,int r){
  int a=(h1[r]-1LL*h1[l-1]*p1[r-l+1])%M1; if(a<0)a+=M1;
  int b=(h2[r]-1LL*h2[l-1]*p2[r-l+1])%M2; if(b<0)b+=M2;
  return 1LL*a*M2+b;}

```

> ⚠️ 自然溢出可被 Thue-Morse 串构造卡掉，防卡用双模数；字符不要映射成 0，否则 a 与 aa 等会撞。
#### 12. KMP 与 Z 函数

```cpp

// 12.1 前缀函数(fail 数组) + 匹配 + 最小循环节, O(n)
vector<int> prefix_function(const string&s){       // pi[i]: s[0..i] 的最长真前后缀
  int n=s.size(); vector<int> pi(n);
  for(int i=1;i<n;i++){
    int j=pi[i-1];
    while(j>0&&s[i]!=s[j])j=pi[j-1];
    if(s[i]==s[j])j++;
    pi[i]=j;}
  return pi;}
vector<int> kmp(const string&s,const string&t){    // 返回 t 在 s 中所有出现位置
  string u=t+(char)1+s;                            // 用不出现在串中的分隔符
  vector<int> pi=prefix_function(u),res;
  for(int i=t.size()+1;i<(int)u.size();i++)
    if(pi[i]==(int)t.size())res.push_back(i-2*t.size());
  return res;}
int period(const string&s){                        // 最小循环节: 整除则 n-pi[n-1], 否则 n
  int n=s.size(),p=n-prefix_function(s)[n-1];
  return n%p==0?p:n;}
// 12.2 扩展 KMP(Z 函数): z[i] = LCP(s, s[i:]), O(n)
vector<int> z_function(const string&s){
  int n=s.size(); vector<int> z(n);
  for(int i=1,l=0,r=0;i<n;i++){
    if(i<=r&&z[i-l]<r-i+1)z[i]=z[i-l];
    else{ z[i]=max(0,r-i+1); while(i+z[i]<n&&s[z[i]]==s[i+z[i]])z[i]++; }
    if(i+z[i]-1>r)l=i,r=i+z[i]-1;}
  return z;}
// s 的每个后缀与 t 的 LCP: 求 z_function(t+(char)1+s) 的后半段

```

#### 13. Trie 树与 01-Trie

```cpp

// 13.1 Trie: 单次 O(|s|), 空间 O(总字符数 * 26)
int ch[N][26],cnt[N],tot=1;
void insert(const char*s){
  int p=1;
  for(int i=0;s[i];i++){ int c=s[i]-'a'; if(!ch[p][c])ch[p][c]=++tot; p=ch[p][c]; }
  cnt[p]++;}
int query(const char*s){                           // 该串出现次数
  int p=1;
  for(int i=0;s[i];i++){ int c=s[i]-'a'; if(!ch[p][c])return 0; p=ch[p][c]; }
  return cnt[p];}
// 13.2 01-Trie 求最大异或对(值域 [0,2^30)), 单次 O(位数)
const int BITS=30;
int tr[N*(BITS+1)][2],tn=1;
void i01(int x){int p=1;for(int i=BITS;i>=0;i--){int c=(x>>i)&1;if(!tr[p][c])tr[p][c]=++tn;p=tr[p][c];}}
int q01(int x){                                    // 返回与 x 异或的最大值
  int p=1,res=0;
  for(int i=BITS;i>=0;i--){int c=(x>>i)&1;
    if(tr[p][c^1])res|=1<<i,p=tr[p][c^1]; else p=tr[p][c];}
  return res;}

```

> ⚠️ 01-Trie 位数要覆盖值域最高位（a[i] <= 1e9 用 30 位）；有负数先整体加偏移量转非负。
#### 14. AC 自动机

```cpp

// 建树 O(总长 * 26), 匹配 O(|s| + 节点数); 根节点编号为 1
int ch[N][26],fail[N],cnt[N],vis[N],deg[N],tot=1;
void ins(const char*s){
  int p=1;
  for(int i=0;s[i];i++){ int c=s[i]-'a'; if(!ch[p][c])ch[p][c]=++tot; p=ch[p][c]; }
  cnt[p]++;}                                       // 该模式串结尾计数
void build(){
  queue<int> q;
  for(int i=0;i<26;i++)
    if(ch[1][i])fail[ch[1][i]]=1,q.push(ch[1][i]); else ch[1][i]=1;
  while(!q.empty()){int u=q.front(); q.pop();
    for(int i=0;i<26;i++)
      if(ch[u][i])fail[ch[u][i]]=ch[fail[u]][i],q.push(ch[u][i]);
      else ch[u][i]=ch[fail[u]][i];}}              // 建成 Trie 图, 失配 O(1) 跳
void query(const char*s){                          // 统计各模式串出现次数(拓扑优化); 多次匹配前清空 vis/deg
  int p=1;
  for(int i=0;s[i];i++)p=ch[p][s[i]-'a'],vis[p]++;  // 只在文本路径上打标记, 与 ins 的 cnt 分开
  for(int i=1;i<=tot;i++)deg[fail[i]]++;
  queue<int> q;
  for(int i=1;i<=tot;i++)if(!deg[i])q.push(i);
  while(!q.empty()){int u=q.front(); q.pop(); int f=fail[u];   // fail 树拓扑序自底向上
    if(f){vis[f]+=vis[u]; if(--deg[f]==0)q.push(f);}}}
  // 模式串(结尾节点 u)的出现次数 = vis[u], cnt[u] 是"有多少个模式串以 u 结尾"

```

> ⚠️ 根编号必须是 1 且 `ch[1][i]` 失配指向自己，把 1 当空指针会死循环；多模式串统计必须**拓扑优化**（或 fail 树上 DFS），暴力跳 fail 会被卡成 O(|s| * 深度)。
#### 15. Manacher 最长回文子串

```cpp

// O(n)
int manacher(const string&s){
  string a="^#"; for(char c:s)a+=c,a+='#'; a+='$';   // 两端哨兵, 省边界判断
  int n=a.size(),mx=0,id=0,ans=0; vector<int> p(n);
  for(int i=1;i<n-1;i++){
    p[i]=(mx>i)?min(p[2*id-i],mx-i):1;
    while(a[i+p[i]]==a[i-p[i]])p[i]++;
    if(i+p[i]>mx)mx=i+p[i],id=i;
    ans=max(ans,p[i]-1);}                           // p[i]-1 即原串中的回文长度
  return ans;}

```

> ⚠️ 哨兵字符不能出现在原串中；插入的 '#' 也是哨兵，原串含 '#' 时换一个不冲突的字符。
#### 16. 后缀数组 SA 与最小表示法

```cpp

// 16.1 后缀数组(倍增 + 计数排序) 与 height: O(n log n); rk/oldrk 开 2n 防 sa[i]+w 越界
int n,sa[N],rk[N<<1],oldrk[N<<1],id[N],cnt[N],height[N]; char s[N];
void buildSA(){                                    // s[1..n]
  int m=127,p=0,i,w;
  for(i=1;i<=n;i++)cnt[rk[i]=(unsigned char)s[i]]++;
  for(i=1;i<=m;i++)cnt[i]+=cnt[i-1];
  for(i=n;i>=1;i--)sa[cnt[rk[i]]--]=i;
  memcpy(oldrk+1,rk+1,n*sizeof(int));
  for(p=0,i=1;i<=n;i++)rk[sa[i]]=(oldrk[sa[i]]==oldrk[sa[i-1]])?p:++p;
  for(w=1;w<n;w<<=1,m=n){
    memset(cnt,0,sizeof(cnt)); memcpy(id+1,sa+1,n*sizeof(int));
    for(i=1;i<=n;i++)cnt[rk[id[i]+w]]++;
    for(i=1;i<=m;i++)cnt[i]+=cnt[i-1];
    for(i=n;i>=1;i--)sa[cnt[rk[id[i]+w]]--]=id[i];
    memset(cnt,0,sizeof(cnt)); memcpy(id+1,sa+1,n*sizeof(int));
    for(i=1;i<=n;i++)cnt[rk[id[i]]]++;
    for(i=1;i<=m;i++)cnt[i]+=cnt[i-1];
    for(i=n;i>=1;i--)sa[cnt[rk[id[i]]]--]=id[i];
    memcpy(oldrk+1,rk+1,n*sizeof(int));
    for(p=0,i=1;i<=n;i++)
      rk[sa[i]]=(oldrk[sa[i]]==oldrk[sa[i-1]]&&oldrk[sa[i]+w]==oldrk[sa[i-1]+w])?p:++p;}}
void buildHeight(){                                // height[i] = LCP(sa[i], sa[i-1])
  for(int i=1,k=0;i<=n;i++){
    if(rk[i]==1){k=0;continue;} if(k)k--;
    int j=sa[rk[i]-1];
    while(i+k<=n&&j+k<=n&&s[i+k]==s[j+k])k++;
    height[rk[i]]=k;}}
// 16.2 最小表示法: O(n); 求最大表示把 a>b 与 a<b 的分支对调
int minRep(const string&s){
  int n=s.size(),i=0,j=1,k=0;
  while(k<n&&i<n&&j<n){
    char a=s[(i+k)%n],b=s[(j+k)%n];
    if(a==b)k++;
    else{ if(a>b)i=i+k+1; else j=j+k+1; if(i==j)i++; k=0; }}
  return min(i,j);}

```

应用速查：两后缀 LCP = height 在 rk 区间上的 RMQ 最小值（套 5.1 的 ST 表做到 O(1)）；本质不同子串数 = n(n+1)/2 - sum(height[2..n])；可重叠最长重复子串 = max(height)，不可重叠需二分答案 + 按 height 分组；比较两子串大小先比 LCP 与长度、再比 rk。


## 第 05 章 数学

> 除注明「独立」外，本章代码依赖下面的公共头（C++17）。`MOD` 按题目替换；`1e9+7` 与 `998244353` 的区别见 5.14。

```cpp

#include <bits/stdc++.h>
using namespace std;
using ll = long long; using ull = unsigned long long; using i128 = __int128_t;
const ll MOD = 1000000007;   // 1e9+7, 素数, 原根 5
const ll MOD2 = 998244353;   // 119*2^23+1, 素数, 原根 3, 可 NTT
const double EPS = 1e-9;

```

### 5.1 快速幂 / 快速乘 / 矩阵快速幂

```cpp

ll qpow(ll a, ll b, ll p = MOD) {          // O(log b), 要求 p*p < 9.2e18 (即 p < 3e9)
  ll r = 1 % p; a %= p;
  for (; b; b >>= 1) { if (b & 1) r = r * a % p; a = a * a % p; }
  return r;
}
ll mul(ll a, ll b, ll m) { return (ll)((i128)a * b % m); }   // O(1) 快速乘, GCC/Clang 首选
ll mul_ld(ll a, ll b, ll m) {              // 无 __int128 时的 O(1) 快速乘(实测精度见 5.14)
  ull c = (ull)a * (ull)b - (ull)((long double)a / m * b + 0.5L) * (ull)m;
  if (c < (ull)m) return (ll)c;
  if (c < (ull)m * 2) return (ll)(c - m);
  return (ll)(c + m);
}
ll qpow_big(ll a, ll b, ll p) {            // O(log b), 模数可到 1e18, 内部用快速乘
  ll r = 1 % p; a %= p;
  for (; b; b >>= 1) { if (b & 1) r = mul(r, a, p); a = mul(a, a, p); }
  return r;
}
ll qmul(ll a, ll b, ll p) {                // 龟速乘 O(log b), 常数大但绝不出错
  ll r = 0; a %= p; if (a < 0) a += p;
  for (; b; b >>= 1, a = (a + a) % p) if (b & 1) r = (r + a) % p;
  return r;
}

```

```cpp
const int SZ = 2;                          // 矩阵阶数, 按需改
struct Mat {
  ll a[SZ][SZ];
  Mat() { memset(a, 0, sizeof a); }
  static Mat I() { Mat r; for (int i = 0; i < SZ; i++) r.a[i][i] = 1; return r; }
  Mat operator*(const Mat &b) const {      // O(SZ^3), 先枚举 k 更快
    Mat r;
    for (int i = 0; i < SZ; i++) for (int k = 0; k < SZ; k++) {
      if (!a[i][k]) continue; ll t = a[i][k];
      for (int j = 0; j < SZ; j++) r.a[i][j] = (r.a[i][j] + t * b.a[k][j]) % MOD;
    }
    return r;
  }
};
Mat mpow(Mat A, ll k) {                    // O(SZ^3 log k)
  Mat r = Mat::I();
  for (; k; k >>= 1, A = A * A) if (k & 1) r = r * A;
  return r;
}
ll fib(ll n) {                             // O(log n): f(0)=0, f(1)=1
  if (n == 0) return 0;
  Mat T; T.a[0][0] = T.a[0][1] = T.a[1][0] = 1;   // [[1,1],[1,0]]
  return mpow(T, n - 1).a[0][0];                  // [f(n),f(n-1)] = T^(n-1) * [1,0]
}

```

构造套路（把线性递推写成 `[f(n+1), f(n)] = [f(n), f(n-1)] * T`）：

| 场景 | 转移矩阵 T | 说明 |
| --- | --- | --- |
| 斐波那契 f(n)=f(n-1)+f(n-2) | [[1,1],[1,0]] | 乘 T^(n-1) 作用在 [f(1),f(0)]=[1,0] |
| 带常数项 f(n)=a*f(n-1)+b | [[a,b],[0,1]] | 状态向量 [f(n), 1] |
| 同时含 f(n-1) 与 n | [[a,1,0],[0,1,1],[0,0,1]] | 状态向量 [f(n), n, 1] |
| 图中长度恰为 k 的路径数 | 邻接矩阵 A | (A^k)[i][j] = i 到 j 恰 k 步的方案数 |
| 路径数不超过 k 步 | A + I | 加单位阵表示「原地停留一步」 |
### 5.2 gcd / exgcd / 裴蜀 / 同余方程 / 逆元

```cpp

ll gcd(ll a, ll b) { return b ? gcd(b, a % b) : a; }     // O(log min(a,b))
ll lcm(ll a, ll b) { return a / gcd(a, b) * b; }         // 先除后乘防溢出
// 返回 d = gcd(a,b), 并解出 a*x + b*y = d（裴蜀定理: 这样的整数解总存在）
ll exgcd(ll a, ll b, ll &x, ll &y) {                     // O(log min(a,b))
  if (!b) { x = 1; y = 0; return a; }
  ll d = exgcd(b, a % b, y, x); y -= a / b * x; return d;
}
// 同余方程 a*x ≡ b (mod m): 有解 iff gcd(a,m) | b; 通解 x0 + k*(m/d)
bool cong(ll a, ll b, ll m, ll &x) {                     // O(log m)
  ll y, d = exgcd(a, m, x, y);
  if (b % d) return false;
  ll t = m / d;                                          // 先取模再乘, 防溢出
  x = (ll)((i128)(x % t + t) % t * ((b / d) % t) % t);
  return true;
}
ll inv_exgcd(ll a, ll m) { ll x, y; exgcd(a, m, x, y); return (x % m + m) % m; }  // O(log m), 任意 m
ll inv_fermat(ll a, ll p) { return qpow(a, p - 2, p); }                          // O(log p), 仅 p 为素数
vector<ll> invs(int n, ll p) {                           // O(n) 递推 1..n 的逆元, 仅 p 素数, n < p
  vector<ll> inv(n + 1); inv[1] = 1;
  for (int i = 2; i <= n; i++) inv[i] = (p - p / i) % p * inv[p % i] % p;
  return inv;
}
// 阶乘逆元: ifac[n] = inv(fac[n]), 再倒推 ifac[i-1] = ifac[i] * i

```

> ⚠️ `m` 为合数时不能用费马（`a^(m-2)` 是错的），只能 `exgcd`（需 `gcd(a,m)=1`）或欧拉定理 `a^(φ(m)-1)`。
### 5.3 素数：筛法 / Miller-Rabin / Pollard-Rho

```cpp

vector<int> pri;                           // 质数表
vector<bool> isp;                          // 埃氏筛标记
void sieve_erat(int n) {                   // 埃氏筛 O(n log log n)
  isp.assign(n + 1, true); isp[0] = isp[1] = false;
  for (int i = 2; (ll)i * i <= n; i++) if (isp[i])
    for (int j = i * i; j <= n; j += i) isp[j] = false;
  for (int i = 2; i <= n; i++) if (isp[i]) pri.push_back(i);
}
const int MAXN = 1e6 + 5;                  // 线性筛 O(n): 最小质因子 / 欧拉函数 / 莫比乌斯 / 约数个数
int lp[MAXN], phi[MAXN], mu[MAXN], d[MAXN], cnt[MAXN];
void sieve(int n) {
  phi[1] = mu[1] = d[1] = 1;
  for (int i = 2; i <= n; i++) {
    if (!lp[i]) { lp[i] = i; pri.push_back(i); phi[i] = i - 1; mu[i] = -1; d[i] = 2; cnt[i] = 1; }
    for (int j = 0; j < (int)pri.size() && (ll)i * pri[j] <= n; j++) {
      int p = pri[j], x = i * p; lp[x] = p;              // p 就是 x 的最小质因子
      if (i % p == 0) {                                  // p | i: 分解式中 p 的指数 +1
        phi[x] = phi[i] * p; mu[x] = 0; cnt[x] = cnt[i] + 1;
        d[x] = d[i] / (cnt[i] + 1) * (cnt[i] + 2);
        break;                                           // 每个合数只被最小质因子筛一次
      }
      phi[x] = phi[i] * (p - 1); mu[x] = -mu[i]; cnt[x] = 1; d[x] = d[i] * 2;
    }
  }
}
ll phi_one(ll n) {                         // 单点欧拉函数 O(sqrt n)
  ll ans = n;
  for (ll i = 2; i * i <= n; i++) if (n % i == 0) {
    ans = ans / i * (i - 1); while (n % i == 0) n /= i;
  }
  return n > 1 ? ans / n * (n - 1) : ans;
}

```

```cpp
const ll MR_BASE[7] = {2, 325, 9375, 28178, 450775, 9780504, 1795265022};  // 对 < 2^64 确定正确
bool isPrime(ll n) {                       // Miller-Rabin, O(log^3 n)
  if (n < 2) return false;
  for (ll p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) if (n % p == 0) return n == p;
  ll d = n - 1; int r = 0;
  while (!(d & 1)) d >>= 1, ++r;
  for (ll a : MR_BASE) {
    if (a % n == 0) continue;              // 基底是 n 的倍数时必须跳过, 否则 n = 73, 193 会误判
    ll x = qpow_big(a % n, d, n);
    if (x == 1 || x == n - 1) continue;
    bool ok = false;
    for (int i = 1; i < r; i++) { x = mul(x, x, n); if (x == n - 1) { ok = true; break; } }
    if (!ok) return false;
  }
  return true;
}
ll pollard_once(ll n, ll c) {              // 失败返回 0
  ll s = 0, t = 0, val = 1;
  for (ll goal = 1; goal <= (1LL << 20); goal <<= 1, s = t, val = 1) {
    for (ll step = 1; step <= goal; step++) {
      t = (mul(t, t, n) + c) % n;
      val = mul(val, abs(t - s), n);
      if (val == 0) return 0;              // 退化, 换 c 重试
      if (step % 127 == 0) { ll g = gcd(val, n); if (g > 1) return g == n ? 0 : g; }
    }
  }
  return 0;
}
ll pollard(ll n) {                         // 期望 O(n^{1/4})
  if (n % 2 == 0) return 2;
  for (ll c = 1;; c++) { ll dd = pollard_once(n, c); if (dd) return dd; }
}
void factor(ll n, vector<ll> &v) {         // 质因数分解(不去重)
  if (n == 1) return;
  if (isPrime(n)) { v.push_back(n); return; }
  ll dd = pollard(n); factor(dd, v); factor(n / dd, v);
}

```

> ⚠️ `c` 从 1 递增重试即可，不要用 `rand()` 取 `c`（撞上坏值会卡死）。分解结果记得排序去重。
### 5.4 约数与积性函数 / 莫比乌斯 / 整除分块

```cpp

pair<ll, ll> divs(ll n) {                  // 试除法: (约数个数, 约数和), O(sqrt n)
  ll cnt = 1, sum = 1;
  for (ll i = 2; i * i <= n; i++) if (n % i == 0) {
    ll pw = 1, s = 1, k = 0;
    while (n % i == 0) { n /= i; pw *= i; s += pw; k++; }
    cnt *= k + 1; sum *= s;
  }
  if (n > 1) { cnt *= 2; sum *= n + 1; }
  return {cnt, sum};
}
// 线性筛约数和: 记 sp[i]=p^a(最小质因子的最高幂), sg[i]=σ(p^a), rest[i]=σ(其余部分), σ(i)=sg*rest; i%p==0 时 sp[x]=sp[i]*p, sg[x]=sg[i]+sp[x], rest[x]=rest[i]; 否则 sp[x]=p, sg[x]=p+1, rest[x]=sig[i]
// 莫比乌斯反演:
//   1) [n==1] = Σ_{d|n} μ(d)
//   2) F(n)=Σ_{d|n} f(d)  <=>  f(n)=Σ_{d|n} μ(d) F(n/d)
//   3) Σ_{i<=n}Σ_{j<=m} [gcd(i,j)==1] = Σ_{d<=min(n,m)} μ(d) * (n/d) * (m/d)
//   狄利克雷卷积 (f*g)(n)=Σ_{d|n} f(d)g(n/d); ε=μ*1, id=φ*1, d=1*1, σ=id*1
ll divblock(ll n, ll m) {                  // 整除分块 Σ_{i=1}^{min(n,m)} (n/i)*(m/i), O(sqrt n)
  ll ans = 0;
  for (ll l = 1, r; l <= min(n, m); l = r + 1) {
    r = min(n / (n / l), m / (m / l));     // 单变量时 r = n / (n / l)
    ans += (r - l + 1) * (n / l) * (m / l);
  }
  return ans;
}

```

> ⚠️ `d[x] = d[i]/(cnt[i]+1)*(cnt[i]+2)` 依赖整除，必须按此顺序写。
> ⚠️ 整除分块的 `r = n/(n/l)` 在 `n/l == 0` 时除零；上界取 `min(n,m)` 可保证 `n/l >= 1`。
### 5.5 组合数学

```cpp

struct Comb {                              // O(n) 预处理, O(1) 查询; 要求 p 为素数且 n < p
  int n; ll p; vector<ll> fac, ifac;
  Comb(int n, ll p = MOD) : n(n), p(p), fac(n + 1), ifac(n + 1) {
    fac[0] = 1;
    for (int i = 1; i <= n; i++) fac[i] = fac[i - 1] * i % p;
    ifac[n] = qpow(fac[n], p - 2, p);
    for (int i = n; i >= 1; i--) ifac[i - 1] = ifac[i] * i % p;
  }
  ll C(ll a, ll b) const { return (b < 0 || b > a || a < 0) ? 0 : fac[a] * ifac[b] % p * ifac[a - b] % p; }
  ll A(ll a, ll b) const { return (b < 0 || b > a) ? 0 : fac[a] * ifac[a - b] % p; }
  ll Cat(ll k) const { return C(2 * k, k) * qpow(k + 1, p - 2, p) % p; }   // 卡特兰数
  ll D(ll k) const {                                                       // 错排, D(0)=1, D(1)=0
    if (k <= 1) return k == 0 ? 1 % p : 0;   // D(1) = 0
    ll a = 0, b = 1; for (int i = 3; i <= k; i++) { ll c = (i - 1) * ((a + b) % p) % p; a = b; b = c; }
    return b;
  }
};
ll C_small(ll n, ll m, ll p) {             // 0 <= n, m < p
  if (m < 0 || m > n) return 0;
  ll a = 1, b = 1; for (ll i = 1; i <= m; i++) { a = a * ((n - m + i) % p) % p; b = b * i % p; }
  return a * qpow(b, p - 2, p) % p;
}
ll lucas(ll n, ll m, ll p) {               // Lucas: C(n,m) mod p, p 素数, n,m 可到 1e18, O(p + log_p n)
  if (m < 0 || m > n) return 0;
  if (m == 0) return 1 % p;
  return C_small(n % p, m % p, p) * lucas(n / p, m / p, p) % p;
}
// 模数为合数 M: 分解 M=Πp_i^{a_i}, 对每个素数幂求 C(n,m) mod p^a（阶乘剥掉 p 的因子后用 exgcd 求逆）,
// 再用 CRT 合并 —— 即扩展 Lucas, 代码较长, 用到时按此思路现写。

```

| 计数对象 | 公式 | 备注 |
| --- | --- | --- |
| 组合数 | C(n,m) = n!/(m!(n-m)!) | 小 n 直接杨辉三角 O(n^2) |
| 卡特兰数 | Cat(n) = C(2n,n)/(n+1) = C(2n,n)-C(2n,n-1) | 括号序列、出栈序列、二叉树形态数 |
| 卡特兰递推 | Cat(n) = Σ Cat(i)Cat(n-1-i) = Cat(n-1)*(4n-2)/(n+1) | 除法用逆元 |
| 错排 | D(n) = (n-1)(D(n-1)+D(n-2)) | 也等于 n! * Σ_{k=0}^{n} (-1)^k / k! |
| 第二类斯特林数 | S(n,k) = S(n-1,k-1) + k*S(n-1,k) | n 个不同球放入 k 个相同非空盒 |
| 第一类斯特林数 | c(n,k) = c(n-1,k-1) + (n-1)*c(n-1,k) | n 个元素排成 k 个轮换 |
| 贝尔数 | B(n) = Σ_k S(n,k), B(n+1) = Σ_i C(n,i)B(i) | 集合划分数 |
| 隔板法 | xi>=1: C(n-1,k-1); xi>=0: C(n+k-1,k-1); xi>=li: C(n-Σli+k-1,k-1) | 先减下界 |
| 不相邻选取 | n 个中选 k 个互不相邻: C(n-k+1,k) | 插空法 |

```cpp

// 斯特林数 / 贝尔数打表 O(n^2)
ll S[1005][1005], C1[1005][1005], B[1005];
void init_stirling(int n) {
  S[0][0] = C1[0][0] = 1;
  for (int i = 1; i <= n; i++) for (int j = 1; j <= i; j++) {
    S[i][j] = (S[i - 1][j - 1] + j * S[i - 1][j]) % MOD;            // 第二类
    C1[i][j] = (C1[i - 1][j - 1] + (i - 1) * C1[i - 1][j]) % MOD;   // 第一类
  }
  B[0] = 1;
  for (int i = 1; i <= n; i++) for (int j = 1; j <= i; j++) B[i] = (B[i] + S[i][j]) % MOD;
}
// 第二类通项: S(n,k) = (1/k!) * Σ_{i=0}^{k} (-1)^i * C(k,i) * (k-i)^n
ll inclusion(vector<ll> a, ll n) {         // 容斥, 二进制枚举 O(2^k): 1..n 中被任一 a_i 整除的个数
  ll res = 0;                              // |∪A_i| = Σ_{S≠∅} (-1)^{|S|+1} |∩_{i∈S} A_i|
  for (int msk = 1; msk < (1 << a.size()); msk++) {
    ll L = 1; int bits = 0; bool ok = true;
    for (int i = 0; i < (int)a.size(); i++) if (msk >> i & 1) {
      bits++; L = L / gcd(L, a[i]) * a[i];
      if (L > n) { ok = false; break; }    // 剪枝: lcm > n 时贡献为 0
    }
    if (ok) res += (bits & 1 ? 1 : -1) * (n / L);
  }
  return res;
}
// 1..n 中与 m 互素的个数 = Σ_{d|m} μ(d) * (n/d)

```

### 5.6 高斯消元 / 矩阵求逆 / 行列式

```cpp

int gauss(vector<vector<double>> a, vector<double> &x) {   // a: n x (n+1) 增广矩阵; O(n^3)
  int n = a.size(), m = n; vector<int> where(m, -1); int row = 0;                                 // 返回 0 无解 / 1 唯一解 / 2 无穷多解
  for (int col = 0; col < m && row < n; col++) {
    int sel = row;
    for (int i = row; i < n; i++) if (fabs(a[i][col]) > fabs(a[sel][col])) sel = i;
    if (fabs(a[sel][col]) < EPS) continue;                 // 该列全 0, 出现自由元
    swap(a[sel], a[row]);
    for (int i = 0; i < n; i++) if (i != row) {
      double t = a[i][col] / a[row][col];
      if (fabs(t) < EPS) continue;
      for (int j = col; j <= m; j++) a[i][j] -= t * a[row][j];
    }
    where[col] = row++;
  }
  x.assign(m, 0);
  for (int i = 0; i < m; i++) if (where[i] != -1) x[i] = a[where[i]][m] / a[where[i]][i];
  for (int i = 0; i < n; i++) {                            // 回代校验, 抓 0 = 非零
    double s = 0;
    for (int j = 0; j < m; j++) s += a[i][j] * x[j];
    if (fabs(s - a[i][m]) > EPS) return 0;
  }
  for (int i = 0; i < m; i++) if (where[i] == -1) return 2;
  return 1;
}
bitset<1005> mat[2005];                    // 异或消元: mat[1..m] 为增广矩阵, 第 0 位存常数项
vector<bool> gauss_xor(int n, int m) {     // n 个未知数 m 个方程; 无解/多解返回空; O(n*m/64)
  for (int i = 1; i <= n; i++) {
    int cur = i;
    while (cur <= m && !mat[cur].test(i)) cur++;
    if (cur > m) return vector<bool>(0);
    if (cur != i) swap(mat[cur], mat[i]);
    for (int j = 1; j <= m; j++) if (i != j && mat[j].test(i)) mat[j] ^= mat[i];
  }
  vector<bool> ans(n + 1);
  for (int i = 1; i <= n; i++) ans[i] = mat[i].test(0);
  return ans;
}

```

```cpp
bool matInv(vector<vector<ll>> a, vector<vector<ll>> &inv, ll p) {   // 模素数 p 求逆, O(n^3 log p)
  int n = a.size();
  inv.assign(n, vector<ll>(n, 0));
  for (int i = 0; i < n; i++) inv[i][i] = 1;
  for (int i = 0; i < n; i++) {
    int piv = -1;
    for (int j = i; j < n; j++) if (a[j][i]) { piv = j; break; }
    if (piv == -1) return false;                             // 奇异矩阵
    swap(a[i], a[piv]); swap(inv[i], inv[piv]);
    ll t = qpow(a[i][i], p - 2, p);
    for (int j = 0; j < n; j++) { a[i][j] = a[i][j] * t % p; inv[i][j] = inv[i][j] * t % p; }
    for (int j = 0; j < n; j++) if (j != i && a[j][i]) {
      ll f = a[j][i];
      for (int k = 0; k < n; k++) {
        a[j][k] = (a[j][k] - f * a[i][k]) % p;
        inv[j][k] = (inv[j][k] - f * inv[i][k]) % p;
      }
    }
  }
  for (auto &r : inv) for (auto &v : r) v = (v % p + p) % p;
  return true;
}
ll det(vector<vector<ll>> a, ll p) {       // 行列式 mod 素数 p, O(n^3 log p)
  int n = a.size(); ll res = 1;
  for (int i = 0; i < n; i++) {
    int piv = -1;
    for (int j = i; j < n; j++) if (a[j][i] % p) { piv = j; break; }
    if (piv == -1) return 0;
    if (piv != i) { swap(a[piv], a[i]); res = (p - res) % p; }
    res = res * ((a[i][i] % p + p) % p) % p;
    ll t = qpow(a[i][i], p - 2, p);
    for (int j = i + 1; j < n; j++) {
      ll f = a[j][i] * t % p;
      if (!f) continue;
      for (int k = i; k < n; k++) a[j][k] = (a[j][k] - f * a[i][k]) % p;
    }
  }
  return (res % p + p) % p;
}

```

> ⚠️ 实数消元必须选主元（绝对值最大的行）；判零用 `fabs(x) < EPS`，不要写 `== 0`。
> ⚠️ 模意义下行列式不能直接除，先判 `a[i][i] % p == 0` 再换行；换一次行 `res` 变一次号。
### 5.7 中国剩余定理 CRT / 扩展 CRT

```cpp

ll CRT(int k, ll *a, ll *r) {              // x ≡ a[i] (mod r[i]), r[i] 两两互素; O(n log)
  ll n = 1, ans = 0;
  for (int i = 1; i <= k; i++) n *= r[i];
  for (int i = 1; i <= k; i++) {
    ll m = n / r[i], b, y;
    exgcd(m, r[i], b, y);                  // b * m ≡ 1 (mod r[i])
    ans = (ans + (i128)a[i] * m % n * b) % n;
  }
  return (ans % n + n) % n;
}
ll excrt(int n, ll *a, ll *m) {            // 扩展 CRT: 模数不必互素; 无解返回 -1; O(n log)
  ll x = a[1], M = m[1];                   // 维护 x ≡ a[i] (mod m[i]) 的通解 x + k*M
  for (int i = 2; i <= n; i++) {
    ll A = M, B = m[i], C = ((a[i] - x) % B + B) % B, p, q;
    ll g = exgcd(A, B, p, q);              // A*p + B*q = g
    if (C % g) return -1;                  // 无解
    ll t = B / g;
    ll k = (ll)((i128)(p % t + t) % t * ((C / g) % t) % t);
    x = (ll)(((i128)x + (i128)k * M) % ((i128)M / g * B));
    M = M / g * B;                         // lcm(M, m[i])
  }
  return (x % M + M) % M;
}

```

> ⚠️ `M = M / g * B` 必须先除后乘，直接 `M * B` 溢出；`k` 要归一到 `[0, B/g)`，否则 `k*M` 为负导致取模出错。
### 5.8 BSGS 离散对数 / 原根

```cpp

ll bsgs(ll a, ll b, ll p) {                // 最小非负 x 使 a^x ≡ b (mod p), 要求 gcd(a,p)=1; O(sqrt p)
  a %= p; b %= p;
  if (b == 1 % p) return 0;
  ll m = (ll)ceil(sqrt((long double)p));
  unordered_map<ll, ll> mp; ll e = 1;
  for (ll j = 0; j < m; j++) { if (!mp.count(e)) mp[e] = j; e = e * a % p; }  // 只存最小 j
  ll am = qpow(a, m, p), iam, tmp;
  exgcd(am, p, iam, tmp); iam = (iam % p + p) % p;       // a^(-m)
  ll cur = b;
  for (ll i = 0; i < m; i++) {
    auto it = mp.find(cur);
    if (it != mp.end()) return i * m + it->second;
    cur = (i128)cur * iam % p;
  }
  return -1;
}
ll exbsgs(ll a, ll b, ll p) {              // 扩展 BSGS: 不要求互素, 无解返回 -1; O(sqrt p)
  a %= p; b %= p;
  if (b == 1 % p) return 0;
  if (p == 1) return 0;
  ll k = 1, add = 0, g;
  while ((g = gcd(a, p)) > 1) {            // 约简到 gcd(a,p)=1: 等价于 k * a^(x-add) ≡ b
    if (b % g) return -1;
    b /= g; p /= g; ++add; k = (i128)k * (a / g) % p;
    if (k == b) return add;                // x = add 就是一个解
  }
  ll ik, tmp; exgcd(k, p, ik, tmp); ik = (ik % p + p) % p;
  ll y = bsgs(a, (i128)b * ik % p, p);     // 此时 gcd(a,p)=1, 复用 BSGS
  return y < 0 ? -1 : y + add;
}
ll primitive_root(ll p) {                  // 最小原根(素数模): 对所有 q|(p-1) 有 g^((p-1)/q) != 1
  if (p == 2) return 1;                    // O(sqrt p + log^2 p)
  ll phi = p - 1, x = phi; vector<ll> fac;
  for (ll i = 2; i * i <= x; i++) if (x % i == 0) { fac.push_back(i); while (x % i == 0) x /= i; }
  if (x > 1) fac.push_back(x);
  for (ll g = 2; g < p; g++) {
    bool ok = true;
    for (ll q : fac) if (qpow(g, phi / q, p) == 1) { ok = false; break; }
    if (ok) return g;
  }
  return -1;
}

```

### 5.9 博弈论

```cpp

bool nim(vector<ll> &a) { ll s = 0; for (ll x : a) s ^= x; return s != 0; }  // Nim: 异或和非 0 先手必胜
int sg[1005];                              // SG 定理: sg(u)=mex{sg(v): u->v}, sg(初始)!=0 先手必胜
int get_sg(int x) {
  if (sg[x] != -1) return sg[x];
  bool vis[64] = {false};
  for (int y : moves(x)) vis[get_sg(y)] = true;   // moves(x): x 的所有后继状态
  int g = 0; while (vis[g]) g++;
  return sg[x] = g;
}
// SG 打表技巧: 先记忆化暴力算小范围 sg 并打印, 观察周期(通常很小), 再按周期 O(1) 求
bool anti_nim(vector<ll> &a) {             // anti-Nim(取走最后一颗者输): 先手必胜 iff
  ll s = 0; bool big = false; int one = 0;//   (全是 1 且 1 的堆数为偶数) 或 (有堆 > 1 且异或和 != 0)
  for (ll x : a) { s ^= x; if (x > 1) big = true; else if (x == 1) one++; }
  return big ? s != 0 : one % 2 == 0;
}
bool stair_nim(vector<ll> &a) {            // 阶梯 Nim: 第 i 级石子可移到第 i-1 级(第 1 级出局)
  ll s = 0;                                // 先手必胜 iff 奇数级台阶石子数异或和 != 0
  for (int i = 1; i < (int)a.size(); i += 2) s ^= a[i];
  return s != 0;
}

```

> ⚠️ SG 值只能异或，不要做加减；anti-Nim 的两种情况必须写全（全 1 看奇偶，否则看异或和）。
### 5.10 线性基

```cpp

struct LinearBasis {                       // 异或空间, 值域 < 2^62
  static const int B = 62;
  ll d[B + 1], p[B + 1]; int cnt; bool zero;
  LinearBasis() { memset(d, 0, sizeof d); cnt = 0; zero = false; }
  bool insert(ll x) {                      // O(B), 返回是否使秩增加
    for (int i = B; i >= 0; i--) {
      if (!(x >> i & 1)) continue;
      if (!d[i]) { d[i] = x; return true; }
      x ^= d[i];
    }
    zero = true; return false;             // 线性相关, 说明能异或出 0
  }
  bool query(ll x) {                       // 能否被线性表出, O(B)
    for (int i = B; i >= 0; i--) if (x >> i & 1) { if (!d[i]) return false; x ^= d[i]; }
    return true;
  }
  ll qmax() { ll r = 0; for (int i = B; i >= 0; i--) r = max(r, r ^ d[i]); return r; }   // O(B)
  ll qmin() { if (zero) return 0; for (int i = 0; i <= B; i++) if (d[i]) return d[i]; return 0; }  // O(B)
  void rebuild() {                         // 化为简化阶梯形, O(B^2)
    for (int i = B; i >= 0; i--) for (int j = i - 1; j >= 0; j--)
      if (d[i] >> j & 1) d[i] ^= d[j];
    cnt = 0;
    for (int i = 0; i <= B; i++) if (d[i]) p[cnt++] = d[i];
  }
  ll kth(ll k) {                           // 第 k 小(从 1 开始), 必须先 rebuild; 越界返回 -1
    if (zero) { if (k == 1) return 0; k--; }
    if (k < 1 || k >= (1LL << cnt)) return -1;
    ll r = 0;
    for (int i = 0; i < cnt; i++) if (k >> i & 1) r ^= p[i];
    return r;
  }
};

```

> ⚠️ `kth` 必须在 `rebuild` 之后调用；`B` 改 63（`unsigned long long` 值域）时 `1LL << cnt` 要同步改 `1ULL`。
### 5.11 概率与期望

```cpp

// 1) 期望线性性: E[X+Y] = E[X] + E[Y], 不要求独立 —— 把总次数的期望拆成每个元素的贡献之和
// 2) 全概率 P(A)=Σ_i P(B_i)*P(A|B_i);  3) 条件期望 E[X]=Σ_y P(Y=y)*E[X|Y=y]
// 套路: 设 E[i] = 从状态 i 到终点的期望步数, 倒推 E[i] = 1 + Σ_j P(i->j) * E[j], E[终点] = 0
// 有自环时不满足后效性, 必须移项: E[i] = p*E[i] + (1-p)*E[j] + 1  =>  E[i] = E[j] + 1/(1-p)
// 多个状态互相依赖(成环)时列方程组, 用高斯消元解
double coupon(int n) {                     // 集齐 n 种券的期望次数 = n * H(n), O(n)
  double e = 0;
  for (int i = 1; i <= n; i++) e += 1.0 * n / i;
  return e;
}

```

> ⚠️ 转移式右边出现 `E[i]` 时必须先移项除以 `(1-p)`；`p == 1` 表示永远走不出去。注意 `n = 0` 等边界。
### 5.12 三分法 / 牛顿迭代

```cpp

double trisearch(double l, double r) {     // 实数三分求单峰极值, 迭代 100 次足够
  for (int it = 0; it < 100; it++) {
    double m1 = l + (r - l) / 3, m2 = r - (r - l) / 3;
    if (f(m1) < f(m2)) r = m2; else l = m1;   // 求极大值时把判断反过来
  }
  return l;                                // 返回极值点; 需要极值就 return f(l)
}
ll tri_int(ll l, ll r) {                   // 整数三分求凸函数极小, O(log n)
  while (r - l > 2) {
    ll m1 = l + (r - l) / 3, m2 = r - (r - l) / 3;
    if (f(m1) < f(m2)) r = m2; else l = m1;
  }
  ll best = LLONG_MAX;
  for (ll i = l; i <= r; i++) best = min(best, f(i));   // 小区间暴力收尾
  return best;
}
double newton_sqrt(double c) {             // 牛顿迭代 x=(x+c/x)/2, 二阶收敛
  double x = c; for (int i = 0; i < 100; i++) x = (x + c / x) / 2; return x;
}
// 解一般方程 f(x)=0: x <- x - f(x)/f'(x); 如 f=x^3-a, f'=3x^2

```

> ⚠️ 整数三分只对**严格**单峰函数成立，出现相等平台会卡住（改用二分差分符号）；实数三分写 100~200 次迭代最省心。
### 5.13 高精度分数 / 有理数比较

```cpp

int cmp_frac(ll a, ll b, ll c, ll d) {     // 交叉相乘比较 a/b 与 c/d (b, d > 0); O(1)
  i128 x = (i128)a * d, y = (i128)c * b;
  return x < y ? -1 : (x > y ? 1 : 0);
}

```

> ⚠️ 相乘前先 `gcd` 约分可显著降低溢出概率；分母为负时先把符号提到分子。`__int128` 上限约 1.7e38，两个 1e18 相乘刚好够，再大必须手写高精度。
### 5.14 常见坑

> ⚠️ **负数取模**：C++ 的 `%` 向零取整，`-7 % 3 == -1`；要数学结果一律写 `(a % p + p) % p`。
> ⚠️ **整除向下取整**：`-7 / 2 == -3` 而不是 `-4`；需要 floor 写 `(a - ((a % b) + b) % b) / b`。
> ⚠️ **模数为合数**：费马小定理失效，逆元用 `exgcd`（需互素）或欧拉定理 `a^(φ(m)-1)`；组合数走扩展 Lucas + CRT。
> ⚠️ **1e9+7 与 998244353**：都是素数，逆元都能用费马。`998244353 = 119*2^23+1`，原根 3，支持长度 `2^23` 的 NTT；`1e9+7` 原根 5，但 `p-1 = 2*500000003` 只含一个因子 2，**不能 NTT**。
> ⚠️ **pow 与快速幂混用**：`std::pow` 返回 `double`（`pow(2,60)` 丢精度），也没有三参数版本；取模幂一律自己写 `qpow`。
> ⚠️ **快速幂初值**：写 `ll r = 1 % p` 而非 `1`（`p == 1` 时才对）；`lucas` 里同理 `return 1 % p`。
> ⚠️ **乘法溢出**：`a * b % p` 中两数都可能到 1e18 时必须转 `__int128` 或用快速乘；`int` 混用时写 `1LL * a * b`。
> ⚠️ **long double 快速乘不靠谱**：`mul_ld` 这类写法实测（x86-64 g++ -O2，20 万次随机）在 `m <= 1e12` 时 0 错（20 万次随机断言通过），`m ~ 1e15` 时 0.001% 错，`m ~ 1e18` 时约 1.7%（两次实测 1.71%/1.75%），`m ~ 4e18` 时约 6.6%，`m ~ 2^62` 时约 7.9%；模数超过 1e12 就别用它，改用 `__int128` 或龟速乘。
> ⚠️ **欧拉降幂**：`b >= φ(m)` 时 `a^b ≡ a^(b mod φ(m) + φ(m)) (mod m)`，不要求互素；互素时直接 `a^(b mod φ(m))`。
> ⚠️ **筛法边界**：`μ(1)=1, φ(1)=1, d(1)=1`，线性筛主循环从 `i = 2` 起，别忘了单独初始化 1。
> ⚠️ **组合数上界**：预处理阶乘要求 `n < p`；`n >= p` 时 `fac[n] ≡ 0` 且逆元不存在，必须改 Lucas。
>
> ⚠️ **内存**：`1e7` 个 `int` 就是 40MB，多开几个数组就会超（CSP 常见 256MB）。


## 第 06 章 计算几何与杂项技巧

> CCF-CSP 上机 4 小时 5 题。几何题优先「整数坐标 + 叉积」避开浮点。
### A. 计算几何

#### 1. 点 / 向量 / 直线：基础结构

```cpp

// 依赖: 无. 所有运算 O(1)
#include <bits/stdc++.h>
using namespace std;
const double eps = 1e-9, PI = acos(-1.0);
int sgn(double x) { return x > eps ? 1 : (x < -eps ? -1 : 0); }
struct P {                                   // 点 / 向量
    double x, y;
    P(double x = 0, double y = 0) : x(x), y(y) {}
    P operator+(const P& b) const { return P(x + b.x, y + b.y); }
    P operator-(const P& b) const { return P(x - b.x, y - b.y); }
    P operator*(double k) const { return P(x * k, y * k); }    P operator/(double k) const { return P(x / k, y / k); }
    P operator-() const { return P(-x, -y); }
    bool operator<(const P& b) const { return sgn(x - b.x) ? x < b.x : y < b.y; }
    bool operator==(const P& b) const { return !sgn(x - b.x) && !sgn(y - b.y); }
};
double dot(P a, P b) { return a.x * b.x + a.y * b.y; }       // 点积, >0 锐角
double cross(P a, P b) { return a.x * b.y - a.y * b.x; }     // 叉积, >0 表示 b 在 a 逆时针侧
double cross(P o, P a, P b) { return cross(a - o, b - o); }  // oa x ob
double len2(P a) { return dot(a, a); }                       // 模长平方(比距离优先用)
double len(P a) { return sqrt(len2(a)); }
double dist(P a, P b) { return len(a - b); }
P unit(P a) { return a / len(a); }                           // 单位化
P rot(P a, double t) { return P(a.x * cos(t) - a.y * sin(t), a.x * sin(t) + a.y * cos(t)); }
P rot90(P a) { return P(-a.y, a.x); }                        // 逆时针 90 度

```

> ⚠️ `cross(a,b) > 0` 指 b 在 a 逆时针方向；判「c 在有向直线 ab 哪侧」写 `cross(b-a, c-a)`，顺序反了结论相反。比较距离一律比 `len2`（整数坐标可全程 long long）。
#### 2. 浮点比较与精度控制

```cpp

// 依赖: 上文 eps / sgn / P / len2
inline bool eq(double a, double b) { return fabs(a - b) < eps; }     // lt: a < b - eps 为容差版严格小于
bool cmpAng(P a, P b) {                        // 极角排序: atan2 值域 (-pi, pi]
    double t1 = atan2(a.y, a.x), t2 = atan2(b.y, b.x);
    if (fabs(t1 - t2) > eps) return t1 < t2;
    return len2(a) < len2(b);                  // 同角度近的在前(Graham 用)
}
// 半平面交要跨 pi 的连续极角: ang = atan2(y, x); if (ang < 0) ang += 2 * PI;

```

> ⚠️ eps 经验值：坐标 1e9 → 1e-9；多次乘除开方累积 → 1e-8；二分几何 → 1e-7。eps 过大会把「相切 / 共线」误判成相交。能用整数叉积判定的（相交、共线、凸包、面积）绝不用 double。
#### 3. 线段相交 / 点在多边形内 / 距离与垂足 / 多边形面积与 Pick 定理

```cpp

// 依赖: 上文 P / sgn / dot / cross / len2 / len / dist
P proj(P p, P a, P b) { return a + (b - a) * (dot(p - a, b - a) / len2(b - a)); }   // 垂足
double distLine(P p, P a, P b) { return fabs(cross(b - a, p - a)) / len(b - a); }   // 点到直线
double distSeg(P p, P a, P b) {                       // 点到线段
    if (a == b) return dist(p, a);
    P v = b - a; double t = dot(p - a, v) / len2(v);
    if (sgn(t) <= 0) return dist(p, a);
    if (sgn(t - 1) >= 0) return dist(p, b);
    return fabs(cross(v, p - a)) / len(v);
}
bool onSeg(P p, P a, P b) { return !sgn(cross(a - p, b - p)) && sgn(dot(a - p, b - p)) <= 0; }
bool segInt(P a, P b, P c, P d) {                     // 线段 ab 与 cd 是否相交(含端点接触)
    if (onSeg(a, c, d) || onSeg(b, c, d) || onSeg(c, a, b) || onSeg(d, a, b)) return true;
    return sgn(cross(b - a, c - a)) * sgn(cross(b - a, d - a)) < 0 &&
           sgn(cross(d - c, a - c)) * sgn(cross(d - c, b - c)) < 0;
}
P lineIts(P a, P b, P c, P d) {                       // 直线交点(需不平行)
    double s1 = cross(b - a, c - a), s2 = cross(b - a, d - a); return c + (d - c) * (s1 / (s1 - s2));
}
int inPoly(const vector<P>& p, P q) {                 // 射线法: 1=内 0=外 -1=边界. O(n)
    int n = p.size(), c = 0;
    for (int i = 0; i < n; i++) {
        P a = p[i], b = p[(i + 1) % n];
        if (onSeg(q, a, b)) return -1;
        if ((a.y > q.y) != (b.y > q.y)) {             // 水平射线跨越该边(裸比较, 不加 eps)
            double x = a.x + (q.y - a.y) / (b.y - a.y) * (b.x - a.x);
            if (x > q.x) c ^= 1;                      // 交点严格在右侧才翻转
        }
    }
    return c;
}
int winding(const vector<P>& p, P q) {                // 转角法: 0=外 非0=内 -1=边界. O(n)
    int n = p.size(), w = 0;
    for (int i = 0; i < n; i++) {
        P a = p[i], b = p[(i + 1) % n];
        if (onSeg(q, a, b)) return -1;
        if (a.y <= q.y) { if (b.y > q.y && cross(b - a, q - a) > 0) w++; }
        else            { if (b.y <= q.y && cross(b - a, q - a) < 0) w--; }
    }
    return w;
}
// ===== 多边形面积 / 三角形 / Pick 定理 =====
double area(const vector<P>& p) {                     // 有向面积, 逆时针为正. O(n)
    double s = 0;
    for (int i = 0, n = p.size(); i < n; i++) s += cross(p[i], p[(i + 1) % n]);
    return s / 2;
}
double triArea(P a, P b, P c) { return fabs(cross(b - a, c - a)) / 2; }   // 三角形面积
P triCentroid(P a, P b, P c) { return (a + b + c) / 3; }                  // 重心
P polyCentroid(const vector<P>& p) {                  // 多边形重心(面积加权). O(n)
    double s = 0; P c(0, 0);
    for (int i = 0, n = p.size(); i < n; i++) {
        double t = cross(p[i], p[(i + 1) % n]);
        s += t; c = c + (p[i] + p[(i + 1) % n]) * t;
    }
    return c / (3 * s);
}
// Pick 定理(顶点全为整点的简单多边形): S = I + B/2 - 1
//   B = Σ gcd(|dx|, |dy|) 逐边求和;  I = (2S - B + 2) / 2
//   2S 直接用叉积和(不除 2), 全程整数不丢精度
long long pickI(long long s2, long long B) { return (s2 - B + 2) / 2; }   // s2 = |叉积和|

```

> ⚠️ 射线法用 `(a.y > q.y) != (b.y > q.y)` 裸比较而非 `sgn`，正是为避开水平边退化与 eps 抖动，别好心加 eps。Pick 只对顶点全为整点的简单多边形成立，`s2 - B + 2` 必为偶数，中途不要转 double。
#### 4. 凸包：Andrew 单调链 / Graham 扫描

```cpp

// Andrew 单调链. 依赖: 上文 P / sgn / cross。返回逆时针凸包, 已去共线点与重复点. O(n log n)
vector<P> convexHull(vector<P> p) {
    sort(p.begin(), p.end()); p.erase(unique(p.begin(), p.end()), p.end());
    int n = p.size();
    if (n <= 2) return p;
    vector<P> h(n + 1); int k = 0;
    for (int i = 0; i < n; i++) {                     // 下凸壳
        while (k >= 2 && sgn(cross(h[k - 1] - h[k - 2], p[i] - h[k - 1])) <= 0) k--;
        h[k++] = p[i];
    }
    for (int i = n - 2, t = k + 1; i >= 0; i--) {     // 上凸壳
        while (k >= t && sgn(cross(h[k - 1] - h[k - 2], p[i] - h[k - 1])) <= 0) k--;
        h[k++] = p[i];
    }
    h.resize(k - 1); return h;                        // 去掉重复起点
}
vector<P> graham(vector<P> p) {                       // Graham 扫描: 极角排序版. O(n log n)
    int n = p.size();
    if (n <= 2) return p;
    for (int i = 1; i < n; i++)                       // 取最低最左点为基准
        if (p[i].y < p[0].y || (p[i].y == p[0].y && p[i].x < p[0].x)) swap(p[0], p[i]);
    P o = p[0];
    sort(p.begin() + 1, p.end(), [&](P a, P b) {
        double t1 = atan2(a.y - o.y, a.x - o.x), t2 = atan2(b.y - o.y, b.x - o.x);
        if (fabs(t1 - t2) > eps) return t1 < t2;
        return len2(a - o) < len2(b - o);             // 同角度保留最远的
    });
    vector<P> h;
    for (int i = 0; i < n; i++) {
        while (h.size() >= 2 && sgn(cross(h.back() - h[h.size() - 2], p[i] - h.back())) <= 0) h.pop_back();
        h.push_back(p[i]);
    }
    return h;
}
double hullPeri(const vector<P>& h) {                 // 凸包周长. O(n)
    double s = 0; for (int i = 0, n = h.size(); i < n; i++) s += dist(h[i], h[(i + 1) % n]);
    return s;
}
double hullArea(const vector<P>& h) { return fabs(area(h)); }             // 凸包面积

```

> ⚠️ Andrew 里 `<= 0` 弹出共线点（严格凸包、边数最少）；要保留边上的点改 `< 0`。所有点共线时返回 2 个点，后续旋转卡壳必须先特判 `h.size() <= 2`。
#### 5. 旋转卡壳：凸包直径 / 最小外接矩形

```cpp

// 凸包直径(最远点对). 依赖: P / cross / dist. 要求 h 逆时针无重复点. O(n)
double diameter(const vector<P>& h) {
    int n = h.size();
    if (n == 1) return 0;
    if (n == 2) return dist(h[0], h[1]);
    double ans = 0;
    for (int i = 0, j = 2; i < n; i++) {
        P a = h[i], b = h[(i + 1) % n];
        while (fabs(cross(b - a, h[(j + 1) % n] - a)) > fabs(cross(b - a, h[j] - a))) j = (j + 1) % n;
        ans = max(ans, max(dist(a, h[j]), dist(b, h[j])));   // j 为面积最大的对踵点
    }
    return ans;
}
// 最小面积 / 周长外接矩形: 必有一条边与凸包某条边共线, 只枚举边. O(n)
pair<double, double> minRect(const vector<P>& h) {    // 返回 {最小面积, 最小周长}
    int n = h.size();
    if (n == 1) return {0, 0};
    if (n == 2) return {0, 2 * len(h[0] - h[1])};
    double ba = 1e100, bp = 1e100;
    int j = 1, l = 1, r = 1;                          // j: 最高点, r/l: 最右/最左点
    for (int i = 0; i < n; i++) {
        P e = h[(i + 1) % n] - h[i];
        while (cross(e, h[(j + 1) % n] - h[i]) > cross(e, h[j] - h[i])) j = (j + 1) % n;
        while (dot(h[(r + 1) % n] - h[i], e) > dot(h[r] - h[i], e)) r = (r + 1) % n;
        if (i == 0) l = r;
        while (dot(h[(l + 1) % n] - h[i], e) <= dot(h[l] - h[i], e)) l = (l + 1) % n;   // 必须 <= , 否则并列时会停在 r 上使宽度为 0
        double w = dot(h[r] - h[i], e) - dot(h[l] - h[i], e);   // 宽度 * |e|
        double hh = cross(e, h[j] - h[i]), d2 = len2(e);        // 高度 * |e|
        ba = min(ba, w * hh / d2);
        bp = min(bp, 2 * (w + hh) / sqrt(d2));
    }
    return {ba, bp};
}

```

> ⚠️ 旋转卡壳两个坑：① `while` 内的下标必须 `% n` 回绕且 `j / l / r` 只能单调前进；② 求最左点的循环必须用 `<=` 比较(不能用 `<`)，否则投影并列时 `l` 会停在 `r` 上使宽度算成 0。凸包含重复点或共线点时会退化，先 `convexHull` 去干净。`while` 内必须 `% n` 回绕，且 `j / l / r` 只能单调前进；凸包含重复点或共线点时会退化，先 `convexHull` 去干净。
#### 6. 扫描线：矩形面积并 / 周长并 / 面积交

```cpp

// 矩形面积并: 离散化 x + 按 y 扫描 + 线段树. 节点区间 [l, r), 叶子是基本区间 [l, l+1)
#include <bits/stdc++.h>
using namespace std;
const int N = 2e5 + 5;
struct Line { double x1, x2, y; int o; } L[N];
double xs[N], len[N << 3];             // len[p]: 节点内被覆盖 >= 1 次的长度
int cnt[N << 3];                       // cnt[p]: 节点整段被"完整覆盖"的次数
int m, tot;
void pushup(int p, int l, int r) {
    if (cnt[p]) len[p] = xs[r] - xs[l];
    else if (r - l == 1) len[p] = 0;
    else len[p] = len[p << 1] + len[p << 1 | 1];
}
void upd(int p, int l, int r, int ql, int qr, int v) {
    if (qr <= l || r <= ql) return;
    if (ql <= l && r <= qr) { cnt[p] += v; pushup(p, l, r); return; }
    int mid = (l + r) >> 1;
    upd(p << 1, l, mid, ql, qr, v), upd(p << 1 | 1, mid, r, ql, qr, v);
    pushup(p, l, r);
}
int main() {                                        // O(n log n)
    int n; scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        double x1, y1, x2, y2; scanf("%lf%lf%lf%lf", &x1, &y1, &x2, &y2);
        L[i] = {x1, x2, y1, 1}, L[i + n] = {x1, x2, y2, -1};
        xs[i] = x1, xs[i + n] = x2;
    }
    sort(xs, xs + 2 * n), m = unique(xs, xs + 2 * n) - xs, tot = m - 1;   // tot 为基本区间数
    sort(L, L + 2 * n, [](const Line& a, const Line& b) { return a.y < b.y; });
    double ans = 0;
    for (int i = 0; i < 2 * n; i++) {
        if (i) ans += (L[i].y - L[i - 1].y) * len[1];
        upd(1, 0, tot, lower_bound(xs, xs + m, L[i].x1) - xs, lower_bound(xs, xs + m, L[i].x2) - xs, L[i].o);
    }
    printf("%.2f\n", ans);
}
// 矩形周长并: 线段树再加 int num[N<<3]; bool lc[N<<3], rc[N<<3];  pushup:
//   cnt[p] ? (len=xs[r]-xs[l], num=1, lc=rc=true)
//          : (r-l==1 ? (len=num=0, lc=rc=false)
//                    : (len=len[a]+len[b], num=num[a]+num[b]-(rc[a]&&lc[b]), lc=lc[a], rc=rc[b]));
//   主循环: ans += fabs(len[1]-pre), pre=len[1];  再 ans += 2*num[1]*(L[i+1].y-L[i].y);
// 矩形面积交: n 个轴对齐矩形的公共部分仍是"一个"矩形, 直接 O(n):
//   x1=max(x1,a), y1=max(y1,b), x2=min(x2,c), y2=min(y2,d); s=max(0,x2-x1)*max(0,y2-y1);

```

> ⚠️ 线段树区间写 `[l, r)`、根节点传 `[0, tot]`（`tot = m-1`）；写成 `[0, m-1]` 会丢掉最后一段。`cnt` 不 pushdown 也不清空——`upd` 里 `cnt[p] += v` 后立刻 `pushup`，回溯时父节点再 `pushup`，这是板子成立的关键。
#### 7. 最小圆覆盖 / 半平面交 / 平面最近点对

```cpp

// 最小圆覆盖: 随机增量. 依赖: P / sgn / dist / lineIts / rot90. 期望 O(n), 最坏 O(n^3)
struct C { P o; double r; };
C circle2(P a, P b) { return {(a + b) / 2, dist(a, b) / 2}; }
C circle3(P a, P b, P c) {                     // 三点外接圆(需不共线)
    P m1 = (a + b) / 2, m2 = (a + c) / 2;
    return {lineIts(m1, m1 + rot90(b - a), m2, m2 + rot90(c - a)), 0};
}
bool inC(const C& c, P p) { return sgn(dist(c.o, p) - c.r) <= 0; }
C minCircle(vector<P> p) {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    shuffle(p.begin(), p.end(), rng);          // 必须打乱, 否则可被卡到 O(n^3)
    C c{p[0], 0};
    for (int i = 0; i < (int)p.size(); i++) if (!inC(c, p[i])) {
        c = {p[i], 0};
        for (int j = 0; j < i; j++) if (!inC(c, p[j])) {
            c = circle2(p[i], p[j]);
            for (int k = 0; k < j; k++) if (!inC(c, p[k]))
                c = circle3(p[i], p[j], p[k]), c.r = dist(c.o, p[i]);
        }
    }
    return c;
}

```

半平面交（简述）：每个半平面用有向直线 `a -> b` 表示「左侧」区域。极角排序后用**双端队列**维护当前交多边形：加入新半平面时，若队尾 / 队首的交点落在它右侧就弹出；最后用队首半平面回删队尾，相邻半平面两两求交得到顶点。总复杂度 `O(n log n)`（排序主导）。CSP 极少直接考，遇到优先转化为凸包 / 二分。

```cpp

// 平面最近点对: 分治 + 归并. O(n log n)
#include <bits/stdc++.h>
using namespace std; typedef long long ll; const int N = 500005;
struct PT { ll x, y, id; } a[N]; int n, A, B; ll mind2 = LLONG_MAX;
void upd(const PT& u, const PT& v) {
    ll d = (u.x - v.x) * (u.x - v.x) + (u.y - v.y) * (u.y - v.y);
    if (d < mind2) mind2 = d, A = u.id, B = v.id;
}
void dc(int l, int r) {                        // 区间 [l, r)
    if (l + 1 >= r) return;
    int m = (l + r) >> 1; ll midx = a[m].x;
    dc(l, m), dc(m, r);
    inplace_merge(a + l, a + m, a + r, [](const PT& u, const PT& v) { return u.y < v.y; });
    vector<PT> t;
    for (int i = l; i < r; i++) if ((a[i].x - midx) * (a[i].x - midx) < mind2) t.push_back(a[i]);
    for (size_t i = 0; i < t.size(); i++)       // 归并后按 y 有序, 内层可 break
        for (size_t j = i + 1; j < t.size() && (t[j].y - t[i].y) * (t[j].y - t[i].y) < mind2; j++)
            upd(t[i], t[j]);
}
int main() {
    scanf("%d", &n);
    for (int i = 0; i < n; i++) scanf("%lld%lld", &a[i].x, &a[i].y), a[i].id = i;
    sort(a, a + n, [](const PT& u, const PT& v) { return u.x < v.x; });
    dc(0, n), printf("%d %d %lld\n", A, B, mind2);
}

```

> ⚠️ 最近点对用平方距离（long long）比较且**不取等号**，否则退化。C++17 已删除 `random_shuffle`，一律用 `shuffle` + `mt19937`。
### B. 杂项与实战技巧

#### 8. 随机化

```cpp

// 随机数基础设施 + 洗牌 + 随机化快排 + 爬山法
#include <bits/stdc++.h>
using namespace std;
mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
long long rnd(long long l, long long r) { return l + (long long)(rng() % (r - l + 1)); }
double rndd() { return (double)(rng() >> 11) / (double)(1ULL << 53); }   // [0,1)
template <class T> void shuf(vector<T>& v) {          // 洗牌: Fisher-Yates. O(n)
    for (int i = v.size() - 1; i > 0; i--) swap(v[i], v[rnd(0, i)]);
}
void qsort3(vector<int>& a, int l, int r) {           // 随机基准 + 三路划分, 防有序退化
    if (l >= r) return;                               // 期望 O(n log n)
    swap(a[l], a[rnd(l, r)]);
    int p = a[l], i = l, lt = l, gt = r;
    while (i <= gt) {
        if (a[i] < p) swap(a[lt++], a[i++]);
        else if (a[i] > p) swap(a[i], a[gt--]);
        else i++;
    }
    qsort3(a, l, lt - 1), qsort3(a, gt + 1, r);
}
void hillclimb() {                                    // 爬山法(带权费马点): 沿合力方向走
    double t = 1000;
    while (t > 1e-8) {
        double nx = 0, ny = 0;
        for (int i = 0; i < n; i++) {
            double dx = x[i] - ansx, dy = y[i] - ansy, d = sqrt(dx * dx + dy * dy);
            if (d > 1e-12) nx += dx * w[i] / d, ny += dy * w[i] / d;   // 合力方向 = 梯度
        }
        ansx += nx * t, ansy += ny * t, t *= (t > 0.5) ? 0.5 : 0.97;   // 先快后慢
    }
}
// 模拟退火伪代码: T0 初温, Tend 终温, k 降温系数(0.95~0.998)
// srand(chrono::steady_clock::now().time_since_epoch().count());
// double t = T0, nx = ansx, ny = ansy;
// while (t > Tend) {
//   double cx = nx + t * (Rand() * 2 - 1), cy = ny + t * (Rand() * 2 - 1);  // 邻域正比温度
//   double d = calc(cx, cy) - calc(nx, ny);            // calc 顺带更新全局最优
//   if (d < 0 || exp(-d / t) > Rand()) nx = cx, ny = cy;                    // Metropolis 准则
//   t *= k;   }   结束后在最优点附近再做 1000 次小步长随机尝试, 防止停在次优

```

参数调法（实战经验）：初温 `T0` 取「随便走一步的 |Δf| 量级」的 10 倍，或坐标范围的 1/10；降温系数 `0.95 ~ 0.998`，越接近 1 越准越慢，CSP 有 4 小时可用 `0.99`；终温 `Tend` 比题目精度低 2~3 个数量级（要求 1e-3 就取 1e-5）；**多次退火取最优**——单次 SA 方差大，用不同种子跑 5~20 遍取 min 比调参数更有效；也可按时间退火 `while ((double)clock() / CLOCKS_PER_SEC < 1.8)`；邻域要匹配问题（连续型用高斯 / 均匀扰动，离散型用 swap / 翻转）。
> ⚠️ SA / 爬山不保证正确性，只适合「精度要求不高 + 正解写不出」的场景；CSP 优先写正解，SA 作 T3/T4 部分分保底。

```cpp

// 随机化哈希防卡: 每个 key 赋随机权值, 出题人无法预先构造冲突. 64 位自然溢出
static uint64_t splitmix64(uint64_t x) {
    x += 0x9e3779b97f4a7c15ULL;
    x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
    x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
    return x ^ (x >> 31);
}
struct ULLHash {                                    // 防 unordered_map 被卡
    size_t operator()(uint64_t x) const {
        static const uint64_t FIXED = chrono::steady_clock::now().time_since_epoch().count(); return splitmix64(x + FIXED);
    }
};
// unordered_map<long long, int, ULLHash> mp;   字符串哈希同理: h = h * B + hsh(s[i]);

```

#### 9. 分治：CDQ / 整体二分 / 归并排序求逆序对

```cpp

// CDQ 分治求三维偏序: 统计每个点被多少个点三维都 <= 它. O(n log^2 n)
#include <bits/stdc++.h>
using namespace std;
const int N = 1e5 + 5, K = 2e5 + 5;
int n, k, m, res[N], tr[K];
struct E { int a, b, c, cnt, ans; } e[N], u[N];
bool cmpA(const E& x, const E& y) { return x.a != y.a ? x.a < y.a : (x.b != y.b ? x.b < y.b : x.c < y.c); }
bool cmpB(const E& x, const E& y) { return x.b != y.b ? x.b < y.b : x.c < y.c; }
bool same(const E& x, const E& y) { return x.a == y.a && x.b == y.b && x.c == y.c; }
void add(int p, int v) { for (; p <= k; p += p & -p) tr[p] += v; }
int ask(int p) { int s = 0; for (; p; p -= p & -p) s += tr[p]; return s; }
void cdq(int l, int r) {
    if (l == r) return;
    int mid = (l + r) >> 1;
    cdq(l, mid), cdq(mid + 1, r);                                       // 1) 递归两半
    sort(u + l, u + mid + 1, cmpB), sort(u + mid + 1, u + r + 1, cmpB);  // 2) 按 b 排序
    int i = l;                                                           // 3) 双指针跨区间
    for (int j = mid + 1; j <= r; j++) {
        while (i <= mid && u[i].b <= u[j].b) add(u[i].c, u[i].cnt), i++;
        u[j].ans += ask(u[j].c);
    }
    for (int t = l; t < i; t++) add(u[t].c, -u[t].cnt);                  // 4) 回滚 BIT
}
int main() {
    scanf("%d%d", &n, &k);
    for (int i = 1; i <= n; i++) scanf("%d%d%d", &e[i].a, &e[i].b, &e[i].c);
    sort(e + 1, e + n + 1, cmpA);
    for (int i = 1, t = 0; i <= n; i++) {              // 去重: 相同三元组合并计数
        t++;
        if (i == n || !same(e[i], e[i + 1])) { u[++m] = e[i], u[m].cnt = t, u[m].ans = 0, t = 0; }
    }
    cdq(1, m);
    for (int i = 1; i <= m; i++) res[u[i].ans + u[i].cnt - 1] += u[i].cnt;
    for (int i = 0; i < n; i++) printf("%d\n", res[i]);
}

```

整体二分（简述）：把「多次询问第 k 小」放一起二分。递归 `solve(l, r, Q)` 取 `mid`，把值域 `<= mid` 的数插入 BIT；对每个询问查区间计数 `t`，`k <= t` 分到左半，否则 `k -= t` 分到右半，回溯时撤销 BIT。总复杂度 `O((n + q) log n log V)`。

```cpp

// 整体二分核心(区间第 k 小). 事件: type=1 在 id 位置插入值 l; type=2 询问 [l,r] 第 k 小
// struct Q { int l, r, k, id, type; } q[N*2], q1[N*2], q2[N*2];
// solve(l, r, ql, qr):  l==r 时 ans[q[i].id] = l 并返回;  否则 mid = (l+r)>>1, c1 = c2 = 0;
//   for i in [ql, qr]:
//     type==1: q[i].l <= mid ? (add(q[i].id, 1), q1[++c1] = q[i]) : q2[++c2] = q[i];
//     否则:     x = sum(q[i].r) - sum(q[i].l - 1); q[i].k <= x ? q1[++c1] = q[i] : (q[i].k -= x, q2[++c2] = q[i]);
//   撤销: for i in [1, c1] 若 q1[i].type == 1 则 add(q1[i].id, -1);
//   归位: q[ql..] = q1[1..c1], q[ql+c1..] = q2[1..c2];  递归 solve(l, mid, ql, ql+c1-1), solve(mid+1, r, ql+c1, qr);

```

```cpp
// 归并排序求逆序对. O(n log n)
#include <bits/stdc++.h>
using namespace std;
const int N = 5e5 + 5;
int n, a[N], t[N]; long long cnt = 0;
void msort(int l, int r) {                 // 区间 [l, r)
    if (r - l <= 1) return;
    int m = (l + r) >> 1;
    msort(l, m), msort(m, r);
    int i = l, j = m, k = l;
    while (i < m && j < r) {
        if (a[i] <= a[j]) t[k++] = a[i++];          // 取等号放左边 => 统计严格逆序对
        else t[k++] = a[j++], cnt += m - i;         // 左边剩余 m-i 个都比 a[j] 大
    }
    while (i < m) t[k++] = a[i++];
    while (j < r) t[k++] = a[j++];
    for (int x = l; x < r; x++) a[x] = t[x];
}
int main() {
    scanf("%d", &n);
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    msort(0, n), printf("%lld\n", cnt);
}

```

> ⚠️ CDQ 里 BIT 回滚必须 `for (int t = l; t < i; t++)`，只撤销真正插入过的；漏回滚会让下一层统计翻倍。逆序对用 `long long`（n=5e5 时约 1.25e11），累加写 `cnt += m - i` 而非 `cnt++`。
#### 10. 位运算技巧

```cpp

// 位运算速查. 全部 O(1)
int lowbit(int x) { return x & -x; }                 // 最低位 1 及其后的 0
bool isPow2(int x) { return x > 0 && !(x & (x - 1)); }
// 枚举 mask 的所有非空子集(总 O(3^n)): for (int s = mask; s; s = (s - 1) & mask) { ... }
// 含空集: do { ... } while (s = (s - 1) & mask);
__builtin_popcount(x) / __builtin_popcountll(x);   // 1 的个数(unsigned int / unsigned long long)
__builtin_clz(x) / __builtin_ctz(x);               // 前导 0 / 末尾 0 个数, 均要求 x != 0
__builtin_parity(x) / __builtin_ffs(x);            // popcount 奇偶 / 最低位 1 的下标 + 1
// 32 位下 x 的最高位下标 = 31 - __builtin_clz(x)
int popcnt(unsigned x) {   // 手写 popcount(编译器不认 __builtin 时)
    x = x - ((x >> 1) & 0x55555555u), x = (x & 0x33333333u) + ((x >> 2) & 0x33333333u);
    return (int)(((x + (x >> 4)) & 0x0f0f0f0fu) * 0x01010101u >> 24);
}
// bitset 压位: 01 背包可达性 f |= f << w, 每次 O(N/64), 比 bool DP 快 64 倍
//   bitset<N> f; f[0] = 1; f.count() 为 O(N/64);
//   f._Find_first() / f._Find_next(p) 为 libstdc++ 扩展(g++ 可用)

```

> ⚠️ `x == 0` 时 `__builtin_clz / ctz / ffs` 行为未定义，必须先特判。`bitset<N>` 的 N 必须是编译期常量，过大（> 1e8 位）会 MLE；`<<` / `>>` 是逻辑移位，做背包要先截断上限。
#### 11. 卡常与优化
| 手段 | 说明 | 收益 |
| --- | --- | --- |
| `-O2` | 考场默认开启；本地务必用 `g++ -O2 -std=c++17` 复现 | 巨大，先确认这个 |
| `inline` | 小函数加 `inline`（类内成员函数默认内联）；大函数加了没用 | 小 |
| `register` | C++17 已弃用，仅作提示，不要指望 | 无 |
| 快读快写 | `fread` / `getchar_unlocked` 整块读写，比 `cin` 快 3~10 倍 | 大（IO 密集） |
| 减少取模 | 能只在最后取模就只在最后取模；`%` 比加法慢 10~20 倍 | 中~大 |
| 数组维度顺序 | 多维数组把「最内层循环对应的维度」放最后一维，保证连续访问 | 大 |
| cache 友好 | 循环嵌套顺序与内存布局一致；大矩阵用分块（blocking） | 大 |
| 循环展开 | 手动展开 2~4 次或 `#pragma GCC unroll`；现代编译器常自动做 | 小~中 |
| `memset` / `vector` | `memset` 按字节填充(1e7 个 int 约 10ms), 别在循环里反复清；`v.reserve(n)` 避免扩容拷贝 | 视情况 |

```cpp

// 快读 / 快写: 比 cin(+sync_with_stdio) 快 3~10 倍; 数据极大时改用 fread 整块读
inline int rd() {
    int x = 0, f = 1, c = getchar_unlocked();
    while (c < '0' || c > '9') { if (c == '-') f = -1; c = getchar_unlocked(); }
    while (c >= '0' && c <= '9') x = x * 10 + (c - '0'), c = getchar_unlocked();
    return x * f;
}
// 快写: 转十进制入栈后 putchar_unlocked; 模板化把 int 换成 template <class T>
// getchar_unlocked / putchar_unlocked 是 POSIX 扩展, Linux g++ 可直接用; 超大输入改 fread 整块读

```

> ⚠️ cache 友好要点：最内层循环访问的应是「最后一维下标连续变化」的数组。反例 `c[i][j] += a[i][k]*b[k][j]` 中 `b[k][j]` 步长为 N，每次 cache miss；交换 j / k 循环并把 `a[i][k]` 提到外层即可。
> ⚠️ `-O2` 下不要依赖未定义行为（有符号溢出、越界、未初始化变量），本地跑对、交上去挂多半是 UB 被优化掉了。CCF 评测**把所有声明的全局数组都算进内存占用**（不像多数 OJ 只算实际使用的部分），别随手开 `int a[100000000]`。`memset(a, 0x3f, sizeof a)` 得 `0x3f3f3f3f ≈ 1.06e9`，两两相加不溢出 int；`memset(a, 0x7f, ...)` 得 `0x7f7f7f7f ≈ 2.14e9`，相加必溢出。
#### 12. 对拍 / 调试 / 数据生成器
Linux 版（存为 `duipai.sh`，同目录放 `gen.cpp / std.cpp / my.cpp`，执行 `bash duipai.sh`）：

```bash

#!/bin/bash
g++ -O2 -std=c++17 -o gen gen.cpp && g++ -O2 -std=c++17 -o std std.cpp && g++ -O2 -std=c++17 -o my my.cpp || exit 1
for ((i = 1; ; i++)); do
  ./gen > in.txt; ./std < in.txt > out1.txt; ./my < in.txt > out2.txt
  if ! diff -q out1.txt out2.txt > /dev/null; then
    echo "WA on test $i"; echo "-- in --"; cat in.txt
    echo "-- std --"; cat out1.txt; echo "-- my --"; cat out2.txt
    break
  fi
  echo "AC $i"
done

```

Windows 版（存为 `duipai.bat`，同目录放 `gen.exe / std.exe / my.exe`，双击运行）：

```bat

@echo off
for /l %%i in (1,1,100000) do (
    gen.exe > in.txt
    std.exe < in.txt > out1.txt
    my.exe  < in.txt > out2.txt
    fc out1.txt out2.txt > nul
    if errorlevel 1 (
        echo WA on test %%i
        type in.txt & echo -- std -- & type out1.txt & echo -- my -- & type out2.txt
        pause & exit /b
    )
    echo AC %%i
)

```

```cpp
// gen.cpp: 随机数据生成器(时间种子保证每次不同, 也支持命令行固定种子复现)
#include <bits/stdc++.h>
using namespace std;
mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
long long rnd(long long l, long long r) { return l + (long long)(rng() % (r - l + 1)); }
int main(int argc, char** argv) {
    if (argc > 1) rng.seed((unsigned long long)atoll(argv[1]));
    int n = (int)rnd(1, 10); printf("%d\n", n);
    for (int i = 0; i < n; i++) printf("%lld %lld\n", rnd(-10, 10), rnd(-10, 10));
}
// 数据设计四件套: 1 极小值(n=1,全 0,全负数)  2 极大值(卡上限)  3 纯随机  4 特殊构造(全相等/有序/全共线/链)

```

调试技巧：本地编译 `g++ -std=c++17 -O2 -Wall -Wextra -Wshadow -g a.cpp -o a`；查越界 / 溢出加 `-fsanitize=address,undefined`（慢 2~5 倍，时限紧时别用）；查 STL 误用加 `-D_GLIBCXX_DEBUG`；Windows 递归爆栈加 `-Wl,--stack=268435456`（256MB），Linux 用 `ulimit -s unlimited`；调试信息一律输出到 `cerr`（不会被 OJ 当作答案）；`assert` 在 `-DNDEBUG` 下被完全移除，且不要写 `assert(f(i++))` 这类带副作用的断言。
> ⚠️ 对拍里的 `std` 必须是**你自己写的暴力**，不能抄题解（否则一起错）；暴力正确性先用「极小数据手算」验证。`diff` 对行尾空格 / 换行敏感，Windows 造的数据在 Linux 上跑可能因 `\r\n` 全部 WA，造数据用 `printf` 而非 `echo`。
#### 13. WA / TLE / RE / MLE 原因速查表
| 症状 | 常见原因 | 快速排查 |
| --- | --- | --- |
| WA | 没开 `long long`（和 ≥ 2^31、乘积、累加） | 参与运算的量统一 `long long` |
| WA | 多组数据没清空数组 / 没重置全局变量 | 每组开头 `memset` 或重建 `vector` |
| WA | `sync_with_stdio(false)` 后又混用 `scanf/printf` 与 `cin/cout` | 二选一，绝不混用 |
| WA | 读入优化没处理负数；`%d` 读了 `long long` | 手测负数样例 |
| WA | 边界漏判：n=1、全相等、空集、除零 | 专门造这四类数据 |
| WA | 比较函数不满足严格弱序（`return a <= b`、`(x&1)^(a<b)`） | 检查 `a < a` 必须为 false |
| WA | 浮点用 `==` 比较或 eps 不当；取模后忘记处理负数 | 改用 `sgn` / 尽量整数化；`(x % mod + mod) % mod` |
| WA | DP / 递归顺序反了，循环边界 `<=` 与 `<` 混用 | 手推小样例 |
| WA | 宏没加括号：`#define sq(x) x*x` | 宏参数全加括号，优先 `inline` 函数 |
| TLE | 死循环 / 分治没判边界导致无限递归 | 加深度计数打印 |
| TLE | 宏写 `#define max(x,y) ((x)>(y)?(x):(y))`，函数被求值 2~3 次 | 改用 `std::max` |
| TLE | 线段树 / DFS 查询没剪枝，退化成 O(n) | 检查递归出口与剪枝条件 |
| TLE | `std::string` 用 `a = a + b` 而非 `a += b`；循环里反复调用 `strlen` 等 O(n) 函数 | 用 `+=`；提到循环外 |
| TLE | 常数太大：`cin` 未加速、用 `map` 代替 `unordered_map`、频繁取模 | 按第 11 节逐条替换 |
| RE | 数组开小 / 下标越界（线段树 4n、邻接表 2m） | 本地开 `-fsanitize=address` |
| RE | 递归太深爆栈；除以 0、对 0 取模；`vector` / `stack` 下标越界、迭代器失效 | Windows `-Wl,--stack=`、Linux `ulimit -s` 或改迭代；特判；加 `-D_GLIBCXX_DEBUG` |
| RE | 提交时没删文件操作（CCF 环境无写权限） | 注释掉 `freopen` |
| MLE | 数组过大 | 算一遍 `sizeof`：1e7 个 int = 40MB |
| MLE | 全局静态数组全量计入（CCF 评测特点） | 只申请真正需要的，或改 `vector` 按需分配 |
| MLE | 递归 / `vector` 反复扩容且不释放 | `reserve` + 复用容器 |
| 格式错 | 多输出空格 / 换行、大小写、`%.2f` 与 `%.2lf` | 严格对照题面输出格式 |
> ⚠️ CSP 按测试点给分：T3/T4 写不出正解时优先交暴力 / 骗分版本（`n <= 20` 枚举、`n <= 1000` 的 O(n^2)），别交空文件。
> ⚠️ 最后 20 分钟固定动作：① 关掉所有调试输出 ② 删掉 `freopen` ③ 把大样例再跑一遍 ④ 确认 5 道题都提交过一次。


## 第 07 章 CCF-CSP 考情分析与应考策略

> 本章所有事实性结论均给出可访问来源。凡"社区整理"（非 CCF 官方）的数据均已注明；确实查不到的写"未检索到可靠来源"，未能证实的写「（待验证）」。
>
> ⚠️ **先纠正一个流传很广的错误**：CSP 专业级认证的考试时长是 **4 小时（240 分钟）**，不是 5 小时。CCF 官方报名通知写的是"考试时间：13:30 - 17:30"，《CCF 软件能力认证标准》写的是"考试时间为 240 分钟"。

### 7.1 考试结构（CSP 专业级认证）

#### 7.1.1 官方硬事实

| 项目 | 官方规定 |
|---|---|
| 全称 | CCF 计算机软件能力认证（Certified Software Professional，CSP），即俗称的"专业级" |
| 题量与分值 | 共 5 道题，每题 100 分，总分 500 分 |
| 时长 | 240 分钟（4 小时）；近年场次为考试日 13:30 - 17:30 |
| 形式 | 全部上机编程；黑盒测试，程序在限定时间空间内通过给定数据即得分 |
| 支持语言 | C/C++、Java、Python（报名可选 ALL，不同题目可用不同语言） |
| 命题评测 | 由 CCF 统一命题、统一评测 |
| 举办频率 | 每年 3 次左右（3 月 / 5-6 月 / 9 月；2025 年另有 12 月场） |
| 费用 | 个人报名：CCF 会员 400 元 / 非会员 600 元；校内团报最低 200 元 |
| 模拟练习 | 报名成功后可获 1 个兑换码，兑换 1 套往期真题在线模拟评测 |

来源：[第43次CCF CSP认证（2026年9月13日）报名通知](https://www.cspro.org/cms/show.action?code=jumpnewstemplate&siteid=100000&channelid=0000000103&newsid=1cc1a98caa94481a8a6473ca339230a4) ｜ [CCF软件能力认证标准](https://www.cspro.org/cms/show.action?code=jumpnewstemplate&siteid=100000&channelid=0000000107&newsid=62ebd5ce75b54c56a04332c97705f421)

#### 7.1.2 官方场次与题目前缀对照表（2022 - 2026）

题目前缀 = 认证年月，例如 202409-1 表示 2024 年 9 月场第 1 题。日期一列全部来自 CCF 官方报名通知标题；第 41 - 43 次的题目前缀按同一规则推算（该三次认证的题目在撰写时尚未公开）。

| 次数 | 日期 | 前缀 | 次数 | 日期 | 前缀 |
|---|---|---|---|---|---|
| 第 25 次 | 2022-03-20 | 202203 | 第 34 次 | 2024-06-02 | 202406 |
| 第 26 次 | 2022-06-12 | 202206 | 第 35 次 | 2024-09-22 | 202409 |
| 第 27 次 | 2022-09-18 | 202209 | 第 36 次 | 2024-12-08 | 202412 |
| 第 28 次 | 2022-12-18 | 202212 | 第 37 次 | 2025-03-30 | 202503 |
| 第 29 次 | 2023-03-19 | 202303 | 第 38 次 | 2025-06-08 | 202506 |
| 第 30 次 | 2023-05-28 | 202305 | 第 39 次 | 2025-09-21 | 202509 |
| 第 31 次 | 2023-09-17 | 202309 | 第 40 次 | 2025-12-07 | 202512 |
| 第 32 次 | 2023-12-10 | 202312 | 第 41 次 | 2026-03-29 | 202603 |
| 第 33 次 | 2024-03-31 | 202403 | 第 42 次 | 2026-05-31 | 202605 |
| 第 17 次 | 2019-09-15 | 201909 | 第 43 次 | 2026-09-13 | 202609 |
| 第 18 次 | 2019-12-15 | 201912 | | | |

来源：[CCF CSP 认证通知公告（列表页，翻页参数 pageNo=2~7）](https://www.cspro.org/cms/show.action?code=jumpchanneltemplate&siteid=100000&channelid=0000000103)

#### 7.1.3 分数到底值多少（200 / 300 / 400）

- **200 分**：CCF 官方口径 —— "每年 CSP 高分考生（200 分及以上）均可报名参加 CCSP 竞赛"。
- **300 分**：社区与高校普遍认可的"有用线"：多所高校将其用于保研加分、研究生复试机试折算（社区经验称北航、人大等可用 CSP 成绩抵夏令营机试，通常要求 300 分以上）。
- **400 分以上 / 满分**：官方新闻通报的全国前列水平（第 30 次认证全国第四 450 分，全场仅 1 人满分）。
- ⚠️ **专业级 CSP 没有官方"一等 / 二等 / 三等"合格线**。等级名称规范只针对 CSP-J/S（非专业级），且 CCF 2026 年公告明确 CSP-J/S"不设置一等奖、二等奖、三等奖"。别把 CSP-J/S 的等级和 CSP 专业级的分数混为一谈。

来源：[CSP - 中国计算机学会](https://www.ccf.org.cn/CCF_BC/activities/csp/) ｜ [CSP CCF认证介绍 & 备考建议](https://blog.csdn.net/Morishima04/article/details/143726288) ｜ [关于CCF CSP-J/S认证等级名称规范的公告](https://www.noi.cn/xw/2026-09-09/930554.shtml)

#### 7.1.4 评测与提交细节

- 时间 / 空间限制：历年题面常见 1.0 s / 256 MB（例：201312-1）。
- 评测机 C++ 标准：社区题解作者标注为 C++14（"评测机标准"）。本地用 C++17 写没问题，但**避免使用 C++17 独有特性**（结构化绑定、if constexpr、std::optional 等）——（待验证，请以考场实际编译参数为准）。
- 赛制：OI 制，无实时榜单、无罚时；提交后按通过的测试点给分（部分分）。
- 关于"多次提交取最高分"：社区广泛流传（"多次刷分取最高"），但 CCF 公开页面未检索到明确条文 ——（待验证）。考前请在官方模拟系统上实测该规则，规则确认前按 7.5.4 的保守策略提交。

来源：[CCF-CSP认证介绍 & 备考建议](https://blog.csdn.net/Morishima04/article/details/143726288) ｜ [CCF-CSP认证考试真题（含题解和c++代码）](https://blog.csdn.net/qq_45123552/article/details/135997410) ｜ [CCF-CSP认证知识要求](https://blog.csdn.net/spadgerz/article/details/52673804)

### 7.2 CSP-J/S（非专业级）：第一轮与第二轮

| 项目 | 官方规定 |
|---|---|
| 定位 | 面向社会非专业人士（以青少年为主）的**非专业级**认证，分 CSP-J（入门组）与 CSP-S（提高组） |
| 阶段 | 分第一轮和第二轮；报名第一轮成绩优异者方可进入第二轮；两轮各设 J / S 两组 |
| 形式 | 第一轮为集中笔试（经 CCF 批准可以机试方式认证）；第二轮为现场集中上机 |
| 第二轮题量 | 每次认证有 **4 个题目** |
| 报名资格 | 2026 年 9 月 1 日（不含）前须满 12 周岁，且须网上注册报名 |
| 认证点 | 第一轮认证点每点不少于 20 人；第二轮认证点每省一个 |
| 等级名称 | 不设一等奖、二等奖、三等奖（CCF 2026 年公告规范） |
| 第一轮题型 | 单项选择 + 阅读程序 + 完善程序（来自社区对历年第一轮真题的解析，官方通知未列明分值 → 待验证） |

与专业级 CSP 的区别（别搞混）：

- **CSP 专业级**：5 题 / 500 分 / 4 小时，面向大学生与社会人士，是保研、考研复试、企业内推的依据。
- **CSP-J/S**：2 轮制 / 第二轮 4 题，面向青少年，与 NOIP、NOI 体系衔接。

来源：[CCF关于举办CSP-J/S 2026的通知](https://www.noi.cn/xw/2026-07-06/908155.shtml) ｜ [关于CCF CSP-J/S认证等级名称规范的公告](https://www.noi.cn/xw/2026-09-09/930554.shtml)

### 7.3 历年真题考点分布表

难度标记为按社区题解与题目定位给出的经验判断（易 / 中 / 难 / 极难）。

#### 7.3.1 第 25 - 28 次（2022 年）

| 题号 | 题目名 | 核心考点 | 难度 |
|---|---|---|---|
| 202203-1 | 未初始化警告 | 模拟 / 哈希计数 | 易 |
| 202203-2 | 出行计划 | 差分 / 前缀和 | 易 |
| 202203-3 | 计算资源调度器 | 大模拟 / STL | 中 |
| 202203-4 | 通信系统管理 | 数据结构综合 | 难 |
| 202203-5 | 博弈论与石子合并 | 博弈 / 贪心 / DP | 极难 |
| 202206-1 | 归一化处理 | 模拟 / 数学 | 易 |
| 202206-2 | 寻宝！大冒险！ | 哈希 / 枚举 | 易 |
| 202206-3 | 角色授权 | 大模拟 / 哈希 / 集合 | 中 |
| 202206-4 | 光线追踪 | 计算几何 / 数据结构 | 难 |
| 202206-5 | PS无限版 | 数据结构综合 | 极难 |
| 202209-* | 未检索到可靠来源 | - | - |
| 202212-1 | 现值计算 | 循环 / 浮点 | 易 |
| 202212-2 | 训练计划 | 拓扑序 / DP | 易 |
| 202212-3 | JPEG 解码 | 大模拟 / 矩阵 | 中 |
| 202212-4 | 聚集方差 | 启发式合并 / set | 难 |
| 202212-5 | 星际网络 | 线段树建图 / 高精度 | 极难 |

来源：[CCF-CSP历年真题大全附题解（CPP11）](https://blog.csdn.net/qq_41823101/article/details/126153808) ｜ [CCF-CSP认证考试真题（含题解和c++代码）](https://blog.csdn.net/qq_45123552/article/details/135997410)

#### 7.3.2 第 29 - 34 次（2023 年 - 2024 上半年）

| 题号 | 题目名 | 核心考点 | 难度 |
|---|---|---|---|
| 202303-1 | 田地丈量 | 循环 / 矩形面积交 | 易 |
| 202303-2 | 垦田计划 | 二分答案 | 易 |
| 202303-3 | LDAP | 递归 / bitset | 中 |
| 202303-4 | 星际网络II | 线段树 / 离散化 | 难 |
| 202303-5 | 施肥 | 分治 / 线段树 / 树状数组 | 极难 |
| 202305-1 | 重复局面 | STL（string、map） | 易 |
| 202305-2 | 矩阵运算 | 矩阵乘法（运算顺序优化） | 易 |
| 202305-3 | 解压缩 | 字符串处理 / 位运算 | 中 |
| 202305-4 | 电力网络 | 图论建模 / 暴力枚举 | 难 |
| 202305-5 | 闪耀巡航 | 最短路 / 状压 DP | 极难 |
| 202309-1 | 坐标变换（其一） | 循环 / 累加 | 易 |
| 202309-2 | 坐标变换（其二） | 前缀积 / 前缀和 | 易 |
| 202309-3 | 梯度求解 | 后缀表达式 / 表达式求值 | 中 |
| 202309-4 | 阴阳龙 | 数据结构（set） | 难 |
| 202309-5 | 阻击 | 动态 DP / 树剖 / 线段树 | 极难 |
| 202312-1 | 仓库规划 | 循环枚举 | 易 |
| 202312-2 | 因子化简 | 质因数分解 | 易 |
| 202312-3 | 树上搜索 | 模拟 / DFS | 中 |
| 202312-4 | 宝藏 | 分块 / 前缀（矩阵乘法） | 难 |
| 202312-5 | 彩色路径 | 状压 DP + 折半 | 极难 |
| 202403-1 | 词频统计 | 循环计数 | 易 |
| 202403-2 | 相似度计算 | 集合交并 | 易 |
| 202403-3 | 化学方程式配平 | 高斯消元 | 中 |
| 202403-4 | 十滴水 | set/map + 优先队列（模拟） | 难 |
| 202403-5 | 文件夹合并 | 链表 / DFS 序 / 线段树 | 难 |
| 202406-1 | 矩阵重塑（其一） | 循环 / 数组 | 易 |
| 202406-2 | 矩阵重塑（其二） | 矩阵 / 循环 | 易 |
| 202406-3 | 文本分词 | 大模拟 / STL / 优先队列 | 中 |
| 202406-4 | 货物调度 | 贪心 / 背包 | 难 |
| 202406-5 | 哥德尔机 | 未检索到明确考点标注 | 极难 |

来源：[CCF-CSP认证考试真题（含题解和c++代码）](https://blog.csdn.net/qq_45123552/article/details/135997410) ｜ [CCF CSP认证 第29次至第40次第一题A题代码](https://blog.csdn.net/weixin_54867159/article/details/159417816)

#### 7.3.3 第 35 - 40 次（2024 下半年 - 2025 年，社区整理，完整性有限）

| 题号 | 题目名 | 核心考点 | 难度 |
|---|---|---|---|
| 202409-1 | 密码 | 字符串模拟 / 分类讨论 | 易 |
| 202409-2 | 字符串变换 | 字符串 / 哈希 / 变换周期预处理 | 易-中 |
| 202409-3 | 补丁应用 | 字符串解析 / 模拟 | 中 |
| 202409-4 / 5 | 未检索到可靠来源 | - | - |
| 202412-1 | 移动 | 模拟（网格移动 / 边界判断） | 易 |
| 202412-2 | 梦境巡查 | 前缀和 + 后缀最值 / 贪心 | 中 |
| 202412-3 / 4 / 5 | 未检索到可靠来源 | - | - |
| 202503-1 | 数值积分 | 循环求和 | 易 |
| 202503-2 | 机器人饲养指南 | 完全背包 | 易-中 |
| 202503-3 | 模板展开 | 字符串 / 递归 + 记忆化（取模防溢出） | 中-难 |
| 202503-4 | 集体锻炼 | 数学（gcd） | 难 |
| 202503-5 | 未检索到可靠来源 | - | - |
| 202506-1 | 正态分布 | 数学 / 浮点转整数查表 | 易 |
| 202506-2 | 机器人复健指南 | BFS / DFS 网格计数 | 易-中 |
| 202506-3 | 消息解码 | 大模拟 / 位运算 / 哈希 | 中 |
| 202506-4 / 5 | 未检索到可靠来源 | - | - |
| 202509-1 | 蒙特卡洛 | 模拟 / 浮点 | 易 |
| 202509-2 | 水印检查 | 二维差分 / 阈值区间 | 中 |
| 202509-3 | HTTP 头信息 | 大模拟 / Huffman 树 / 进制转换 | 中 |
| 202509-4 / 5 | 未检索到可靠来源 | - | - |
| 202512-1 | 集合 | 模拟 / 哈希 | 易 |
| 202512-2 | 数字变换 | 逆向查表优化 | 易-中 |
| 202512-3 | 图片解码 | 坐标映射 / 懒旋转 | 中 |
| 202512-4 | C形阵 | 暴力 + set 判重 | 难 |
| 202512-5 | 数据抢修 | DFS 回溯 + 剪枝 | 难 |

来源：[第37次CCF计算机软件能力认证(CSP)＜题解＞](https://blog.csdn.net/m0_74045028/article/details/161457771) ｜ [CCF CSP认证 第29次至第40次第一题A题代码](https://blog.csdn.net/weixin_54867159/article/details/159417816) ｜ [CCF-CSP第38次认证第一题——正态分布](https://blog.csdn.net/2501_92983269/article/details/155617780)

#### 7.3.4 更早场次（2019 - 2021，仅核实到部分题目）

| 场次 | 已核实的题目名 | 备注 |
|---|---|---|
| 201909（第 17 次） | 小明种苹果 | 序列处理 |
| 201912（第 18 次） | 报数、回收站选址 | 模拟 / 序列处理 |
| 202009 | 称检测点查询、风险人群筛查 | 来自检索摘要，未逐一打开原文（待验证） |
| 202012 | 期末预测之安全指数、期末预测之最佳阈值、带配额的文件系统、食材运输、星际旅行 | 来自检索摘要（待验证） |
| 202104（第 22 次） | 灰度直方图、邻域均值 | 计数 / 二维前缀和 |

来源：[CCF-CSP认证历年真题解（100分）](https://blog.csdn.net/wu_xin1/article/details/100181379) ｜ [CCF-CSP认证考试真题（含题解和c++代码）](https://blog.csdn.net/qq_45123552/article/details/135997410)

### 7.4 题号与难度规律（基于 7.3 的真题统计）

统计口径：7.3 中已核实题名的第 25 ~ 40 次共 16 场。

| 题号 | 已出现的主要考点（场次数） | 结论 |
|---|---|---|
| T1 | 循环 / 枚举 / 数组 8；字符串与模拟 3；简单数学与浮点 2 | 20 - 50 行，O(n) 或 O(n log n)，读题仔细就能满分 |
| T2 | 前缀和 / 差分 4；哈希与集合 2；二分答案 1；背包等基础 DP 1；数论 1；BFS / 网格 1；拓扑序 1 | 一道"标准模板题"，套板子即可满分 |
| T3 | 大模拟 / 长题干字符串处理 11 / 11 场 | 唯一稳定规律：**T3 = 大模拟**，细节远重于算法 |
| T4 | 线段树 / 分块 / set / 优先队列等数据结构 5；图论 2；贪心 + 背包 1；数学 1 | 需要真算法，但暴力往往能拿 30 - 60 分 |
| T5 | 状压 DP、动态 DP、树链剖分、线段树建图、搜索剪枝 | 全场最难，目标是 20 - 50 分部分分 |

由此得到的五条可操作结论：

1. **T1 + T2 = 200 分是保底线**。这两题几乎不涉及高级算法，丢分只可能丢在边界与格式上。
2. **T3 决定 300 分线**。16 场里有 11 场 T3 是大模拟 / 解析类，没有一场考高级算法。它考的是"把题读懂 + 细节不出 bug"。
3. **T4 是 400 分线的分水岭**。常见组合是"线段树 / 树状数组 / 平衡树 + 离散化"或"图上 DP / 最短路"。
4. **T5 的正解通常超纲**（动态 DP、树链剖分、折半状压），把目标定为"暴力 + 特殊性质子任务"更划算。
5. **T3 的核心形态是"字符串 + 层次结构"**：表达式求值（202309-3 梯度求解、202503-3 模板展开）、编解码（202305-3 解压缩、202212-3 JPEG 解码、202506-3 消息解码、202509-3 HTTP 头）、文件系统与权限（202012-3 带配额的文件系统、202206-3 角色授权）。

### 7.5 分数策略与时间分配

#### 7.5.1 240 分钟时间预算模板

| 时段 | 分钟 | 任务 | 目标分 |
|---|---|---|---|
| 0:00 - 0:10 | 10 | 通读 5 题，圈出数据范围与"评测用例规模与约定"，判断 T3 题干长度、T4/T5 可做性 | - |
| 0:10 - 0:35 | 25 | T1 正解 + 自造边界（0、1、极值、重复） | 100 |
| 0:35 - 1:15 | 40 | T2 正解 | 100 |
| 1:15 - 2:20 | 65 | T3 大模拟：先搭"数据结构 + 输入解析"，跑通样例再逐条补规则 | 60 - 100 |
| 2:20 - 3:20 | 60 | T4：先写暴力 / 子任务档保证有分，再想正解 | 30 - 100 |
| 3:20 - 3:45 | 25 | T5：暴力 + 特殊性质子任务 | 20 - 40 |
| 3:45 - 4:00 | 15 | 回查：重读题面限制、检查越界 / 多测清空、确认语言与题目对应 | - |

> ⚠️ 这张表的核心是 **T3 不允许超过 65 分钟**。最常见的崩盘方式是 T3 卡 2 小时 → T4 / T5 全丢，总分停在 200。T3 写不完就先交一个"能过样例 + 部分子任务"的版本走人。

#### 7.5.2 分段程序（一题多档，按子任务拿分）

CSP 每题都给出"评测用例规模与约定"，按数据范围分档写多个解法，是最稳的得分方式：同一份代码内部按 n 的大小选择算法。

```cpp

#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int N = 100005;
int n, m;
ll a[N], pre[N];
// 档 1：n <= 2000 暴力 O(n^2) —— 通常能吃到 30~60 分
ll solveBrute(){
    ll r = 0;
    for (int i = 1; i <= n; i++)
        for (int j = i; j <= n; j++){
            ll s = pre[j] - pre[i-1];
            if (s % m == 0) r++;
        }
    return r;
}
// 档 2：正解 O(n log n)
ll solveFull(){
    map<ll,int> c; c[0] = 1;
    ll r = 0;
    for (int i = 1; i <= n; i++){
        ll k = ((pre[i] % m) + m) % m;
        r += c[k]; c[k]++;
    }
    return r;
}
int main(){
    scanf("%d%d", &n, &m);
    for (int i = 1; i <= n; i++){ scanf("%lld", &a[i]); pre[i] = pre[i-1] + a[i]; }
    if (n <= 2000) printf("%lld\n", solveBrute());
    else           printf("%lld\n", solveFull());
    return 0;
}

```

> ⚠️ 提交前把分档阈值调到与题面子任务表一致；不要凭感觉写 n <= 2000。

#### 7.5.3 对拍（写完"正解"后用暴力验证）

三个文件：数据生成器、你的程序、暴力程序，然后循环比对。

```cpp

// gen.cpp —— 数据生成器：g++ -O2 -o gen gen.cpp
#include <bits/stdc++.h>
using namespace std;
int main(int argc, char** argv){
    srand(atoi(argv[1]));
    int n = rand() % 10 + 1, m = rand() % 5 + 1;
    printf("%d %d\n", n, m);
    for (int i = 1; i <= n; i++) printf("%d ", rand() % 20 - 10);
    puts("");
    return 0;
}

```

```cpp

// check.cpp —— 对拍驱动：g++ -O2 -o check check.cpp（Linux 下把 .exe 去掉）
#include <bits/stdc++.h>
using namespace std;
int main(){
    for (int t = 1; t <= 1000; t++){
        system("python3 gen.py > in.txt");   // 或 ./gen
        system("./a < in.txt > out1.txt");   // 你的程序
        system("./b < in.txt > out2.txt");   // 暴力
        if (system("diff out1.txt out2.txt > /dev/null")){
            printf("WA on test %d\n", t);
            return 0;
        }
    }
    puts("all ok");
    return 0;
}

```

考场提示：CSP 考场多为 NOI Linux 环境，python3 与 diff 一般可用；若没有 python3，就用 gen 可执行文件生成数据。

#### 7.5.4 提交策略

> ⚠️ "多次提交取最高分"是社区说法，CCF 公开页面未检索到条文（待验证）。**进考场先在模拟系统上用一道题实测**：先交一版明显错解，再交一版正解，看成绩页最终显示哪个分数。在规则确认之前，按下面保守执行。

1. **只交有把握的版本**：若规则是"以最后一次提交为准"，交一版更差的代码等于直接掉分。
2. **每题先保证有分**：T3 / T4 / T5 先写"能过样例 + 小数据"的暴力，本地验证无误后再交。
3. **利用部分分**：CSP 按测试点给分，一个只处理小数据的暴力常能拿 30 - 60 分。
4. **不做无编译把握的提交**：本地 g++ -O2 -std=c++17 编一遍再交。
5. **确认题目与提交框的对应关系**：交错了题就是 0 分。

#### 7.5.5 什么时候放弃正解

- T5 读完 10 分钟还没有明确算法 → 放弃正解，转暴力 + 子任务。
- T4 卡 40 分钟仍无思路 → 交暴力走人，回头复查 T1 - T3。
- T3 到 65 分钟 → 交当前版本，转 T4。
- 任何一题写完样例却过不了超过 15 分钟 → 换暴力重写（大模拟常见的"越改越乱"）。

### 7.6 高频必备算法清单（按真题实际出现频次分档）

#### 7.6.1 必须掌握（不掌握就拿不到 300 分）

| 算法 / 技巧 | 对应真题 |
|---|---|
| 模拟 + 边界处理 | 全部 T1；202409-1 密码、202412-1 移动 |
| 字符串解析（stringstream、getline、split、进制与位运算） | 202305-3 解压缩、202506-3 消息解码、202509-3 HTTP 头信息、202409-3 补丁应用 |
| STL：vector / map / set / unordered_map / priority_queue | 202305-1 重复局面、202312-3 树上搜索、202403-2 相似度计算 |
| 排序、二分（lower_bound / 二分答案） | 202303-2 垦田计划 |
| 前缀和与差分（一维 & 二维） | 202309-2 坐标变换（其二）、202412-2 梦境巡查、202509-2 水印检查 |
| 递归 / DFS / BFS（含网格搜索） | 202506-2 机器人复健指南、202312-3 树上搜索 |
| 基础 DP（线性、背包） | 202503-2 机器人饲养指南（完全背包） |
| 简单数论（质因数分解、gcd、快速幂、取模） | 202312-2 因子化简、202503-4 集体锻炼 |
| 栈 / 队列 / 表达式求值（后缀表达式） | 202309-3 梯度求解 |
| 矩阵操作 | 202305-2 矩阵运算、202406-1/2 矩阵重塑、202212-3 JPEG 解码 |

#### 7.6.2 应当掌握（冲 400 分）

| 算法 / 技巧 | 对应真题 |
|---|---|
| 树状数组 / 线段树（区间和、区间最值、懒标记） | 202303-4 星际网络II、202403-5 文件夹合并 |
| 离散化 | 202303-4 星际网络II |
| 并查集 | 历年 T4 高频（社区统计） |
| 图论：最短路（Dijkstra）、拓扑排序、建图技巧 | 202212-2 训练计划（拓扑序）、202305-5 闪耀巡航 |
| 高斯消元 | 202403-3 化学方程式配平 |
| 贪心 + 排序 | 202406-4 货物调度 |
| 分块 / 前缀技巧 | 202312-4 宝藏 |
| 启发式合并 / set 维护有序序列 | 202212-4 聚集方差 |
| 位运算 + bitset | 202303-3 LDAP |
| 记忆化搜索（防指数级重复展开） | 202503-3 模板展开 |
| 树形 DP | 202309-5 阻击（48 分档） |

#### 7.6.3 加分项（基本只在 T5 满分档出现）

| 算法 / 技巧 | 对应真题 |
|---|---|
| 状压 DP + 折半枚举（meet in the middle） | 202312-5 彩色路径（100 分档） |
| 动态 DP + 树链剖分 + 广义矩阵乘法 | 202309-5 阻击（100 分档） |
| 线段树优化建图 | 202212-5 星际网络 |
| 分治 + 线段树 / 树状数组 | 202303-5 施肥 |
| 计算几何（射线追踪、坐标变换） | 202206-4 光线追踪 |
| 搜索 + 剪枝（DFS 回溯） | 202512-5 数据抢修 |
| 链表 + DFS 序 + 线段树 | 202403-5 文件夹合并 |

来源：[CCF-CSP认证考试真题（含题解和c++代码）](https://blog.csdn.net/qq_45123552/article/details/135997410) ｜ [第37次CCF计算机软件能力认证(CSP)＜题解＞](https://blog.csdn.net/m0_74045028/article/details/161457771) ｜ [CCF CSP认证 第29次至第40次第一题A题代码](https://blog.csdn.net/weixin_54867159/article/details/159417816)

### 7.7 真题原题与题单链接（均已实测可访问）

| 资源 | 链接 | 说明 |
|---|---|---|
| CCF CSP 官网 | https://www.cspro.org/ | 认证报名、成绩查询、认证指南、常见问题 |
| 官方模拟考试系统（往期真题） | https://sim.csp.thusaac.com/ | 官网"往期真题 / 模拟考试"入口；报名后凭兑换码兑换 1 套真题 |
| CCF 数字图书馆 · CSP 真题解析 | https://dl.ccf.org.cn/albumList/albumSecondary.html?xl=CSP | 官方真题解析资料专辑 |
| CSP-J/S 官方通知（NOI 官网） | https://www.noi.cn/xw/2026-07-06/908155.shtml | 第一轮 / 第二轮规则原文 |
| CSP-J/S 等级名称规范公告 | https://www.noi.cn/xw/2026-09-09/930554.shtml | 明确不设一二三等奖 |
| OI-Wiki（模板总站） | https://oi-wiki.org/ | 各类算法模板与复杂度说明 |
| 洛谷 · CSP-J 真题（示例） | https://www.luogu.com.cn/problem/P11227 | P11227 [CSP-J 2024] 扑克牌；P14357 拼数、P14358 座位、P14360 多边形为 CSP-J 2025 |
| 洛谷 · CSP-J 2024 真题（示例） | https://www.luogu.com.cn/problem/P11228 | P11228 [CSP-J 2024] 地图探险 |

> ⚠️ 洛谷的题单页（/training/...）需要登录 Cookie，直接访问会 401；建议用站内搜索"CCF"或"CSP"找题单。**专业级 CSP 真题主要沉淀在 CCF 官方模拟系统与 CCF 数字图书馆**，洛谷上以 CSP-J/S 真题为主，别把两者当成同一批题。

来源：[CSP - 中国计算机学会](https://www.ccf.org.cn/CCF_BC/activities/csp/) ｜ [CCF关于举办CSP-J/S 2026的通知](https://www.noi.cn/xw/2026-07-06/908155.shtml) ｜ [洛谷 P11227 [CSP-J 2024] 扑克牌](https://www.luogu.com.cn/problem/P11227)

### 7.8 考场易错点清单

> ⚠️ 多测不清空：T2 / T3 常有多组数据，全局数组与容器每次都要清空。
> ⚠️ cin 后接 getline：cin >> n 之后必须 ignore 或再 getline 一次吃掉换行，否则会读到空行（202503-3 模板展开的真实坑）。
> ⚠️ 先看"评测用例规模与约定"：子任务表就是官方给的送分指南，照着它写分档。
> ⚠️ 递归深度：CSP 数据里常出现长度 1e5 的链，DFS 递归会爆栈，改非递归或手写栈。
> ⚠️ 大模拟不要过早优化：先把逻辑写对，再考虑常数与复杂度。
> ⚠️ 输出格式：行末空格、多余换行、浮点保留位数都可能判错。
> ⚠️ 时间 1 s、内存 256 MB 是常态：vector 反复扩容、map 大量插入都可能被卡。
> ⚠️ 取模题：长度或计数要全程取模（202503-3 的 100 分做法就是只存长度并对 1e9+7 取模）。
