import crypto from "crypto";

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function splitByHeadings(text) {
  const lines = text.split("\n");
  const sections = [];
  let current = { heading: "", content: [] };

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      if (current.content.length) {
        sections.push({
          heading: current.heading,
          content: current.content.join("\n"),
        });
      }
      current = { heading: line.trim(), content: [] };
    } else {
      current.content.push(line);
    }
  }

  if (current.content.length) {
    sections.push({
      heading: current.heading,
      content: current.content.join("\n"),
    });
  }

  return sections;
}

function splitByParagraphs(text, maxTokens, overlap) {
  const paras = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  let buffer = "";

  for (const para of paras) {
    if ((buffer + "\n\n" + para).length > maxTokens * 4) {
      chunks.push(buffer.trim());
      buffer = para;
    } else {
      buffer = buffer ? buffer + "\n\n" + para : para;
    }
  }

  if (buffer) chunks.push(buffer.trim());

  if (overlap > 0 && chunks.length > 1) {
    return chunks.map((c, i) => {
      const prev = i > 0 ? chunks[i - 1].slice(-overlap * 4) : "";
      return normalize(prev + "\n" + c);
    });
  }

  return chunks.map(normalize);
}

export function chunkMarkdown(
  content,
  metadata,
  config = { maxTokens: 400, overlapTokens: 80 },
) {
  const sections = splitByHeadings(content);
  const chunks = [];

  for (const section of sections) {
    const baseText = `${section.heading}\n\n${section.content}`.trim();
    if (baseText.length <= config.maxTokens * 4) {
      chunks.push(baseText);
    } else {
      const parts = splitByParagraphs(
        section.content,
        config.maxTokens,
        config.overlapTokens,
      );
      parts.forEach((p) => chunks.push(`${section.heading}\n\n${p}`.trim()));
    }
  }

  return chunks.map((text, index) => {
    const normalized = normalize(text);
    return {
      chunk_id: hashContent(normalized),
      content: normalized,
      content_hash: hashContent(normalized),
      metadata: {
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length,
      },
    };
  });
}

export function chunkPlainText(
  content,
  metadata,
  config = { maxTokens: 350, overlapTokens: 50 },
) {
  const parts = splitByParagraphs(
    content,
    config.maxTokens,
    config.overlapTokens,
  );
  return parts.map((text, index) => {
    const normalized = normalize(text);
    return {
      chunk_id: hashContent(normalized),
      content: normalized,
      content_hash: hashContent(normalized),
      metadata: {
        ...metadata,
        chunk_index: index,
        total_chunks: parts.length,
      },
    };
  });
}
