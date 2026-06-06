import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const res = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: userMsg.content,
        history: messages.slice(-6),
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let assistantText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n").filter(Boolean);
      for (const line of lines) {
        const dataLine = line.replace(/^data:\s*/, "");
        if (dataLine === "[DONE]") continue;
        try {
          const payload = JSON.parse(dataLine);
          if (payload.type === "token") {
            assistantText += payload.content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant") {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...last,
                  content: assistantText,
                };
                return updated;
              }
              return [...prev, { role: "assistant", content: assistantText }];
            });
          }
        } catch (err) {
          continue;
        }
      }
    }

    setIsLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Himanshu AI Persona</h1>
      <div style={{ border: "1px solid #ddd", padding: 16, minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <strong>{m.role === "user" ? "You" : "Himanshu"}:</strong>{" "}
            {m.content}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Himanshu"
          style={{ flex: 1, padding: 8 }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          style={{ padding: "8px 16px" }}
        >
          {isLoading ? "Sending" : "Send"}
        </button>
      </div>
    </div>
  );
}
