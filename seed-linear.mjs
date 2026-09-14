const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error("Error: LINEAR_API_KEY environment variable is not set.");
  process.exit(1);
}

async function linearQuery(query, variables = {}) {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": LINEAR_API_KEY
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await response.json();
  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data.data;
}

async function run() {
  console.log("Connecting to Linear...");
  const teamData = await linearQuery(`
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `);

  const team = teamData.teams.nodes.find(t => t.key === "TIC") || teamData.teams.nodes[0];
  if (!team) {
    console.error("No team found in your Linear workspace! Please create a team first.");
    process.exit(1);
  }
  console.log(`Found team: ${team.name} (${team.key})`);

  const tickets = [
    {
      title: "TIC-1: Scaffold Vite Tic Tac Toe Project and Test Suite",
      description: "Initialize a browser-based Tic Tac Toe frontend using Vite, React, and Vitest. Setup project config and ensure basic test runner passes."
    },
    {
      title: "TIC-2: Implement 3x3 Grid and Turn-Based State Management",
      description: "Render a 3x3 clickable grid. Track player turns alternating between X and O. Prevent overwriting already selected cells."
    },
    {
      title: "TIC-3: Implement Win Detection and Draw Condition Logic",
      description: "Evaluate 8 winning lines (3 rows, 3 columns, 2 diagonals) after each turn. Announce winner or draw, and add a Reset Game button."
    }
  ];

  for (const t of tickets) {
    const res = await linearQuery(`
      mutation CreateIssue($teamId: String!, $title: String!, $description: String!) {
        issueCreate(input: { teamId: $teamId, title: $title, description: $description }) {
          success
          issue {
            id
            identifier
            title
            url
          }
        }
      }
    `, { teamId: team.id, title: t.title, description: t.description });

    console.log(`Created: ${res.issueCreate.issue.identifier} - ${res.issueCreate.issue.title}`);
  }
  console.log("\nAll tickets created successfully in Linear!");
}

run().catch(err => {
  console.error("Script failed:", err);
});
