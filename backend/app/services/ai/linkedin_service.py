"""
LinkedIn Service - Profile fetching via Proxycurl/LinkdAPI with manual fallback
"""
import httpx
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from app.config import settings


class LinkedInService:
    PROXYCURL_API_URL = "https://nubela.co/proxycurl/api/v2/linkedin"
    
    def __init__(self):
        self.proxycurl_key = settings.PROXYCURL_API_KEY.get_secret_value().strip()
        self.linkdapi_key = settings.LinkdAPI_API_KEY.get_secret_value().strip()
        self.linkdapi_base_url = settings.LINKDAPI_BASE_URL.rstrip("/")
        self.provider: Optional[str] = None
        self.api_key: Optional[str] = None

        if self.linkdapi_key:
            self.provider = "linkdapi"
            self.api_key = self.linkdapi_key
        elif self.proxycurl_key:
            self.provider = "proxycurl"
            self.api_key = self.proxycurl_key
    
    async def fetch_profile(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """Fetch LinkedIn profile via Proxycurl or LinkdAPI."""
        if not self.api_key:
            return None

        if self.provider == "linkdapi":
            username = self._extract_username(linkedin_url)
            if not username:
                return {"error": "Invalid LinkedIn profile URL"}

            profile, error = await self._fetch_linkdapi_profile(username)
            if profile:
                return profile
            return {"error": error or "LinkdAPI profile fetch failed"}

        url = self.PROXYCURL_API_URL
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {"url": linkedin_url}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                print(f"Fetching LinkedIn profile from {url} for URL: {linkedin_url}")
                response = await client.get(
                    url,
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                print(f"LinkedIn API response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"LinkedIn API data received (keys): {list(data.keys())}")
                    return self._parse_profile(data)
                elif response.status_code == 404:
                    print("LinkedIn profile not found (404)")
                    return {"error": "Profile not found"}
                else:
                    print(f"LinkedIn API error: {response.status_code} - {response.text}")
                    return {"error": f"API error: {response.status_code}"}
            except Exception as e:
                print(f"LinkedIn API exception: {e}")
                return {"error": str(e)}

    async def _fetch_linkdapi_profile(self, username: str) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
        headers = {"X-linkdapi-apikey": self.api_key}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Add Accept header as recommended
            headers["Accept"] = "application/json"
            
            # Step 1: Get URN via /profile/username-to-urn
            urn_url = f"{self.linkdapi_base_url}/profile/username-to-urn"
            try:
                print(f"Fetching LinkdAPI URN lookup: {urn_url}?username={username}")
                response = await client.get(urn_url, headers=headers, params={"username": username})
                print(f"LinkdAPI URN lookup response: {response.status_code}")
                
                if response.status_code != 200:
                    # Fallback: Try /profile/overview if username-to-urn fails
                    overview_url = f"{self.linkdapi_base_url}/profile/overview"
                    print(f"Falling back to overview lookup: {overview_url}")
                    response = await client.get(overview_url, headers=headers, params={"username": username})
                    if response.status_code != 200:
                        return None, f"Failed to lookup profile URN (Status {response.status_code})"
                
                lookup_data = response.json()
                if not lookup_data.get("success"):
                    return None, f"LinkdAPI lookup error: {lookup_data.get('message', 'Unknown error')}"
                
                profile_urn = lookup_data.get("data", {}).get("urn")
                if not profile_urn:
                    # Fallback: Maybe the lookup_data is actually the profile? 
                    # (Some endpoints return the profile if URN not found but success is True)
                    if lookup_data.get("data", {}).get("fullName"):
                        return self._parse_profile(lookup_data), None
                    return None, "Profile URN not found in response"
                
                print(f"Found profile URN: {profile_urn}")
                
                # Step 2: Get Full Profile via /profile/full using the URN
                full_url = f"{self.linkdapi_base_url}/profile/full"
                print(f"Fetching full LinkdAPI profile using URN: {full_url}?urn={profile_urn}")
                response = await client.get(full_url, headers=headers, params={"urn": profile_urn})
                print(f"LinkdAPI full profile response: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        return self._parse_profile(data), None
                    else:
                        print(f"Full profile fetch reported failure: {data.get('message')}")
                        # Final Attempt: Try /profile/full with username directly
                        print(f"Final attempt: Direct fetch with username: {username}")
                        response = await client.get(full_url, headers=headers, params={"username": username})
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("success"):
                                return self._parse_profile(data), None
                        
                        return self._parse_profile(lookup_data), f"Full fetch failed: {data.get('message')}"
                
                return self._parse_profile(lookup_data), f"Full profile fetch status {response.status_code}"

            except Exception as exc:
                print(f"LinkdAPI fetch exception: {exc}")
                return None, str(exc)

    def _extract_username(self, value: str) -> Optional[str]:
        if not value:
            return None

        raw = value.strip()
        if "linkedin.com" not in raw and "/" not in raw:
            return raw

        if not raw.startswith("http://") and not raw.startswith("https://"):
            raw = f"https://{raw}"

        parsed = urlparse(raw)
        path = parsed.path.strip("/")
        if not path:
            return None

        segments = [seg for seg in path.split("/") if seg]
        if not segments:
            return None

        if segments[0] in {"in", "pub"} and len(segments) > 1:
            return segments[1]

        if segments[0] == "company":
            return None

        return segments[0]
    
    def _parse_profile(self, data: Dict) -> Dict[str, Any]:
        """Parse LinkedIn profile response into standardized format."""
        # Handle LinkdAPI wrapper if present
        if isinstance(data.get("data"), dict):
            data = data["data"]
        # Compatibility with older Proxycurl format or other wrappers
        elif isinstance(data.get("person"), dict):
            data = data["person"]

        person = data
        full_name = (
            person.get("full_name")
            or person.get("fullName")
            or person.get("name")
            or " ".join(filter(None, [person.get("firstName"), person.get("lastName")])).strip()
            or None
        )
        
        return {
            "full_name": full_name,
            "headline": person.get("headline"),
            "summary": person.get("summary") or person.get("about") or person.get("description"),
            "location": person.get("city") or person.get("location") or person.get("geoLocationName"),
            "country": person.get("country_full_name") or person.get("countryCode") or person.get("geoCountryName"),
            "industry": person.get("industry"),
            "profile_pic_url": person.get("profile_pic_url") or person.get("photoUrl") or person.get("avatarUrl") or person.get("profilePictureUrl"),
            "public_identifier": person.get("public_identifier") or person.get("publicIdentifier") or person.get("vanityName") or person.get("id"),
            "connections": person.get("connections") or person.get("connectionsCount") or person.get("networkSize") or 0,
            "follower_count": person.get("follower_count") or person.get("followersCount") or person.get("followers") or 0,
            "experiences": [
                {
                    "title": exp.get("title"),
                    "company": exp.get("company") or exp.get("companyName") or exp.get("name"),
                    "location": exp.get("location"),
                    "starts_at": exp.get("starts_at") or exp.get("startDate"),
                    "ends_at": exp.get("ends_at") or exp.get("endDate"),
                    "description": exp.get("description")
                }
                for exp in (person.get("experiences") or person.get("positions") or person.get("experience") or person.get("CurrentPositions") or [])
            ],
            "education": [
                {
                    "school": edu.get("school") or edu.get("schoolName"),
                    "degree_name": edu.get("degree_name") or edu.get("degree"),
                    "field_of_study": edu.get("field_of_study") or edu.get("field"),
                    "starts_at": edu.get("starts_at") or edu.get("startDate"),
                    "ends_at": edu.get("ends_at") or edu.get("endDate")
                }
                for edu in (person.get("education") or person.get("educations") or person.get("educationHistory") or [])
            ],
            "skills": person.get("skills") or person.get("skillsList") or [],
            "certifications": [
                {
                    "name": cert.get("name"),
                    "authority": cert.get("authority") or cert.get("issuingOrganization"),
                    "starts_at": cert.get("starts_at") or cert.get("issueDate")
                }
                for cert in (person.get("certifications") or [])
            ],
            "languages": person.get("languages") or [],
            "accomplishments": {
                "publications": len(person.get("accomplishment_publications") or person.get("publications") or []),
                "patents": len(person.get("accomplishment_patents") or person.get("patents") or []),
                "courses": len(person.get("accomplishment_courses") or person.get("courses") or []),
                "projects": len(person.get("accomplishment_projects") or person.get("projects") or []),
                "honors_awards": len(person.get("accomplishment_honors_awards") or person.get("awards") or [])
            }
        }
    
    def validate_manual_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize manually entered LinkedIn data."""
        return {
            "full_name": data.get("full_name", ""),
            "headline": data.get("headline", ""),
            "summary": data.get("summary", ""),
            "location": data.get("location", ""),
            "country": data.get("country", ""),
            "industry": data.get("industry", ""),
            "profile_pic_url": None,
            "has_profile_pic": data.get("has_profile_pic", False),
            "public_identifier": None,
            "connections": data.get("connections", 0),
            "follower_count": data.get("follower_count", 0),
            "experiences": data.get("experiences", []),
            "education": data.get("education", []),
            "skills": data.get("skills", []),
            "certifications": data.get("certifications", []),
            "languages": data.get("languages", []),
            "accomplishments": data.get("accomplishments", {}),
            "is_manual_entry": True
        }
    def calculate_profile_completeness(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate profile completeness score."""
        # For manual entries with a single bundled experience, count length/paragraphs as proxy for multiple items
        experiences = profile.get("experiences", [])
        exp_score = min(20, len(experiences) * 5)
        if len(experiences) == 1 and profile.get("is_manual_entry"):
            desc = experiences[0].get("description", "")
            # Give points for content length in manual entry
            if len(desc) > 200: exp_score = 20
            elif len(desc) > 100: exp_score = 10
            
        scores = {
            "has_photo": 10 if (profile.get("profile_pic_url") or profile.get("has_profile_pic")) else 0,
            "has_headline": 10 if profile.get("headline") else 0,
            "has_summary": 15 if profile.get("summary") else 0,
            "has_experience": exp_score,
            "has_education": min(15, len(profile.get("education", [])) * 5),
            "has_skills": min(15, len(profile.get("skills", [])) * 3),
            "has_location": 5 if profile.get("location") else 0,
            "has_connections": 10 if (profile.get("connections", 0) or 0) > 0 else 0,
            "has_certifications": min(5, len(profile.get("certifications", [])) * 5),
            "has_languages": min(5, len(profile.get("languages", [])) * 2)
        }
        
        total = sum(scores.values())
        
        return {
            "completeness_score": total,
            "breakdown": scores,
            "missing_sections": [k.replace("has_", "") for k, v in scores.items() if v == 0]
        }


# Singleton instance
linkedin_service = LinkedInService()
