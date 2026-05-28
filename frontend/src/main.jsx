import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Bot,
  Building2,
  ChartNoAxesColumn,
  Check,
  DatabaseZap,
  GitBranch,
  Loader2,
  LockKeyhole,
  Network,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import {
  approveReview,
  assetUrl,
  buildGraph,
  getState,
  rejectReview,
  streamChat,
} from "./api";
import "./styles.css";

const examples = [
  "都有哪些公司在我的数据库中？",
  "华为技术有限公司与哪些教育机构建立了合作？",
  "你好，什么是机器学习？",
  "帮我根据前10名的 销售记录id，生成对应的销售额柱状图",
  "帮我删除销售id 是 20 的这名销售信息",
];

const USER_ID = "web-user-1";

function newSession(index) {
  return {
    id: `web-thread-${index}`,
    title: index === 1 ? "默认会话" : `新会话 ${index}`,
    createdAt: Date.now(),
  };
}

function LandingPage({ onEnterConsole }) {
  const capabilities = [
    {
      icon: <Network size={22} />,
      title: "GraphRAG 关系推理",
      text: "把企业、机构、产品、合作关系沉淀成图谱，适合回答宏观关系型问题。",
    },
    {
      icon: <DatabaseZap size={22} />,
      title: "SQL 数据分析",
      text: "用自然语言查询结构化业务数据，并把结果交给 coder 生成可视化图表。",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Human-in-the-loop",
      text: "删除、修改等危险操作不会直接执行，必须经过人工批准或拒绝。",
    },
    {
      icon: <LockKeyhole size={22} />,
      title: "长短期记忆",
      text: "支持线程级短期记忆和用户级长期记忆，让对话具备连续上下文。",
    },
  ];

  const workflow = ["识别意图", "路由 Agent", "调用工具", "人工审批", "生成答案"];

  return (
    <main className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">
          <GitBranch size={24} />
          <span>Multi-Agent Knowledge Platform</span>
        </div>
        <div className="landing-actions">
          <a href="#capabilities">能力</a>
          <a href="#workflow">流程</a>
          <button type="button" className="ghost-button" onClick={onEnterConsole}>
            登录工作台
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            企业多源知识与数据智能协作平台
          </div>
          <h1>让业务用户用自然语言调度知识库、数据库和分析工具。</h1>
          <p>
            面向企业内部知识检索、结构化数据分析和安全任务执行，把 chat、sqler、
            coder、graph_kg、vec_kg 组织成一个可审计、可扩展的多代理工作台。
          </p>
          <div className="hero-actions">
            <button type="button" onClick={onEnterConsole}>
              进入工作台
              <ArrowRight size={18} />
            </button>
            <a className="secondary-link" href="#workflow">
              查看工作流
            </a>
          </div>
          <div className="trust-row">
            <span>适合场景</span>
            <strong>企业知识问答</strong>
            <strong>销售数据分析</strong>
            <strong>安全审批执行</strong>
          </div>
        </div>

        <div className="hero-product">
          <div className="product-topbar">
            <span />
            <span />
            <span />
          </div>
          <div className="product-card active">
            <small>Supervisor</small>
            <strong>问题：华为与哪些教育机构建立了合作？</strong>
            <p>路由到 graph_kg，生成 Cypher 查询并返回关系型答案。</p>
          </div>
          <div className="product-grid">
            <div>
              <ChartNoAxesColumn size={22} />
              <strong>图表生成</strong>
              <p>SQL + coder 自动生成柱状图、折线图。</p>
            </div>
            <div>
              <Users size={22} />
              <strong>人工确认</strong>
              <p>危险写库操作进入审批节点。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-strip">
        <article>
          <strong>5</strong>
          <span>核心代理角色</span>
        </article>
        <article>
          <strong>3</strong>
          <span>知识与数据通道</span>
        </article>
        <article>
          <strong>1</strong>
          <span>统一自然语言入口</span>
        </article>
      </section>

      <section className="capabilities" id="capabilities">
        <div className="section-kicker">核心能力</div>
        <h2>不是普通 Chatbot，而是能调度工具的企业 Agent 系统。</h2>
        <div className="capability-grid">
          {capabilities.map((item) => (
            <article key={item.title}>
              <div>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div>
          <div className="section-kicker">执行轨迹</div>
          <h2>每一次回答，都能看到系统是怎么走到答案的。</h2>
          <p>
            前端不只展示最终回答，还会展示路由结果、工具调用、审批状态和图表产物，方便调试和复盘。
          </p>
        </div>
        <div className="workflow-steps">
          {workflow.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <Building2 size={26} />
        <h2>把企业散落的知识、数据和操作流程，收束到一个智能工作台。</h2>
        <button type="button" onClick={onEnterConsole}>
          立即体验控制台
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}

function App() {
  const [screen, setScreen] = useState("landing");
  const [sessions, setSessions] = useState([newSession(1)]);
  const [activeThreadId, setActiveThreadId] = useState("web-thread-1");
  const [question, setQuestion] = useState(examples[0]);
  const [messagesByThread, setMessagesByThread] = useState({ "web-thread-1": [] });
  const [traceByThread, setTraceByThread] = useState({ "web-thread-1": [] });
  const [stateJson, setStateJson] = useState("");
  const [graphLog, setGraphLog] = useState("");
  const [pendingReview, setPendingReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("就绪");
  const messagesEndRef = useRef(null);

  const messages = messagesByThread[activeThreadId] || [];
  const traces = traceByThread[activeThreadId] || [];
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeThreadId),
    [activeThreadId, sessions],
  );

  const context = { thread_id: activeThreadId, user_id: USER_ID };

  function scrollMessagesToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  useEffect(() => {
    scrollMessagesToBottom();
  }, [activeThreadId, messages]);

  if (screen === "landing") {
    return <LandingPage onEnterConsole={() => setScreen("console")} />;
  }

  function updateMessages(updater) {
    setMessagesByThread((current) => ({
      ...current,
      [activeThreadId]: updater(current[activeThreadId] || []),
    }));
  }

  function updateTrace(updater) {
    setTraceByThread((current) => ({
      ...current,
      [activeThreadId]: updater(current[activeThreadId] || []),
    }));
  }

  function updateAssistantMessage(id, patch) {
    updateMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function createSession() {
    const session = newSession(sessions.length + 1);
    setSessions((items) => [session, ...items]);
    setActiveThreadId(session.id);
    setMessagesByThread((items) => ({ ...items, [session.id]: [] }));
    setTraceByThread((items) => ({ ...items, [session.id]: [] }));
    setPendingReview(null);
    setStateJson("");
    setStatus("新会话已创建");
  }

  async function handleChat(event) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const assistantId = crypto.randomUUID();
    setBusy(true);
    setQuestion("");
    setStatus("多代理执行中");
    setPendingReview(null);
    updateMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "正在分析问题，准备路由到合适的 Agent...", pending: true },
    ]);
    updateTrace((items) => [
      ...items,
      { id: crypto.randomUUID(), type: "status", content: "开始执行多代理工作流" },
    ]);

    try {
      await streamChat({ question: trimmed, ...context }, (eventData) => {
        if (eventData.type === "status") {
          updateTrace((items) => [
            ...items,
            { id: crypto.randomUUID(), type: "status", content: eventData.message },
          ]);
        }

        if (eventData.type === "trace") {
          updateTrace((items) => [
            ...items,
            {
              id: crypto.randomUUID(),
              type: "node",
              node: eventData.node,
              content: eventData.content,
            },
          ]);
          setStatus(`正在执行：${eventData.node}`);
        }

        if (eventData.type === "review_required") {
          setPendingReview({
            approval_request: eventData.approval_request,
            pending_worker: eventData.pending_worker,
          });
          updateAssistantMessage(assistantId, {
            content: eventData.approval_request || "当前操作需要人工确认。",
            pending: false,
          });
          setStatus("等待人工确认");
        }

        if (eventData.type === "final") {
          const needsReview = Boolean(eventData.pending_review);
          if (needsReview) {
            setPendingReview({
              approval_request: eventData.approval_request,
              pending_worker: eventData.pending_worker,
            });
          }
          updateAssistantMessage(assistantId, {
            content:
              needsReview
                ? eventData.approval_request || "当前操作需要人工确认。"
                : eventData.answer || "已完成，但没有返回文本内容。",
            artifacts: eventData.artifacts || [],
            pending: false,
          });
          setStatus(needsReview ? "等待人工确认" : "已回答");
        }

        if (eventData.type === "error") {
          updateAssistantMessage(assistantId, {
            role: "error",
            content: eventData.message,
            pending: false,
          });
          setStatus("出错");
        }
      });
    } catch (error) {
      updateAssistantMessage(assistantId, {
        role: "error",
        content: error.message,
        pending: false,
      });
      setStatus("出错");
    } finally {
      setBusy(false);
    }
  }

  async function refreshState() {
    setBusy(true);
    try {
      const result = await getState(activeThreadId, USER_ID);
      setStateJson(JSON.stringify(result.state, null, 2));
      if (result.state?.approval_request) {
        setPendingReview({
          approval_request: result.state.approval_request,
          pending_worker: result.state.pending_worker,
        });
      }
      setStatus("状态已刷新");
    } catch (error) {
      setStateJson(error.message);
      setStatus("出错");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(decision) {
    setBusy(true);
    setStatus(decision === "approve" ? "正在批准执行" : "正在拒绝执行");
    const assistantId = crypto.randomUUID();
    updateMessages((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: decision === "approve" ? "批准执行" : "拒绝执行",
      },
      {
        id: assistantId,
        role: "assistant",
        content: "正在恢复被中断的工作流...",
        pending: true,
      },
    ]);

    try {
      const action = decision === "approve" ? approveReview : rejectReview;
      const result = await action({ ...context, review_notes: "submitted from frontend" });
      setPendingReview(
        result.pending_review
          ? {
              approval_request: result.approval_request,
              pending_worker: result.pending_worker,
            }
          : null,
      );
      updateAssistantMessage(assistantId, {
        content: result.answer || "审批结果已提交。",
        artifacts: result.artifacts || [],
        pending: false,
      });
      setStatus(result.pending_review ? "等待人工确认" : "审批已处理");
    } catch (error) {
      updateAssistantMessage(assistantId, {
        role: "error",
        content: error.message,
        pending: false,
      });
      setStatus("出错");
    } finally {
      setBusy(false);
    }
  }

  async function handleBuildGraph(dryRun) {
    setBusy(true);
    setGraphLog("");
    try {
      const result = await buildGraph({
        dry_run: dryRun,
        reset: false,
        preview_llm: false,
        use_gliner: false,
      });
      setGraphLog(result.message);
      setStatus(dryRun ? "图谱预览完成" : "图谱导入完成");
    } catch (error) {
      setGraphLog(error.message);
      setStatus("出错");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <GitBranch size={28} />
          <div>
            <h1>企业智能协作台</h1>
            <span>{status}</span>
          </div>
        </div>

        <section className="sessions">
          <div className="section-heading">
            <h2>会话</h2>
            <button type="button" className="icon-button" onClick={createSession}>
              <Plus size={16} />
            </button>
          </div>
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={`session-card ${session.id === activeThreadId ? "active" : ""}`}
              onClick={() => {
                setActiveThreadId(session.id);
                setPendingReview(null);
                setStateJson("");
              }}
            >
              <span>{session.title}</span>
              <small>{session.id}</small>
            </button>
          ))}
        </section>

        <section className="quick">
          <h2>示例指令</h2>
          {examples.map((item) => (
            <button key={item} type="button" onClick={() => setQuestion(item)}>
              {item}
            </button>
          ))}
        </section>
      </aside>

      <section className="chat-panel">
        <div className="panel-title">
          <Bot size={22} />
          <div>
            <h2>{activeSession?.title || "当前会话"}</h2>
            <span>{activeThreadId}</span>
          </div>
          {busy && <Loader2 className="spin" size={18} />}
        </div>

        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty">
              <Sparkles size={28} />
              <p>输入问题后，Supervisor 会自动选择 chat、sqler、coder、graph_kg 或 vec_kg。</p>
            </div>
          ) : (
            messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                <span>{message.role}</span>
                <p>{message.content}</p>
                {message.pending && <Loader2 className="spin inline-spin" size={16} />}
                {message.artifacts?.length > 0 && (
                  <div className="artifacts">
                    {message.artifacts.map((artifact) => (
                      <figure key={artifact.url}>
                        <img
                          src={assetUrl(artifact.url)}
                          alt={artifact.title || "生成图表"}
                          onLoad={scrollMessagesToBottom}
                        />
                        <figcaption>{artifact.title || "生成图表"}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleChat}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            placeholder="请输入你的问题，例如：帮我根据前10名销售记录生成柱状图"
          />
          <button type="submit" disabled={busy}>
            <Send size={18} />
            发送
          </button>
        </form>
      </section>

      <aside className="tools">
        {pendingReview && (
          <section className="review-card">
            <div className="tool-title">
              <ShieldCheck size={20} />
              <h2>需要人工确认</h2>
            </div>
            <p>{pendingReview.approval_request}</p>
            <div className="button-row">
              <button type="button" onClick={() => submitReview("approve")} disabled={busy}>
                <Check size={17} />
                批准
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => submitReview("reject")}
                disabled={busy}
              >
                <X size={17} />
                拒绝
              </button>
            </div>
          </section>
        )}

        <section>
          <div className="tool-title">
            <Workflow size={20} />
            <h2>执行轨迹</h2>
          </div>
          <div className="trace-list">
            {traces.length === 0 ? (
              <p className="muted">暂无执行轨迹。</p>
            ) : (
              traces.slice(-8).map((trace) => (
                <article key={trace.id}>
                  <strong>{trace.node || trace.type}</strong>
                  <p>{trace.content}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="tool-title">
            <RefreshCw size={20} />
            <h2>会话状态</h2>
          </div>
          <button type="button" onClick={refreshState} disabled={busy}>
            刷新状态
          </button>
          <pre>{stateJson || "暂无状态快照。"}</pre>
        </section>

        <section>
          <div className="tool-title">
            <DatabaseZap size={20} />
            <h2>图谱构建</h2>
          </div>
          <div className="button-row">
            <button type="button" onClick={() => handleBuildGraph(true)} disabled={busy}>
              预览
            </button>
            <button type="button" onClick={() => handleBuildGraph(false)} disabled={busy}>
              导入
            </button>
          </div>
          <pre>{graphLog || "暂无图谱任务输出。"}</pre>
        </section>
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
