# Hybrid Knowledge Retrieval Multi-Agent

![截图](image/README/1778159435265.png)

基于 `LangGraph` 的混合知识库多代理项目，核心目标是把不同类型的问题交给最合适的代理处理，而不是让单个 Agent 同时做所有事情。

当前项目统一入口文件是 [main.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/main.py)。

## 项目能力

- 应用运维监控：LangSmith
- 通用问答代理：`chat`
- 数据管理代理：`sqler`
- 数据分析代理：`coder`
- 图谱问答代理：`graph_kg`
- 向量检索代理：`vec_kg`
- Supervisor 路由调度
- 事件流输出（values/messages/debug/events）
- 短期记忆（`MemorySaver`）
- 长期记忆（`InMemoryStore`）
- 人机审核（`human_review`）

## 目录结构

- [main.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/main.py)：统一入口与导出
- [app.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/app.py)：CLI、异常分类提示
- [agents.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/agents.py)：Supervisor 与各 Agent 节点
- [streaming.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/streaming.py)：stream / invoke / resume 执行逻辑
- [memory.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/memory.py)：长短期记忆配置
- [hitl.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/hitl.py)：人机审核状态处理
- [config.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/config.py)：模型、数据库、LangSmith 配置
- [seed_data.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/seed_data.py)：SQL 演示数据准备
- [build_graph_offline.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/build_graph_offline.py)：Neo4j 离线建图（规则抽取）
- [ERROR_LOG.md](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/ERROR_LOG.md)：历史报错与修复记录
- [CODEX_RULES.md](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/CODEX_RULES.md)：协作规则

## 环境准备

1. 安装依赖

```bash
pip install -r multi-agent/requirements.txt
```

2. 配置环境变量

   当前代码仅从 `.env.example` 读取配置（`config.py` 中 `load_dotenv(..., override=True)`）。

   修改 `.env.example`中模型、neo4j、milvus、database、langsmith的配置信息。

   `embedding` 使用阿里百炼 OpenAI 兼容接口、LLM 默认使用 DeepSeek。

   3.离线建图

```bash
python build_graph_offline.py
```

## 启动方式

只使用 `main.py` 作为入口。

```bash
python main.py "都有哪些公司在我的数据库中？"
```

```bash
python multi-agent/main.py "帮我根据前10名销售记录id生成销售额柱状图"
```

```bash
python multi-agent/main.py "你还记得我吗？" --thread-id 111 --user-id 8
```

## 角色指令示例

下面这些指令可用于明显触发不同角色能力。

一、体现 `sqler + coder`

1. `帮我根据前10名的 销售记录id，生成对应的销售额柱状图`
2. `根据sales_id使用折线图显示前5名销售的销售总额`

示例：

```bash
python main.py "帮我根据前10名的 销售记录id，生成对应的销售额柱状图"
python main.py "根据sales_id使用折线图显示前5名销售的销售总额"
```

二、体现人机交互（Human-in-the-loop）

进入多轮对话模式

```
python main.py --dialogue --thread-id 102 --user-i
```

`   帮我删除销售id 是 20 的这名销售信息`

示例：

```bash
python main.py "帮我删除销售id 是 20 的这名销售信息" --thread-id 102 --user-id 8
python main.py --inspect-state --thread-id 102 --user-id 8
python multi-agent/main.py --approve --thread-id 102 --user-id 8
```

三、普通 `chat`

`你好，什么是机器学习`

示例：

```bash
python multi-agent/main.py "你好，什么是机器学习"
```

四、宏观、关系型检索用 `graph_kg`

1. `华为技术有限公司与哪些教育机构建立了合作？`
2. `苹果公司开发了什么？`
3. `都有哪些公司在我的数据库中`

示例：

```bash
python main.py "华为技术有限公司与哪些教育机构建立了合作？"
python main.py "苹果公司开发了什么？"
python main.py "都有哪些公司在我的数据库中"
```

五、具体、普通检索用 `vec_kg`

`都有哪些公司在我的数据库中。`

示例：

```bash
python multi-agent/main.py "都有哪些公司在我的数据库中。"
```

## 多轮对话

```
python main.py --dialogue --thread-id 102 --user-id 8
```

## 事件流模式

`values`、`messages`、`debug、events`、`invoke`

示例：

```bash
python multi-agent/main.py "都有哪些公司在我的数据库中？" --stream-mode values
```

```bash
python multi-agent/main.py "都有哪些公司在我的数据库中？" --stream-mode messages
```

```bash
python multi-agent/main.py "都有哪些公司在我的数据库中？" --stream-mode debug
```

```bash
python multi-agent/main.py "都有哪些公司在我的数据库中？" --stream-mode events
```

## 人机审核流程

当 `supervisor` 路由到 `sqler` 或 `coder` 时，会在 `human_review` 前中断，等待人工决策。

查看状态：

```bash
python multi-agent/main.py --inspect-state --thread-id 102 --user-id 8
```

审批通过：

```bash
python multi-agent/main.py --approve --thread-id 102 --user-id 8
```

审批拒绝：

```bash
python multi-agent/main.py --reject --thread-id 102 --user-id 8 --review-note "need explicit approval"
```

恢复线程：

```bash
python multi-agent/main.py --resume --thread-id 102 --user-id 8
```

## 模拟数据生成说明

项目在 [config.py](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/config.py) 中通过 `seed_demo_data()` 自动生成数据库演示数据，这部分是 DB Agent 的基础能力验证数据。

实现特点：

- 使用 `faker` + `random` 生成客户、产品、竞品、销售记录
- 首次启动若 `sales_data` 为空自动写入
- 若已有销售记录则不重复写入
- 默认本地库是 `multi-agent/sales_demo.db`

