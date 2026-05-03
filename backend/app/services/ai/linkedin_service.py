"""
LinkedIn Service - Profile fetching via Proxycurl with manual fallback
"""
import httpx
from typing import Dict, Any, Optional
from app.config import settings


class LinkedInService:
    PROXYCURL_API_URL = "https://nubela.co/proxycurl/api/v2/linkedin"
    
    def __init__(self):
        self.api_key = settings.LinkdAPI_API_KEY
    
    async def fetch_profile(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """Fetch LinkedIn profile via Proxycurl API."""
        if not self.api_key:
            return None
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.PROXYCURL_API_URL,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    params={"url": linkedin_url},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_profile(data)
                elif response.status_code == 404:
                    return {"error": "Profile not found"}
                else:
                    return {"error": f"API error: {response.status_code}"}
            except Exception as e:
                print(f"Proxycurl API error: {e}")
                return {"error": str(e)}
    
    def _parse_profile(self, data: Dict) -> Dict[str, Any]:
        """Parse Proxycurl response into standardized format."""
        return {
            "full_name": data.get("full_name"),
            "headline": data.get("headline"),
            "summary": data.get("summary"),
            "location": data.get("city"),
            "country": data.get("country_full_name"),
            "industry": data.get("industry"),
            "profile_pic_url": data.get("profile_pic_url"),
            "public_identifier": data.get("public_identifier"),
            "connections": data.get("connections"),
            "follower_count": data.get("follower_count"),
            "experiences": [
                {
                    "title": exp.get("title"),
                    "company": exp.get("company"),
                    "location": exp.get("location"),
                    "starts_at": exp.get("starts_at"),
                    "ends_at": exp.get("ends_at"),
                    "description": exp.get("description")
                }
                for exp in (data.get("experiences") or [])
            ],
            "education": [
                {
                    "school": edu.get("school"),
                    "degree_name": edu.get("degree_name"),
                    "field_of_study": edu.get("field_of_study"),
                    "starts_at": edu.get("starts_at"),
                    "ends_at": edu.get("ends_at")
                }
                for edu in (data.get("education") or [])
            ],
            "skills": data.get("skills") or [],
            "certifications": [
                {
                    "name": cert.get("name"),
                    "authority": cert.get("authority"),
                    "starts_at": cert.get("starts_at")
                }
                for cert in (data.get("certifications") or [])
            ],
            "languages": data.get("languages") or [],
            "accomplishments": {
                "publications": len(data.get("accomplishment_publications") or []),
                "patents": len(data.get("accomplishment_patents") or []),
                "courses": len(data.get("accomplishment_courses") or []),
                "projects": len(data.get("accomplishment_projects") or []),
                "honors_awards": len(data.get("accomplishment_honors_awards") or [])
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
