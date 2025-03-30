import { convexGuidelines } from './convex';

export function databaseInstructions(options: {
  convex?: {
    isConnected: boolean;
    projectToken: string | null;
  };
}): string {
  const { convex } = options;

  /*
   *dbPrompt +=
   */

  const dbPrompt = `<database_instructions>


  ${
    convex?.isConnected
      ? `
There is a Convex project already provisioned that may be useful for this task.

If there's any reason to persist data or run functions on it, Convex is the way to go! Install it with \`npm i convex@1.21.1-alpha.0 --force\` and after any change made to code in the convex directory or the first time after the CONVEX_DEPLOY_KEY has been added to the .env.local file, run it with \`npx convex dev --once\` to deploy the code.

If one does not exist, create a .env.local file containing at least this line:
CONVEX_DEPLOY_KEY="${convex.projectToken}"

If a .env.local file does exist, you'll still need to add the line
CONVEX_DEPLOY_KEY="${convex.projectToken}"

and you'll also need to run \`npx convex dev --once\` to complete the setup: automatically adding an enironment variable like VITE_CONVEX_URL.

If the user says they just connected a deployment, that's a good time to add that CONVEX_DEPLOY_KEY="${convex.projectToken}" line to the .env.local and run \`npx convex dev --once\`.
`
      : `There is no database the user has specified yet, but the user can use Convex in this environment.

If you need to persist data, run scheduled functions, query data, or subscribe to updates, ask the user to connect to a Convex deployment.

If you need to install it, install with \`npm i convex@1.21.1-alpha.0 --force\` since 1.21.1-alpha.0 is a version known to work with this environment.
You can start to build an app with it if you like, but the user hasn't connected the deployment yet so nothing will work yet.

Instruct the user to connect to either of these by clicking the corresponding buttons they can see below the chat box.

IMPORTANT: Convex cannot be used
`
  }

The Convex client bindings are included in the 'convex' package, importable from 'convex/react' or 'convex/browser' (for non-React webapps).

Running \`npx convex dev --once\` creates a convex directory, and then you can build a normal convex app (a schema, queries, actions, mutations, etc.)

After you create these files, you'll want to run \`npx convex dev --once\` again to deploy that code.
Whenever you stop one long-running command in the terminal (typically \`npm run dev\`) in order to run another command,
be sure to rerun that command once the other command is finished. This is important so the developer can keep seeing
their app!

IMPORTANT: Once \`npx convex dev --once\` has run successfully, you should run \`npm run dev\` again!


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
