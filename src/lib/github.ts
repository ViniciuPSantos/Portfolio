/** Consulta e agregação da atividade pública no GitHub (usado por /api/github). */

export const GITHUB_QUERY = /* GraphQL */ `
  query Activity($login: String!) {
    user(login: $login) {
      publicRepos: repositories(privacy: PUBLIC, ownerAffiliations: OWNER) {
        totalCount
      }
      sources: repositories(first: 100, privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false) {
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
      recent: repositories(
        first: 6
        privacy: PUBLIC
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 5) {
                  nodes {
                    abbreviatedOid
                    messageHeadline
                    committedDate
                    url
                    author {
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;

interface CommitNode {
  abbreviatedOid: string;
  messageHeadline: string;
  committedDate: string;
  url: string;
  author: { user: { login: string } | null } | null;
}

export interface GitHubQueryResult {
  user: {
    publicRepos: { totalCount: number };
    sources: { nodes: { languages: { edges: { size: number; node: { name: string } }[] } }[] };
    recent: {
      nodes: {
        name: string;
        defaultBranchRef: { target: { history?: { nodes: CommitNode[] } } | null } | null;
      }[];
    };
    contributionsCollection: { contributionCalendar: { totalContributions: number } };
  } | null;
}

export interface Activity {
  repos: number;
  contributions: number;
  languages: { name: string; pct: number }[];
  commits: { repo: string; message: string; hash: string; url: string; date: string }[];
}

export function aggregate(result: GitHubQueryResult, login: string, topLanguages = 5): Activity | null {
  const user = result.user;
  if (!user) return null;

  const bytes = new Map<string, number>();
  for (const repo of user.sources.nodes) {
    for (const edge of repo.languages.edges) {
      bytes.set(edge.node.name, (bytes.get(edge.node.name) ?? 0) + edge.size);
    }
  }
  const total = [...bytes.values()].reduce((a, b) => a + b, 0);
  const languages = [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topLanguages)
    .map(([name, size]) => ({ name, pct: total ? Math.round((size / total) * 1000) / 10 : 0 }));

  const commits = user.recent.nodes
    .flatMap((repo) =>
      (repo.defaultBranchRef?.target?.history?.nodes ?? [])
        .filter((c) => c.author?.user?.login?.toLowerCase() === login.toLowerCase())
        .map((c) => ({
          repo: repo.name,
          message: c.messageHeadline.slice(0, 140),
          hash: c.abbreviatedOid.slice(0, 7),
          url: c.url,
          date: c.committedDate,
        })),
    )
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 3);

  return {
    repos: user.publicRepos.totalCount,
    contributions: user.contributionsCollection.contributionCalendar.totalContributions,
    languages,
    commits,
  };
}
