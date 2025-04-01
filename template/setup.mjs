// This setup script is used to initialize Convex Auth for the
// template. Feel free to delete it after the project is created.

import { promises as fs } from "fs";
import { homedir } from "os";
import * as dotenv from "dotenv";

export async function loadConfig() {
  const envLocalContents = await fs.readFile(".env.local", "utf-8");
  const envLocal = dotenv.parse(envLocalContents);
  const convexUrl = envLocal.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is not set in .env.local");
  }

  if (process.env.CONVEX_DEPLOY_KEY) {
    return { convexUrl, accessToken: process.env.CONVEX_DEPLOY_KEY };
  }
  const configContents = await fs.readFile(
    `${homedir()}/.convex/config.json`,
    "utf-8",
  );
  if (!configContents) {
    throw new Error("Failed to read ~/.convex/config.json");
  }
  const { accessToken } = JSON.parse(configContents);
  return { convexUrl, accessToken };
}

export async function queryEnvVariable(config, name) {
  const response = await fetch(`${config.convexUrl}/api/query`, {
    method: "POST",
    body: JSON.stringify({
      path: "_system/cli/queryEnvironmentVariables:get",
      format: "convex_encoded_json",
      args: [{ name }],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${config.accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to query environment variables");
  }
  const respJSON = await response.json();
  if (respJSON.status !== "success") {
    throw new Error(
      `Failed to query environment variables: ${JSON.stringify(respJSON)}`,
    );
  }
  const udfResult = respJSON.value;
  return udfResult && udfResult.value;
}

export async function setEnvVariables(config, values) {
  const response = await fetch(
    `${config.convexUrl}/api/update_environment_variables`,
    {
      method: "POST",
      body: JSON.stringify({
        changes: Object.entries(values).map(([name, value]) => ({
          name,
          value,
        })),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Convex ${config.accessToken}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to set environment variables: ${await response.text()}`,
    );
  }
}

async function main() {
  const { convexUrl, accessToken } = await loadConfig();
  const siteUrl = await queryEnvVariable(
    { convexUrl, accessToken },
    "SITE_URL",
  );
  const JWKS = await queryEnvVariable({ convexUrl, accessToken }, "JWKS");
  const JWT_PRIVATE_KEY = await queryEnvVariable(
    { convexUrl, accessToken },
    "JWT_PRIVATE_KEY",
  );

  const newEnv = {};
  if (siteUrl && siteUrl !== "http://localhost:5173") {
    console.warn("SITE_URL is not http://localhost:5173");
  }
  if (!siteUrl) {
    newEnv.SITE_URL = "http://localhost:5173";
  }
  if (!JWKS || !JWT_PRIVATE_KEY) {
    let contents;
    try {
      contents = await fs.readFile(".auth.init.json", "utf-8");
    } catch (e) {
      if (process.env.SHELL === "/bin/jsh") {
        throw e;
      } else {
        // not a webcontainer, .auth.init.json was never created
        const jose = await import("jose");
        const keys = await jose.generateKeyPair("RS256", { extractable: true });
        const privateKey = await jose.exportPKCS8(keys.privateKey);
        const publicKey = await jose.exportJWK(keys.publicKey);
        const jwks = { keys: [{ use: "sig", ...publicKey }] };
        newEnv.JWKS = JSON.stringify(jwks);
        newEnv.JWT_PRIVATE_KEY = `${privateKey.trimEnd().replace(/\n/g, " ")}`;
      }
    }
    if (contents) {
      const keyJson = JSON.parse(contents);
      newEnv.JWKS = JSON.stringify(keyJson.JWKS);
      newEnv.JWT_PRIVATE_KEY = keyJson.JWT_PRIVATE_KEY;
    }
  }
  if (Object.entries(newEnv).length > 0) {
    await setEnvVariables({ convexUrl, accessToken }, newEnv);
  }
}

main()
  .then(() => {
    console.log("✅ Convex Auth setup!");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
