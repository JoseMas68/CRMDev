#!/usr/bin/env node

// Simple test script for MCP endpoint
const API_KEY = "crm_6df28433c4ec7ac15ef43d5fca54bbadc725452f81623cc5";
const BASE_URL = "https://crmdev.tech";

async function testMCP() {
  console.log("🧪 Testing MCP Endpoint...\n");

  // Step 1: Connect to SSE
  console.log("1. Connecting to SSE endpoint...");
  const sseResponse = await fetch(`${BASE_URL}/api/mcp/sse`, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
    },
  });

  if (!sseResponse.ok) {
    console.error(`❌ SSE Connection failed: ${sseResponse.status}`);
    return;
  }

  console.log("✅ SSE Connected");

  // Read the first event
  const reader = sseResponse.body.getReader();
  const decoder = new TextDecoder();
  let { value, done } = await reader.read();
  const text = decoder.decode(value);

  // Extract sessionId from the endpoint event
  const match = text.match(/sessionId=([a-f0-9-]+)/);
  if (!match) {
    console.error("❌ Could not extract sessionId from SSE response");
    console.log("Response:", text);
    return;
  }

  const sessionId = match[1];
  console.log(`✅ Got sessionId: ${sessionId}`);

  const messageUrl = `${BASE_URL}/api/mcp/message?sessionId=${sessionId}`;
  console.log(`📨 Message URL: ${messageUrl}\n`);

  // Step 2: Send initialize message
  console.log("2. Sending initialize message...");
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    },
  };

  const initResponse = await fetch(messageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(initMessage),
  });

  console.log(`✅ Initialize sent: ${initResponse.status}`);

  // Step 3: List available tools
  console.log("\n3. Listing available tools...");
  const toolsMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
  };

  const toolsResponse = await fetch(messageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(toolsMessage),
  });

  const toolsData = await toolsResponse.json();
  console.log("✅ Tools response:", JSON.stringify(toolsData, null, 2));

  if (toolsData.result && toolsData.result.tools) {
    console.log(`\n📦 Available tools: ${toolsData.result.tools.length}`);
    toolsData.result.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
  }

  // Step 4: Call list_projects
  console.log("\n4. Testing list_projects tool...");
  const callMessage = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "list_projects",
      arguments: {},
    },
  };

  const callResponse = await fetch(messageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(callMessage),
  });

  const callData = await callResponse.json();
  console.log("✅ list_projects response:", JSON.stringify(callData, null, 2));

  console.log("\n✨ MCP test completed!");
}

testMCP().catch(console.error);
