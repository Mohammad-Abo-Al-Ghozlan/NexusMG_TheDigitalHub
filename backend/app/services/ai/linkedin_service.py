"""
LinkedIn Service - Profile fetching via Proxycurl with manual fallback
"""
import httpx
from typing import Dict, Any, Optional
from app.config import settings


class LinkedInService:
    PROXYCURL_API_URL = "https://nubela.co/proxycurl/api/v2/linkedin"
    
    def __init__(self):
        self.api_key = settings.PROXYCURL_API_KEY.get_secret_value() or settings.LinkdAPI_API_KEY.get_secret_value()
    
    async def fetch_profile(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """Fetch LinkedIn profile via Proxycurl or LinkdAPI."""
        if not self.api_key:
            return None
        
        is_linkdapi = self.api_key.startswith("li-")
        url = "https://api.linkdapi.com/v1/linkedin/profile" if is_linkdapi else self.PROXYCURL_API_URL
        headers = {"x-api-key": self.api_key} if is_linkdapi else {"Authorization": f"Bearer {self.api_key}"}
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
                    # LinkdAPI might have a different structure, but we'll try to parse it
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
    
    def _parse_profile(self, data: Dict) -> Dict[str, Any]:
        """Parse LinkedIn profile response into standardized format."""
        # Handle LinkdAPI wrapper if present
        person = data.get("person", data)
        
        return {
            "full_name": person.get("full_name") or person.get("name") or person.get("fullName"),
            "headline": person.get("headline"),
            "summary": person.get("summary") or person.get("about") or person.get("description"),
            "location": person.get("city") or person.get("location"),
            "country": person.get("country_full_name") or person.get("countryCode"),
            "industry": person.get("industry"),
            "profile_pic_url": person.get("profile_pic_url") or person.get("photoUrl") or person.get("avatarUrl"),
            "public_identifier": person.get("public_identifier") or person.get("publicIdentifier") or person.get("id"),
            "connections": person.get("connections") or person.get("connectionsCount") or 0,
            "follower_count": person.get("follower_count") or person.get("followersCount") or 0,
            "experiences": [
                {
                    "title": exp.get("title"),
                    "company": exp.get("company") or exp.get("companyName"),
                    "location": exp.get("location"),
                    "starts_at": exp.get("starts_at") or exp.get("startDate"),
                    "ends_at": exp.get("ends_at") or exp.get("endDate"),
                    "description": exp.get("description")
                }
                for exp in (person.get("experiences") or person.get("positions") or [])
            ],
            "education": [
                {
                    "school": edu.get("school") or edu.get("schoolName"),
                    "degree_name": edu.get("degree_name") or edu.get("degree"),
                    "field_of_study": edu.get("field_of_study") or edu.get("field"),
                    "starts_at": edu.get("starts_at") or edu.get("startDate"),
                    "ends_at": edu.get("ends_at") or edu.get("endDate")
                }
                for edu in (person.get("education") or person.get("educations") or [])
            ],
            "skills": person.get("skills") or [],
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
        scores = {
            "has_photo": 10 if profile.get("profile_pic_url") else 0,
            "has_headline": 10 if profile.get("headline") else 0,
            "has_summary": 15 if profile.get("summary") else 0,
            "has_experience": min(20, len(profile.get("experiences", [])) * 5),
            "has_education": min(15, len(profile.get("education", [])) * 5),
            "has_skills": min(15, len(profile.get("skills", [])) * 3),
            "has_certifications": min(10, len(profile.get("certifications", [])) * 5),
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