默认生成规模：

- `FAKE_CUSTOMER_COUNT=50`
- `FAKE_PRODUCT_COUNT=20`
- `FAKE_COMPETITOR_COUNT=10`
- `FAKE_SALES_COUNT=100`

可以在环境变量里改这些数量，方便做轻量测试或压力测试。

## 离线建图

- 优先使用 `TextLoader + RecursiveCharacterTextSplitter + LLMGraphTransformer`
- 若 LLM 转图失败，自动回退到规则抽取导入

执行命令：

```bash
python multi-agent/build_graph_offline.py
```

## Python 调用方式

如果不走 CLI，可以直接在 Python 中导入：

```python
from main import get_app, run, inspect_thread_state, update_review_decision, resume_thread

graph = get_app()
result = run("都有哪些公司在我的数据库中？", stream_mode="values"
```

## 7. 错误提示机制

`app.py` 已内置异常分类提示：

- Provider 余额/额度：DeepSeek / Qwen
- 数据库认证：Neo4j / Milvus

## 注意事项

- `MemorySaver` 和 `InMemoryStore` 适合开发验证，不是持久化生产存储
- 使用新 embedding 模型后，向量库历史向量通常需要重建
- `graph_kg` 依赖 Neo4j 可连通
- `vec_kg` 依赖 Milvus 可连通
- `doc/company.txt` 缺失会导致知识库节点失败

## 多轮对话 & HITL

项目已新增 `run_multi_round_dialogue(graph, config)`，支持：

- 连续多轮输入（输入 `退出` 结束）
- 命中危险写库动作时自动进入人工审核
- 审核阶段会循环要求输入“是/否”

### Python 调用示例

```python
from main import get_app, run_multi_round_dialogue
from memory import build_config

graph = get_app()
config = build_config(thread_id="102", user_id="8")
run_multi_round_dialogue(graph, config)
```

### 示例语句

普通问答：

- `你好，什么是机器学习`

图表任务（sqler 查询 + coder 绘图）：

- `帮我根据前10名的 销售记录id，生成对应的销售额柱状图`
- `根据sales_id使用折线图显示前5名销售的销售总额`

触发人工审核：

- `帮我删除销售id是20的这名销售信息`

审批输入：

- `是`：允许执行
- `否`：拒绝执行

## LLMGraphTransformer 模式说明（已确认）

- 当前主路径是：
  - `LLMGraphTransformer(llm=..., ignore_tool_usage=True)`
- 这表示：
  - 运行时优先走“提示模式（非工具调用）”，不依赖 `with_structured_output`。
  - 若该路径失败，才进入规则抽取兜底（C 方案）。

## 最近补充的功能（此前未完整记录）

- 多轮对话入口：
  - `python main.py --dialogue --thread-id 102 --user-id 8`
- 人机审批优化：
  - 审批输入支持“是/否/同意/拒绝”等中文变体。
  - 拒绝后会返回可读提示，不继续执行危险写库。
- 图表链路稳定化：
  - `sqler` 专注取数，`coder` 专注绘图执行与文件落地。
  - 图表任务路由增加硬约束，减少“只回代码不出图”的情况。

## 最近补充的错误记录入口

- 详细见 [ERROR_LOG.md](/d:/0.Langgraph/LangGraph/LangGraph/multi-agent/ERROR_LOG.md)：
  - 多轮对话未进入/“否”未生效
  - 图表任务未稳定触发 coder
  - `COMPANY_DOC_PATH` 相对路径解析偏差
  - LLMGraphTransformer 当前模式确认

## 知识图谱抽取质量增强

当前离线构图默认走“schema guard + entity resolution + eval harness”流程：

- `kg_schema.py`：限制允许的实体类型和关系类型，避免开放抽取把普通短语当节点。
- `entity_resolution.py`：把简称、英文名、中文全称合并到同一个规范实体。
- `kg_eval.py`：用固定期望关系做回归检查，避免后续改 prompt 或规则时效果退化。
- `gliner_harness.py`：可选 GLiNER NER 增强入口，默认不启用。

推荐先 dry-run 看抽取效果：

```bash
python multi-agent/build_graph_offline.py --dry-run
```

确认效果后导入 Neo4j：

```bash
python multi-agent/build_graph_offline.py
```

如果要清理旧的脏图后重建，需要显式使用：

```bash
python multi-agent/build_graph_offline.py --reset
```

如果已安装 GLiNER，可启用可选实体候选增强：

```bash
pip install gliner
python multi-agent/build_graph_offline.py --dry-run --use-gliner
```

LLMGraphTransformer 现在默认只作为可选预览，不再默认写入主图，避免开放类型污染 Neo4j：

```bash
python multi-agent/build_graph_offline.py --preview-llm
```

## FastAPI + React/Vite 前端

项目新增了前后端工程化骨架：

- `backend/`：FastAPI 后端，封装聊天、审批、线程状态、图谱构建接口。
- `frontend/`：React/Vite 前端，提供聊天工作台、快捷示例、人工审批、状态查看和图谱构建入口。

启动后端：

```bash
cd multi-agent
uvicorn backend.main:app --reload --port 8006
```

启动前端：

```bash
cd frontend
npm install
npm run dev
```

默认前端地址：

```text
http://localhost:5173
```

默认后端地址：

```text
http://localhost:8006
```

当前已提供的 API：

- `GET /api/health`
- `POST /api/chat`
- `GET /api/state`
- `POST /api/review/approve`
- `POST /api/review/reject`
- `POST /api/graph/build`
