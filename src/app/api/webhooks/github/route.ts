import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * GitHub Webhook Handler
 *
 * Handles incoming GitHub webhooks for:
 * - Pull request events (opened, closed, merged)
 * - Issue events (opened, closed)
 * - Push events (commits)
 * - Deployment events
 *
 * Security:
 * - Verifies webhook signature using GITHUB_WEBHOOK_SECRET
 * - Validates payload structure before processing
 */

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Find project by repository URL
 */
async function findProjectByRepoUrl(repoUrl: string) {
  // Try to find a project with matching repoUrl
  const project = await prisma.project.findFirst({
    where: {
      repoUrl: {
        contains: repoUrl.replace("https://github.com/", ""),
      },
    },
    include: {
      organization: {
        include: {
          members: {
            where: { role: "owner" },
            take: 1,
            include: { user: true },
          },
        },
      },
    },
  });

  return project;
}

/**
 * Find user by GitHub username
 */
async function findUserByGitHubUsername(username: string) {
  const user = await prisma.user.findFirst({
    where: {
      githubUsername: username,
    },
  });

  return user;
}

/**
 * Handle pull_request events
 */
async function handlePullRequest(payload: {
  action: string;
  pull_request: {
    html_url: string;
    title: string;
    number: number;
    merged: boolean;
    user: { login: string };
  };
  repository: {
    full_name: string;
    html_url: string;
  };
}) {
  const { action, pull_request, repository } = payload;

  // Find project associated with this repo
  const project = await findProjectByRepoUrl(repository.html_url);
  if (!project) {
    console.log(`No project found for repo: ${repository.html_url}`);
    return;
  }

  // Find user who triggered the event
  const user = await findUserByGitHubUsername(pull_request.user.login);

  // Determine activity type based on action
  let activityType: "PR_MERGED" | null = null;
  let title = "";

  if (action === "closed" && pull_request.merged) {
    activityType = "PR_MERGED";
    title = `PR #${pull_request.number} merged: ${pull_request.title}`;
  }

  if (activityType && user) {
    await prisma.activity.create({
      data: {
        organizationId: project.organizationId,
        type: activityType,
        title,
        description: `Pull request merged in ${repository.full_name}`,
        projectId: project.id,
        userId: user.id,
        metadata: {
          prUrl: pull_request.html_url,
          prNumber: pull_request.number,
          repository: repository.full_name,
        },
      },
    });

    console.log(`Created activity: ${activityType} for PR #${pull_request.number}`);
  }
}

/**
 * Handle issues events
 * - Creates tasks automatically from GitHub issues
 * - Updates task status when issues are closed
 */
async function handleIssue(payload: {
  action: string;
  issue: {
    html_url: string;
    title: string;
    body: string | null;
    number: number;
    user: { login: string };
    labels: Array<{ name: string; color: string }>;
    assignee: { login: string } | null;
  };
  repository: {
    full_name: string;
    html_url: string;
  };
}) {
  const { action, issue, repository } = payload;

  // Find project associated with this repo
  const project = await findProjectByRepoUrl(repository.html_url);
  if (!project) {
    console.log(`No project found for repo: ${repository.html_url}`);
    return;
  }

  // Find user who triggered the event
  const user = await findUserByGitHubUsername(issue.user.login);

  // Find assignee if exists
  let assignee = null;
  if (issue.assignee) {
    assignee = await findUserByGitHubUsername(issue.assignee.login);
  }

  // Map GitHub labels to task priority
  const labelNames = issue.labels.map((l) => l.name.toLowerCase());
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  if (labelNames.includes("critical") || labelNames.includes("urgent") || labelNames.includes("p0")) {
    priority = "URGENT";
  } else if (labelNames.includes("high") || labelNames.includes("important") || labelNames.includes("p1")) {
    priority = "HIGH";
  } else if (labelNames.includes("low") || labelNames.includes("minor") || labelNames.includes("p3")) {
    priority = "LOW";
  }

  // Extract dev labels (bug, feature, enhancement, etc.)
  const devLabels = issue.labels
    .map((l) => l.name.toLowerCase())
    .filter((name) =>
      ["bug", "feature", "enhancement", "documentation", "refactor", "hotfix", "wontfix", "duplicate"].includes(name)
    );

  if (action === "opened") {
    // Check if task already exists for this issue
    const existingTask = await prisma.task.findFirst({
      where: {
        githubRepoFullName: repository.full_name,
        githubIssueNumber: issue.number,
      },
    });

    if (!existingTask) {
      // Create new task from issue
      const task = await prisma.task.create({
        data: {
          organizationId: project.organizationId,
          projectId: project.id,
          title: issue.title,
          description: issue.body || null,
          status: "TODO",
          priority,
          githubIssueNumber: issue.number,
          githubRepoFullName: repository.full_name,
          issueUrl: issue.html_url,
          labels: devLabels,
          creatorId: user?.id || project.organization?.members?.[0]?.user?.id || "",
          assigneeId: assignee?.id || null,
          order: 0,
        },
      });

      console.log(`Created task from Issue #${issue.number}: ${task.id}`);
    }

    // Create activity
    if (user) {
      await prisma.activity.create({
        data: {
          organizationId: project.organizationId,
          type: "ISSUE_OPENED",
          title: `Issue #${issue.number} opened: ${issue.title}`,
          description: `Issue opened in ${repository.full_name}`,
          projectId: project.id,
          userId: user.id,
          metadata: {
            issueUrl: issue.html_url,
            issueNumber: issue.number,
            repository: repository.full_name,
          },
        },
      });
    }
  } else if (action === "closed") {
    // Find and update the linked task
    const linkedTask = await prisma.task.findFirst({
      where: {
        githubRepoFullName: repository.full_name,
        githubIssueNumber: issue.number,
      },
    });

    if (linkedTask) {
      await prisma.task.update({
        where: { id: linkedTask.id },
        data: {
          status: "DONE",
          completedAt: new Date(),
        },
      });

      console.log(`Marked task as DONE from closed Issue #${issue.number}`);
    }

    // Create activity
    if (user) {
      await prisma.activity.create({
        data: {
          organizationId: project.organizationId,
          type: "ISSUE_CLOSED",
          title: `Issue #${issue.number} closed: ${issue.title}`,
          description: `Issue closed in ${repository.full_name}`,
          projectId: project.id,
          userId: user.id,
          metadata: {
            issueUrl: issue.html_url,
            issueNumber: issue.number,
            repository: repository.full_name,
          },
        },
      });
    }
  } else if (action === "reopened") {
    // Reopen the linked task
    const linkedTask = await prisma.task.findFirst({
      where: {
        githubRepoFullName: repository.full_name,
        githubIssueNumber: issue.number,
      },
    });

    if (linkedTask) {
      await prisma.task.update({
        where: { id: linkedTask.id },
        data: {
          status: "TODO",
          completedAt: null,
        },
      });

      console.log(`Reopened task from Issue #${issue.number}`);
    }
  } else if (action === "assigned" || action === "unassigned") {
    // Update task assignee
    const linkedTask = await prisma.task.findFirst({
      where: {
        githubRepoFullName: repository.full_name,
        githubIssueNumber: issue.number,
      },
    });

    if (linkedTask) {
      await prisma.task.update({
        where: { id: linkedTask.id },
        data: {
          assigneeId: assignee?.id || null,
        },
      });

      console.log(`Updated assignee for task from Issue #${issue.number}`);
    }
  } else if (action === "labeled" || action === "unlabeled") {
    // Update task labels and priority
    const linkedTask = await prisma.task.findFirst({
      where: {
        githubRepoFullName: repository.full_name,
        githubIssueNumber: issue.number,
      },
    });

    if (linkedTask) {
      await prisma.task.update({
        where: { id: linkedTask.id },
        data: {
          labels: devLabels,
          priority,
        },
      });

      console.log(`Updated labels for task from Issue #${issue.number}`);
    }
  }
}

