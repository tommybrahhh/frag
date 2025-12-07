import { Client } from '@modelcontextprotocol/sdk/client';

async function testMcpSupabase() {
  console.log('Testing Supabase MCP Server connection...');
  
  try {
    // Create MCP client
    const client = new Client({
      name: 'supabase-test',
      version: '1.0.0'
    });

    // Connect to the Supabase MCP server
    await client.connect({
      type: 'http',
      url: 'https://mcp.supabase.com/mcp?project_ref=fmtqqpnhnexwmgpeaidb'
    });

    console.log('✅ Successfully connected to Supabase MCP Server!');
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map(t => t.name));
    
    // List available resources
    const resources = await client.listResources();
    console.log('Available resources:', resources.resources.map(r => r.uri));
    
    await client.close();
    console.log('MCP connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error connecting to Supabase MCP Server:', error.message);
    console.error('Error details:', error);
  }
}

testMcpSupabase();