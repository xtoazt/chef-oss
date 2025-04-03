import type { Message, UIMessage } from 'ai';
import { useCallback, useRef, useState } from 'react';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { makePartId, type PartId } from '../stores/Artifacts';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useMessageParser');

const messageParser = new StreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);
    },
    onArtifactClose: (data) => {
      workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      // we only add shell actions when when the close tag got parsed because only then we have the content
      if (data.action.type === 'file') {
        workbenchStore.addAction(data);
      }
    },
    onActionClose: (data) => {
      if (data.action.type !== 'file') {
        workbenchStore.addAction(data);
      }
      workbenchStore.runAction(data);
    },
    onActionStream: (data) => {
      workbenchStore.runAction(data, true);
    },
  },
});

type PartCache = Map<PartId, { original: Part, parsed: Part }>;

function isPartMaybeEqual(a: Part, b: Part): boolean {
  if (a.type === 'text' && b.type === 'text') {
    return a.text === b.text;
  }
  if (a.type === 'tool-invocation' && b.type === 'tool-invocation') {
    if (a.toolInvocation.state === "result" && b.toolInvocation.state === "result") {
      return a.toolInvocation.toolCallId === b.toolInvocation.toolCallId;
    }
  }
  return false;
}

function processMessage(message: Message, previousParts: PartCache): { message: Message, hitRate: [number, number] } {
  if (message.role === "user") {
    return { message, hitRate: [0, 0] };
  }
  if (!message.parts) {
    throw new Error('Message has no parts');
  }
  const parsedParts = [];
  let hits = 0;
  for (let i = 0; i < message.parts.length; i++) {
    const part = message.parts[i];
    const partId = makePartId(message.id, i);
    const cacheEntry = previousParts.get(partId);
    if (cacheEntry && isPartMaybeEqual(cacheEntry.original, part)) {
      parsedParts.push(cacheEntry.parsed);
      hits++;
      continue;
    }
    let newPart;
    switch (part.type) {
      case 'text': {
        let prevContent = '';
        if (cacheEntry && cacheEntry.parsed.type === "text") {
          prevContent = cacheEntry.parsed.text;
        }
        newPart = {
          type: 'text' as const,
          text: prevContent + messageParser.parse(partId, part.text),
        };
        break;
      }
      case 'tool-invocation': {
        const { toolInvocation } = part;
        workbenchStore.addArtifact({
          id: partId,
          partId,
          title: 'Editing files...',
        });
        const data = {
          artifactId: partId,
          partId,
          actionId: toolInvocation.toolCallId,
          action: {
            type: 'toolUse' as const,
            toolName: toolInvocation.toolName,
            content: JSON.stringify(toolInvocation),
          },
        };
        workbenchStore.addAction(data);
        if (toolInvocation.state === 'call' || toolInvocation.state === 'result') {
          workbenchStore.runAction(data);
        }
        newPart = {
          type: 'tool-invocation' as const,
          toolInvocation,
        };
      }
      default: {
        newPart = part;
      }
    }
    parsedParts.push(newPart);
    previousParts.set(partId, { original: part, parsed: newPart });
  }
  return {
    message: {
      ...message,
      parts: parsedParts,
    },
    hitRate: [hits, message.parts.length],
  }
}

type Part = UIMessage["parts"][number];

export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);

  const previousMessages = useRef<{ original: Message, parsed: Message }[]>([]);
  const previousParts = useRef<PartCache>(new Map());

  const parseMessages = useCallback((messages: Message[], isLoading: boolean) => {
    let reset = false;

    if (import.meta.env.DEV && !isLoading) {
      reset = true;
      messageParser.reset();
      previousMessages.current = [];
    }

    const nextPrevMessages: { original: Message, parsed: Message }[] = [];

    let hit = 0;
    let partHits = 0;
    let partTotal = 0;

    for (let i = 0; i < messages.length; i++) {
      const prev = previousMessages.current[i];
      const message = messages[i];
      if (!prev) {
        const { message: parsed, hitRate } = processMessage(message, previousParts.current);
        nextPrevMessages.push({ original: message, parsed });
        partHits += hitRate[0];
        partTotal += hitRate[1];
        continue;
      }
      if (prev.original === message) {
        nextPrevMessages.push(prev);
        hit++;
        continue;
      }
      const { message: parsed, hitRate } = processMessage(message, previousParts.current);
      nextPrevMessages.push({ original: message, parsed });
      partHits += hitRate[0];
      partTotal += hitRate[1];
    }
    // console.log(`Reused ${hit} of ${messages.length} messages, ${partHits} of ${partTotal} parts`);
    previousMessages.current = nextPrevMessages;
    setParsedMessages(nextPrevMessages.map(p => p.parsed));
  }, []);

  return { parsedMessages, parseMessages };
}