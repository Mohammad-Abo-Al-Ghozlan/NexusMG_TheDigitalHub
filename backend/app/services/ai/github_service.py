"""
GitHub API Service - Fetch and analyze GitHub profiles
"""
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings


class GitHubService:
    BASE_URL = "https://api.github.com"
    
    def __init__(self):
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "NexusMG-Platform"
        }
        token = settings.GITHUB_TOKEN.get_secret_value()
        if token:
            self.headers["Authorization"] = f"token {token}"
    
    async def get_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch user profile data."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/users/{username}",
                    headers=self.headers
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "username": data.get("login"),
                        "name": data.get("name"),
                        "bio": data.get("bio"),
                        "company": data.get("company"),
                        "location": data.get("location"),
                        "email": data.get("email"),
                        "blog": data.get("blog"),
                        "public_repos": data.get("public_repos", 0),
                        "public_gists": data.get("public_gists", 0),
                        "followers": data.get("followers", 0),
                        "following": data.get("following", 0),
                        "created_at": data.get("created_at"),
                        "avatar_url": data.get("avatar_url"),
                        "hireable": data.get("hireable")
                    }
            except Exception as e:
                print(f"GitHub API error: {e}")
            return None
    
    async def get_user_repositories(self, username: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Fetch user repositories."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/users/{username}/repos",
                    headers=self.headers,
                    params={
                        "sort": "updated",
                        "direction": "desc",
                        "per_page": limit
                    }
                )
                if response.status_code == 200:
                    repos = response.json()
                    return [
                        {
                            "name": repo.get("name"),
                            "description": repo.get("description"),
                            "language": repo.get("language"),
                            "stars": repo.get("stargazers_count", 0),
                            "forks": repo.get("forks_count", 0),
                            "watchers": repo.get("watchers_count", 0),
                            "open_issues": repo.get("open_issues_count", 0),
                            "is_fork": repo.get("fork", False),
                            "created_at": repo.get("created_at"),
                            "updated_at": repo.get("updated_at"),
                            "pushed_at": repo.get("pushed_at"),
                            "size": repo.get("size", 0),
                            "has_readme": None,
                            "license": repo.get("license", {}).get("name") if repo.get("license") else None,
                            "topics": repo.get("topics", []),
                            "url": repo.get("html_url")
                        }
                        for repo in repos
                    ]
            except Exception as e:
                print(f"GitHub API error: {e}")
            return []
    
    def _aggregate_languages(self, repos: List[Dict[str, Any]]) -> Dict[str, int]:
        """Aggregate languages across repositories."""
        languages: Dict[str, int] = {}
        for repo in repos:
            lang = repo.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
        return dict(sorted(languages.items(), key=lambda x: x[1], reverse=True))
    
    async def get_contribution_stats(self, username: str) -> Dict[str, Any]:
        """Get contribution statistics (commits, PRs, issues)."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            stats = {
                "total_commits": 0,
                "total_prs": 0,
                "total_issues": 0,
                "recent_activity": []
            }
            
            try:
                # Get recent events
                response = await client.get(
                    f"{self.BASE_URL}/users/{username}/events",
                    headers=self.headers,
                    params={"per_page": 100}
                )
                
                if response.status_code == 200:
                    events = response.json()
                    
                    for event in events:
                        event_type = event.get("type")
                        if event_type == "PushEvent":
                            commits = event.get("payload", {}).get("commits", [])
                            stats["total_commits"] += len(commits)
                        elif event_type == "PullRequestEvent":
                            stats["total_prs"] += 1
                        elif event_type == "IssuesEvent":
                            stats["total_issues"] += 1
                        
                        stats["recent_activity"].append({
                            "type": event_type,
                            "repo": event.get("repo", {}).get("name"),
                            "created_at": event.get("created_at")
                        })
            except Exception as e:
                print(f"GitHub API error: {e}")
            
            return stats
    
    async def analyze_profile(self, username: str) -> Dict[str, Any]:
        """Complete profile analysis."""
        profile = await self.get_user_profile(username)
        
        if not profile:
            return {
                "error": "User not found",
                "username": username
            }
        
        repos = await self.get_user_repositories(username)
        languages = self._aggregate_languages(repos)
        stats = await self.get_contribution_stats(username)
        
        # Calculate basic metrics
        original_repos = [r for r in repos if not r.get("is_fork")]
        total_stars = sum(r.get("stars", 0) for r in repos)
        repos_with_readme = len([r for r in repos if r.get("description")])
        
        return {
            "profile": profile,
            "repositories": repos[:10],  # Top 10 for analysis
            "languages": languages,
            "stats": stats,
            "metrics": {
                "total_repos": len(repos),
                "original_repos": len(original_repos),
                "total_stars": total_stars,
                "repos_with_description": repos_with_readme,
                "language_diversity": len(languages),
                "avg_repo_size": sum(r.get("size", 0) for r in repos) / len(repos) if repos else 0
            }
        }


# Singleton instance
github_service = GitHubService()
