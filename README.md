# 飞行棋多人在线游戏

使用 **TypeScript + React** 开发前端，**Node.js + Socket.io** 开发后端的多人在线飞行棋游戏。

## 🎮 功能特性

### 游戏规则
- 4 种颜色（红、蓝、绿、黄），每个颜色 4 个棋子
- 起飞需掷出 6 点
- 踩到对方棋子使其返回基地
- 安全格（★）保护机制
- 棋子沿轨道前进，到达终点获胜

### 游戏功能
- ✅ 创建/加入房间（6 位房间码）
- ✅ 支持 2-4 人同时游戏
- ✅ 满 2 人准备即可开始
- ✅ 轮流掷骰子，掷出 6 点可再掷一次
- ✅ WebSocket 实时同步（骰子点数、棋子位置、当前玩家）
- ✅ 房间内聊天功能
- ✅ 玩家连续 30 秒无操作自动掷骰子
- ✅ 游戏结束显示胜利者
- ✅ 后端维护房间状态

## 📁 项目结构

```
TypeScript-React-/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── models/
│   │   │   ├── Game.ts         # 游戏核心逻辑
│   │   │   └── RoomManager.ts  # 房间管理
│   │   ├── services/
│   │   │   └── GameService.ts  # Socket.io 通信服务
│   │   ├── types/
│   │   │   └── index.ts        # 类型定义
│   │   └── index.ts            # 入口文件
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby.tsx       # 大厅界面
│   │   │   ├── RoomWaiting.tsx # 等待房间
│   │   │   ├── GameRoom.tsx    # 游戏主界面
│   │   │   ├── GameBoard.tsx   # 棋盘组件
│   │   │   ├── Dice.tsx        # 骰子组件
│   │   │   └── Chat.tsx        # 聊天组件
│   │   ├── context/
│   │   │   └── GameContext.tsx # 游戏状态管理
│   │   ├── types/
│   │   │   └── index.ts        # 类型定义
│   │   ├── utils/
│   │   │   └── colorUtils.ts   # 颜色工具
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd backend
npm run dev

# 启动前端 (端口 5173)
cd frontend
npm run dev
```

### 构建生产版本

```bash
# 后端
cd backend
npm run build
npm start

# 前端
cd frontend
npm run build
```

## 🎯 游戏玩法

1. **创建房间**: 输入昵称，选择最大玩家数（2-4人），点击"创建房间"
2. **加入房间**: 输入房间码、昵称，选择可用颜色，点击"加入房间"
3. **准备游戏**: 点击"准备"按钮，等待其他玩家
4. **开始游戏**: 房主（第一个玩家）点击"开始游戏"
5. **游戏进行**:
   - 轮到你时，点击"掷骰子"
   - 掷出 6 点可选择起飞或再掷一次
   - 可移动的棋子会闪烁，点击移动
   - 踩到对方棋子会将其送回基地
   - ★ 标记的是安全格，不会被踩
6. **获胜条件**: 所有棋子到达终点即获胜

## 🔧 技术栈

### 后端
- Node.js
- TypeScript
- Express
- Socket.io
- UUID

### 前端
- React 18
- TypeScript
- Vite
- Socket.io-client
- Tailwind CSS

## 📝 自动掷骰子机制

- 玩家连续 30 秒无操作会自动掷骰子
- 自动掷骰子后会随机选择一个可移动的棋子移动
- 防止游戏因玩家离开而卡死

## 🔒 安全规则

- 安全格位置不会被对方棋子踩踏
- 己方基地和回家轨道上的棋子不会被攻击
- 同一格子上的己方棋子不会互相干扰