/**
 * Handle push events
 */
async function handlePush(payload: {
  ref: string;
  commits: Array<{
    id: string;
    message: string;
    author: { username: string };
  }>;
  repository: {
    full_name: string;
    html_url: string;
  };
  pusher: { name: string };
}) {
  const { ref, commits, repository, pusher } = payload;

  // Only process pushes to main/master
  if (!ref.endsWith("/main") && !ref.endsWith("/master")) {
    return;
  }

  // Find project associated with this repo
  const project = await findProjectByRepoUrl(repository.html_url);
  if (!project) {
    console.log(`No project found for repo: ${repository.html_url}`);
    return;
  }

  // Find user who pushed
  const user = await findUserByGitHubUsername(pusher.name);

  if (commits.length > 0 && user) {
    const commitCount = commits.length;
    const latestCommit = commits[0];

    await prisma.activity.create({
      data: {
        organizationId: project.organizationId,
        type: "COMMIT_PUSHED",
        title: `${commitCount} commit${commitCount > 1 ? "s" : ""} pushed to ${ref.split("/").pop()}`,
        description: latestCommit.message,
        projectId: project.id,
        userId: user.id,
        metadata: {
          commitHash: latestCommit.id,
          commitCount,
          branch: ref.split("/").pop(),
          repository: repository.full_name,
        },
      },
    });

    console.log(`Created activity: COMMIT_PUSHED (${commitCount} commits)`);
  }
}

/**
 * Handle deployment events
 */
async function handleDeployment(payload: {
  action: string;
  deployment: {
    environment: string;
    sha: string;
    creator: { login: string };
  };
  deployment_status?: {
    state: string;
  };
  repository: {
    full_name: string;
    html_url: string;
  };
}) {
  const { deployment, deployment_status, repository } = payload;

  // Only create activity for successful deployments
  if (deployment_status?.state !== "success") {
    return;
  }

  // Find project associated with this repo
  const project = await findProjectByRepoUrl(repository.html_url);
  if (!project) {
    console.log(`No project found for repo: ${repository.html_url}`);
    return;
  }

  // Find user who deployed
  const user = await findUserByGitHubUsername(deployment.creator.login);

  if (user) {
    await prisma.activity.create({
      data: {
        organizationId: project.organizationId,
        type: "DEPLOYMENT",
        title: `Deployed to ${deployment.environment}`,
        description: `Successfully deployed ${deployment.sha.slice(0, 7)} to ${deployment.environment}`,
        projectId: project.id,
        userId: user.id,
        metadata: {
          environment: deployment.environment,
          sha: deployment.sha,
          repository: repository.full_name,
        },
      },
    });

    console.log(`Created activity: DEPLOYMENT to ${deployment.environment}`);
  }
}

/**
 * POST handler for GitHub webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    // Verify webhook signature
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    // Log the event for debugging
    console.log(`Received GitHub webhook: ${event}`);

    // Handle different event types
    switch (event) {
      case "pull_request":
        await handlePullRequest(payload);
        break;
      case "issues":
        await handleIssue(payload);
        break;
      case "push":
        await handlePush(payload);
        break;
      case "deployment_status":
        await handleDeployment(payload);
        break;
      case "ping":
        // GitHub sends a ping event when webhook is first configured
        console.log("Received ping from GitHub");
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Return basic info about the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "CRMDev GitHub Webhook Endpoint",
    events: ["pull_request", "issues", "push", "deployment_status"],
  });
}
