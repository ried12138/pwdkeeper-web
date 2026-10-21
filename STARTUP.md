# pwdkeeper-web 启动说明

本项目是一个基于 **Vue 3 + Vite** 的前端项目，配合 wechat 后端服务使用，页面集成了 DeepSeek 聊天机器人。

## 一、环境版本要求

| 工具 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | **>= 18.0.0**（推荐 20.x） | Vite 6 要求 Node.js 18 或更高版本，实测环境为 `v20.18.0` |
| npm | **>= 9.0.0**（推荐 10.x） | 实测环境为 `10.8.2` |

> 检查本地版本：
> ```bash
> node -v
> npm -v
> ```

## 二、主要依赖版本

### 生产依赖（dependencies）
| 依赖 | 版本 |
| --- | --- |
| vue | ^3.5.13 |
| vue-router | ^4.5.0 |
| axios | ^1.8.4 |

### 开发依赖（devDependencies）
| 依赖 | 版本 |
| --- | --- |
| vite | ^6.2.0 |
| @vitejs/plugin-vue | ^5.2.1 |

## 三、启动步骤

### 1. 安装依赖
在项目根目录执行：
```bash
npm install
```

### 2. 启动开发服务器（本地开发调试）
```bash
npm run dev
```
启动后终端会显示本地访问地址，默认：
```
http://localhost:5173
```

### 3. 构建生产环境包
```bash
npm run build
```
构建产物默认输出到 `dist/` 目录。

### 4. 预览生产构建结果
```bash
npm run preview
```
用于在本地预览 `npm run build` 生成的产物。

## 四、可用脚本一览

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（热更新） |
| `npm run build` | 打包构建生产版本 |
| `npm run preview` | 本地预览构建后的产物 |

## 五、常见问题

- **端口被占用**：Vite 默认端口为 `5173`，如被占用会自动尝试下一个可用端口；也可通过 `npm run dev -- --port 3000` 指定端口。
- **Node 版本过低**：若 Node.js 版本低于 18，Vite 6 将无法运行，请升级 Node.js。
- **依赖安装失败**：可尝试清理缓存后重装：
  ```bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```
