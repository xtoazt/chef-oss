import { convexGuidelines } from './convex';

export function databaseInstructions(options: {
  convex?: {
    isConnected: boolean;
    projectToken: string | null;
  };
}): string {
  const { convex } = options;

  let dbPrompt = `<database_instructions>`;

  if (convex?.isConnected) {
    console.log('using Convex DB instructions!');
    dbPrompt += `
There is a Convex project already provisioned that may be useful for this task.

If there's any reason to persist data or run functions on it, Convex is the way to go! Install it with \`npm i convex@1.21.1-alpha.0 --force\` and after any change made, run it with \`npx convex dev --once\` to deploy the code.

If one does not exist, create a .env.local file containing at least this line:
CONVEX_DEPLOY_KEY="${convex.projectToken}"

The Convex client bindings are included in the 'convex' package, importable from 'convex/react' or 'convex/browser' (for non-React webapps).

Running \`npx convex dev --once\` creates a convex directory, and then you can build a normal convex app (a schema, queries, actions, mutations, etc.)

After you create these files, you'll want to run \`npx convex dev --once\` again to deploy that code.
Whenver you stop one long-running comand in the terminal (typically \`npm run dev\`) in order to run another command,
be sure to rerun that command once the other command is finished. This is important so the developer can keep seeing
their app!

If you're using Convex in a React app, use the hooks imported from "convex/react" to call these convex functions like this:

\`\`\`
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const messages = useQuery(api.messages.list) || [];

  const [newMessageText, setNewMessageText] = useState("");
  const sendMessage = useMutation(api.messages.send);

  const [name] = useState(() => "User " + Math.floor(Math.random() * 10000));
  async function handleSendMessage(event) {
    event.preventDefault();
    await sendMessage({ body: newMessageText, author: name });
    setNewMessageText("");
  }
  return (
    <main>
      <h1>Convex Chat</h1>
      <p className="badge">
        <span>{name}</span>
      </p>
      <ul>
        {messages.map((message) => (
          <li key={message._id}>
            <span>{message.author}:</span>
            <span>{message.body}</span>
            <span>{new Date(message._creationTime).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSendMessage}>
        <input
          value={newMessageText}
          onChange={(event) => setNewMessageText(event.target.value)}
          placeholder="Write a message…"
        />
        <input type="submit" value="Send" disabled={!newMessageText} />
      </form>
    </main>
  );
}
\`\`\`

${convexGuidelines}
`;
  } else {
    dbPrompt += `There is no database the user has specified yet, but in this environment you are limited to using Convex.

  If you need to persist data, run scheduled functions, query data, or subscribe to updates, ask the user to connect to a Convex deployment.
  Instruct the user to connect to either of these by clicking the corresponding buttons they can see below the chat box.`;
  }

  dbPrompt += `
</database_instructions>`;

  return dbPrompt;
}
