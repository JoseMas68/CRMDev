"use server";

/**
 * GitHub Integration Actions
 *
 * Provides functionality to sync GitHub repositories with CRMDev
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
}

/**
 * Get user's GitHub access token
 */
async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
    select: {
      accessToken: true,
    },
  });

  return account?.accessToken || null;
}

/**
 * Check if user has GitHub connected
 */
export async function checkGitHubConnection(): Promise<
  ActionResponse<{ connected: boolean; username: string | null }>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "github",
      },
      select: {
        accountId: true,
        accessToken: true,
      },
    });

    if (!account || !account.accessToken) {
      return {
        success: true,
        data: { connected: false, username: null },
      };
    }

    // Get GitHub username
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { githubUsername: true },
    });

    return {
      success: true,
      data: {
        connected: true,
        username: user?.githubUsername || null,
      },
    };
  } catch (error) {
    console.error("[GITHUB] Error checking connection:", error);
    return { success: false, error: "Error al verificar conexion" };
  }
}

/**
 * Fetch user's GitHub repositories
 */
export async function fetchGitHubRepos(): Promise<
  ActionResponse<GitHubRepo[]>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const token = await getGitHubToken(session.user.id);

    if (!token) {
      return {
        success: false,
        error: "GitHub no conectado. Conecta tu cuenta de GitHub primero.",
      };
    }

    // Fetch repositories from GitHub API
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=50",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CRMDev",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: "Token de GitHub expirado. Reconecta tu cuenta.",
        };
      }
      return {
        success: false,
        error: `Error de GitHub: ${response.statusText}`,
      };
    }

    const repos: GitHubRepo[] = await response.json();

    return { success: true, data: repos };
  } catch (error) {
    console.error("[GITHUB] Error fetching repos:", error);
    return { success: false, error: "Error al obtener repositorios" };
  }
}

/**
 * Import a GitHub repository as a project
 */
export async function importGitHubRepo(
  repo: {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
  }
): Promise<ActionResponse<{ projectId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Check if project already exists with this repo URL
    const existing = await prisma.project.findFirst({
      where: {
        organizationId: session.session.activeOrganizationId,
        repoUrl: repo.html_url,
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Este repositorio ya esta importado como proyecto",
      };
    }

    // Create project from repo with language in techStack
    const techStack = repo.language ? [repo.language] : [];

    const project = await prisma.project.create({
      data: {
        name: repo.name,
        description: repo.description || `Importado desde GitHub: ${repo.full_name}`,
        status: "NOT_STARTED",
        repoUrl: repo.html_url,
        techStack,
        organizationId: session.session.activeOrganizationId,
      },
      select: { id: true },
    });

    revalidatePath("/projects");
    revalidatePath("/integrations");

    return { success: true, data: { projectId: project.id } };
  } catch (error) {
    console.error("[GITHUB] Error importing repo:", error);
    return { success: false, error: "Error al importar repositorio" };
  }
}

/**
 * Sync GitHub user data (username, avatar)
 */
export async function syncGitHubProfile(): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const token = await getGitHubToken(session.user.id);

    if (!token) {
      return { success: false, error: "GitHub no conectado" };
    }

    // Fetch user profile from GitHub
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CRMDev",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Error al obtener perfil de GitHub" };
    }

    const profile = await response.json();

    // Update user with GitHub data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        githubUsername: profile.login,
        image: profile.avatar_url,
        isVerifiedDev: true,
      },
    });

    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[GITHUB] Error syncing profile:", error);
    return { success: false, error: "Error al sincronizar perfil" };
  }
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: Array<{ name: string; color: string }>;
  assignee: { login: string } | null;
  user: { login: string };
}

/**
 * Import open issues from a GitHub repository as tasks
 */
export async function importGitHubIssues(
  projectId: string
): Promise<ActionResponse<{ imported: number; skipped: number }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Get project and verify it has a repo URL
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.session.activeOrganizationId,
      },
    });

    if (!project) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    if (!project.repoUrl) {
      return {
        success: false,
        error: "El proyecto no tiene un repositorio de GitHub vinculado",
      };
    }

    // Extract owner/repo from URL
    const repoMatch = project.repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!repoMatch) {
      return { success: false, error: "URL de repositorio invalida" };
    }
    const repoFullName = repoMatch[1].replace(/\.git$/, "");

    // Get GitHub token
    const token = await getGitHubToken(session.user.id);
    if (!token) {
      return { success: false, error: "GitHub no conectado" };
    }

    // Fetch open issues from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/issues?state=open&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CRMDev",
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Error de GitHub: ${response.statusText}`,
      };
    }

    const issues: GitHubIssue[] = await response.json();

    // Filter out pull requests (GitHub API returns PRs as issues)
    const actualIssues = issues.filter(
      (issue) => !("pull_request" in issue)
    );

    let imported = 0;
    let skipped = 0;

    for (const issue of actualIssues) {
      // Check if task already exists
      const existingTask = await prisma.task.findFirst({
        where: {
          githubRepoFullName: repoFullName,
          githubIssueNumber: issue.number,
        },
      });

      if (existingTask) {
        skipped++;
        continue;
      }

      // Map labels to priority
      const labelNames = issue.labels.map((l) => l.name.toLowerCase());
      let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
      if (labelNames.includes("critical") || labelNames.includes("urgent") || labelNames.includes("p0")) {
        priority = "URGENT";
      } else if (labelNames.includes("high") || labelNames.includes("important") || labelNames.includes("p1")) {
        priority = "HIGH";
      } else if (labelNames.includes("low") || labelNames.includes("minor") || labelNames.includes("p3")) {
        priority = "LOW";
      }

      // Extract dev labels
      const devLabels = issue.labels
        .map((l) => l.name.toLowerCase())
        .filter((name) =>
          ["bug", "feature", "enhancement", "documentation", "refactor", "hotfix"].includes(name)
        );

      // Find assignee
      let assigneeId: string | null = null;
      if (issue.assignee) {
        const assignee = await prisma.user.findFirst({
          where: { githubUsername: issue.assignee.login },
        });
        assigneeId = assignee?.id || null;
      }

      // Create task
      await prisma.task.create({
        data: {
          organizationId: session.session.activeOrganizationId,
          projectId: project.id,
          title: issue.title,
          description: issue.body || null,
          status: "TODO",
          priority,
          githubIssueNumber: issue.number,
          githubRepoFullName: repoFullName,
          issueUrl: issue.html_url,
          labels: devLabels,
          creatorId: session.user.id,
          assigneeId,
          order: 0,
        },
      });

      imported++;
    }

    revalidatePath("/tasks");
    revalidatePath(`/projects/${projectId}`);

    return {
      success: true,
      data: { imported, skipped },
    };
  } catch (error) {
    console.error("[GITHUB] Error importing issues:", error);
    return { success: false, error: "Error al importar issues" };
  }
}
