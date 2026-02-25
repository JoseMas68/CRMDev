#!/usr/bin/env node

// Simple REST test for MCP (without SSE complexity)
const API_KEY = "crm_6df28433c4ec7ac15ef43d5fca54bbadc725452f81623cc5";
const BASE_URL = "https://crmdev.tech";

async function testMCPREST() {
  console.log("🧪 Testing MCP REST Endpoint...\n");

  // Test 1: List projects
  console.log("1. Testing list_projects...");
  const response1 = await fetch(`${BASE_URL}/api/mcp/rest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      tool: 'list_projects',
      arguments: {}
    })
  });

  const data1 = await response1.json();
  console.log("Response:", JSON.stringify(data1, null, 2));

  // Test 2: Create a test project
  console.log("\n2. Testing create_project...");
  const response2 = await fetch(`${BASE_URL}/api/mcp/rest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      tool: 'create_project',
      arguments: {
        name: 'Test Project from MCP',
        description: 'Created via REST API test',
        type: 'OTHER'
      }
    })
  });

  const data2 = await response2.json();
  console.log("Response:", JSON.stringify(data2, null, 2));

  // Test 3: List tasks
  console.log("\n3. Testing list_tasks...");
  const response3 = await fetch(`${BASE_URL}/api/mcp/rest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      tool: 'list_tasks',
      arguments: {}
    })
  });

  const data3 = await response3.json();
  console.log("Response:", JSON.stringify(data3, null, 2));

  console.log("\n✨ Test completed!");
}

testMCPREST().catch(console.error);
