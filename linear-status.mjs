const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const [,, ticketKey, targetStateName] = process.argv;

if (!LINEAR_API_KEY || !ticketKey || !targetStateName) {
  console.log("Usage: node linear-status.mjs <TICKET_KEY> <STATE_NAME>");
  console.log("Example: node linear-status.mjs TIC-1 \"In Progress\"");
  process.exit(1);
}

async function linearQuery(query, variables = {}) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": LINEAR_API_KEY
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

async function updateStatus() {
  const issuesData = await linearQuery(`
    query($key: String!) {
      issue(id: $key) {
        id
        identifier
        title
        team {
          states {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  `, { key: ticketKey });

  const issue = issuesData.issue;
  if (!issue) {
    console.error(`Issue ${ticketKey} not found.`);
    process.exit(1);
  }

  const state = issue.team.states.nodes.find(s => 
    s.name.toLowerCase() === targetStateName.toLowerCase()
  );

  if (!state) {
    console.error(`State "${targetStateName}" not found. Available states:`, 
      issue.team.states.nodes.map(s => s.name).join(", ")
    );
    process.exit(1);
  }

  await linearQuery(`
    mutation UpdateIssue($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) {
        success
      }
    }
  `, { id: issue.id, stateId: state.id });

  console.log(`Updated ${issue.identifier} (${issue.title}) -> [${state.name}]`);
}

updateStatus().catch(err => console.error("Error:", err));
