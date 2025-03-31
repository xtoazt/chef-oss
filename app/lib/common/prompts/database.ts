import { convexGuidelines } from './convex';

export function databaseInstructions(): string {
  /*
   *dbPrompt +=
   */

  const dbPrompt = `<database_instructions>

The user can use Convex as a database in this environment.

If there's any reason to persist data or run functions on it, Convex is the way to go! Install it with \`npm i convex@1.21.1-alpha.0 --force\`.

After any change made to code in the convex directory, use the convex action to deploy the code.

Deplyoing for the first time creates a convex directory, and then you can build a normal convex app (a schema, queries, actions, mutations, etc.)

After you create these files, you'll want to the convex action to deploy the code.

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

The import path to import \`api\` from depends on the location of the file this codes written in (it's a relative path import).

${convexGuidelines}


</database_instructions>`;

  return dbPrompt;
}
