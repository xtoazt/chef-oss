import { convexGuidelines } from './convex';

export function databaseInstructions(): string {
  const dbPrompt = `<database_instructions>

The user can use Convex as a database in this environment.

If there's any reason to persist data, have live-updating data shared between users, or run functions on a server, Convex is the way to go! Install it with \`npm i convex@1.21.1-alpha.0 --force\`.

After any change made to code in the convex directory, use the convex action to deploy the code.

Deploying for the first time creates a convex directory, and then you can build a normal convex app (a schema, queries, actions, mutations, etc.)

After you create these files, you'll want to the convex action to deploy the code.

If you're using Convex in a React app, use the hooks imported from "convex/react" to call these convex functions like this:

The Convex client bindings are included in the 'convex' package.

You don't need to install "convex/react", it's part of the 'convex' package you get with \`npm i convex@1.21.1-alpha.0 --force\`.

IMPORTANT: Once you run \`npx convex dev --once\` and it exits with no errors, you should start run the start action again with \`npm run dev\` or whatever the appropriate long-running dev server command is. DON'T FORGET TO RUN \`npm run dev\` AFTER A CONVEX DEPLOY ACTION!

IMPORTANT: ONLY use functions that are defined in the \`convex/\` directory. If they are not defined in the \`convex/\` directory, you CANNOT use them.


Here's an example of using Convex from a React app.

\`\`\`
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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
      <Form onSubmit={handleSendMessage}>
        <input
          value={newMessageText}
          onChange={(event) => setNewMessageText(event.target.value)}
          placeholder="Write a message…"
        />
        <Button type="submit" disabled={!newMessageText}>
          Send
        </Button>
      </Form>
    </main>
  );
}
\`\`\`

When creating the frontend, only create files within the \`src\` directory. DO NOT touch the \`src/components\` directory.

IMPORTANT: Always use react! Use good UI styling principles and use shadcn for components. Only use the following shadcn components, which are already installed:
  - accordion
  - alert
  - button
  - card
  - checkbox
  - form
  - input
  - label
  - select
  - toast
  - toaster

Below is an example of using the shadcn button component:

\`\`\`
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <Button>Click me</Button>
  )
}
\`\`\`

The \`useQuery()\` hook is live-updating! It causes the React component is it used in to rerender, so Convex is a perfect fix for
collaborative, live-updating websites.

In order to use the useQuery hook in a component, it needs to be used inside a ConvexAuthProvider. That might look like this:
\`\`\`
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const address = import.meta.env.VITE_CONVEX_URL;

const convex = new ConvexReactClient(address);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>
);
\`\`\`

The import path to import \`api\` from depends on the location of the file this codes written in (it's a relative path import).

You'll start with a codebase that uses Convex Auth, so you'll want to use patterns like

IMPORTANT: Notes about authentication in Convex:
- DO NOT touch \`convex/auth.config.ts\`, \`convex/auth.ts\`, \`package.json\`, or \`src/Main.tsx\` under ANY circumstances.
- DO NOT touch \`convex/http.ts\` unless explicitly specified by the user.
- DO NOT change the login in \`src/App.tsx\` unless explicitly specified by the user.
- \`api.auth.users\` DOES NOT EXIST.
- If you want to get a user in a mutation or query, use the following syntax:
\`\`\`typescript
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
export const myMutation = mutation({
  args: {
    // ...
  },
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated call to mutation");
    }
    const user = await ctx.db.get(userId);
    //...
  },
});
\`\`\`
You can use the userId to get the user's data from the database or store it as the author of a message, for example. But most times, you just want to check that the user is authenticated.
The "users" table looks like this:

\`\`\`typescript
users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
\`\`\`

If you want to get a user from the userId, you can do \`ctx.db.get(userId)\`.

You can also add usernames to the users table that can be used throughout the app. You can have users specify this during sign up, or you can have them edit it later.

${convexGuidelines}

</database_instructions>`;

  return dbPrompt;
}
