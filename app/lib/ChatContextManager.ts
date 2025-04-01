import { generateId, type UIMessage } from "ai";
import { renderFile, workDirRelative } from "~/utils/fileUtils";
import type { Dirent } from "./stores/files";
import { PREWARM_PATHS, WORK_DIR } from "~/utils/constants";
import { workbenchStore } from "./stores/workbench";
import { StreamingMessageParser } from "./runtime/message-parser";
import { path } from "~/utils/path";
// import { bashToolParameters, editorToolParameters } from "./tools";

// It's wasteful to actually tokenize the content, so we'll just use character
// counts as a heuristic.
const MAX_RELEVANT_FILES_SIZE = 8192;
const MAX_RELEVANT_FILES = 16;

const MAX_COLLAPSED_MESSAGES_SIZE = 8192;

type UIMessagePart = UIMessage["parts"][number];

type ParsedAssistantMessage = {
  filesWritten: string[];
  textContent: string;
}

export class ChatContextManager {
  assistantMessageCache: WeakMap<UIMessagePart, ParsedAssistantMessage> = new WeakMap();
  messageSizeCache: WeakMap<UIMessage, number> = new WeakMap();
  partSizeCache: WeakMap<UIMessagePart, number> = new WeakMap();

  /**
   * Our request context has a few sections:
   *
   * 1. The Convex guidelines, which are filled in by the server and
   *    set to be cached by Anthropic (~10k tokens).
   * 2. Some relevant project files, which are filled in from the file
   *    cache based on LRU (at most ~5k tokens).
   * 3. A potentially collapsed segment of the chat history followed
   *    by the full fidelity recent chat history (~5k tokens).
   */
  prepareContext(messages: UIMessage[]): UIMessage[] {
    const relevantFiles = this.relevantFiles(messages);
    const collapsedMessages = this.collapseMessages(messages);
    return [...relevantFiles, ...collapsedMessages];
  }

  private relevantFiles(messages: UIMessage[]): UIMessage[] {
    // Seed the set with the PREWARM_PATHS.
    const cache = workbenchStore.files.get();
    const allPaths = Object.keys(cache).toSorted();

    const lastUsed: Map<string, number> = new Map();
    for (const path of PREWARM_PATHS) {
      const entry = cache[path];
      if (!entry) {
        console.log("Missing prewarm entry", path);
        continue;
      }
      lastUsed.set(path, -1);
    }

    // Iterate over the messages and update the last used time for each path.
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      for (const part of message.parts) {
        const parsed = this.parsedAssistantMessage(message, part);
        if (!parsed) {
          continue;
        }
        for (const absPath of parsed.filesWritten) {
          const entry = cache[absPath];
          if (!entry || entry.type !== "file") {
            continue;
          }
          lastUsed.set(absPath, i);
        }
      }
    }

    const sortedByLastUsed = Array.from(lastUsed.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    let sizeEstimate = 0;
    const relevantFiles: UIMessage[] = [];

    if (sortedByLastUsed.length > 0) {
      relevantFiles.push(makeSystemMessage(
        `Here are all the paths in the project:\n${allPaths.map(p => ` - ${p}`).join("\n")}`
      ));
    }
    const debugInfo: string[] = [];
    if (sortedByLastUsed.length > 0) {
      relevantFiles.push(makeSystemMessage("Here are some relevant files in the project."));
      for (const [path] of sortedByLastUsed) {
        if (sizeEstimate > MAX_RELEVANT_FILES_SIZE) {
          break;
        }
        if (relevantFiles.length >= MAX_RELEVANT_FILES) {
          break;
        }
        const entry = cache[path];
        if (!entry) {
          continue;
        }
        if (entry.type === "file") {
          const content = renderFile(entry.content);
          relevantFiles.push(makeSystemMessage(`"${path}":\n${content}`));
          const size = estimateSize(entry);
          sizeEstimate += size;
          debugInfo.push(`  "${path}": ${size}`);
        }
      }
    }
    console.log(
      `Populated ${relevantFiles.length} relevant files with size ${sizeEstimate}:\n${debugInfo.join("\n")}`,
      relevantFiles
    );
    return relevantFiles;
  }

  private collapseMessages(messages: UIMessage[]): UIMessage[] {
    const result: UIMessage[] = [];
    for (const message of messages) {
      if (message.role !== "assistant") {
        result.push(message);
        continue;
      }
      const parsed = this.parsedAssistantMessage(message, message.parts[0]);
      if (!parsed) {
        result.push(message);
        continue;
      }
      result.push(makeSystemMessage(parsed.textContent));
    }
    return result;
  }

  private parsedAssistantMessage(message: UIMessage, part: UIMessagePart): ParsedAssistantMessage | null {
    if (message.role !== "assistant") {
      return null;
    }
    if (part.type !== "text") {
      return null;
    }
    const cached = this.assistantMessageCache.get(part);
    if (cached) {
      return cached;
    }

    const filesWritten: string[] = [];
    const parser = new StreamingMessageParser({
      callbacks: {
        onActionClose: (data) => {
          if (data.action.type === "file") {
            const relPath = data.action.filePath;
            const absPath = path.join(WORK_DIR, relPath);
            filesWritten.push(absPath);
          }
        },
      }
    })
    parser.parse(message.id, message.content);
    const result = {
      filesWritten,
      textContent: StreamingMessageParser.stripArtifacts(message.content)
    };
    this.assistantMessageCache.set(part, result);
    return result;
  }

  private messageSize(message: UIMessage) {
    const cached = this.messageSizeCache.get(message);
    if (cached) {
      return cached;
    }
    let total = 0;
    for (const part of message.parts) {
      total += this.partSize(part);
    }
    this.messageSizeCache.set(message, total);
    return total;
  }

  private partSize(part: UIMessagePart) {
    const cached = this.partSizeCache.get(part);
    if (cached) {
      return cached;
    }
    let result = 0;
    switch (part.type) {
      case "text":
        result = part.text.length;
        break;
      case "file":
        result += part.data.length;
        result += part.mimeType.length;
        break;
      case "reasoning":
        result += part.reasoning.length;
        break;
      case "tool-invocation":
        result += JSON.stringify(part.toolInvocation.args).length;
        if (part.toolInvocation.state === "result") {
          result += JSON.stringify(part.toolInvocation.result).length;
        }
        break;
      case "source":
        result += (part.source.title ?? "").length;
        result += part.source.url.length;
        break;
      case "step-start":
        break;
      default:
        throw new Error(`Unknown part type: ${JSON.stringify(part)}`);
    }
    this.partSizeCache.set(part, result);
    return result;
  }
}

function makeSystemMessage(content: string): UIMessage {
  return {
    id: generateId(),
    content,
    role: "system",
    parts: [
      {
        type: "text",
        text: content,
      },
    ],
  };
}

function estimateSize(entry: Dirent): number {
  if (entry.type === "file") {
    return 4 + entry.content.length;
  } else {
    return 6;
  }
}
