"""
Groq AI Service - LLM integration for all AI-powered evaluations
"""
from groq import Groq
from typing import Dict, Any, List, Optional
import json
import logging
import time
import anyio
from app.config import settings

ai_logger = logging.getLogger("nexusmg.ai")


class GroqService:
    def __init__(self):
        api_key = settings.GROQ_API_KEY.get_secret_value()
        self.client = Groq(api_key=api_key) if api_key else None
        self.model = settings.GROQ_MODEL
        self.allow_mock = settings.ALLOW_MOCK_AI
    
    async def analyze(self, prompt: str, system_prompt: str = None) -> str:
        """Send a prompt to Groq and get a response."""
        start_time = time.perf_counter()
        if not self.client:
            if self.allow_mock:
                response = self._mock_response(prompt)
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                ai_logger.info("ai.groq.mock duration_ms=%.2f model=%s", duration_ms, self.model)
                return response
            raise RuntimeError("GROQ_API_KEY is not configured")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        def _call_api():
            return self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
                timeout=30
            )

        try:
            response = await anyio.to_thread.run_sync(_call_api)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            ai_logger.info("ai.groq.success duration_ms=%.2f model=%s", duration_ms, self.model)
            return response.choices[0].message.content
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            ai_logger.warning(
                "ai.groq.error duration_ms=%.2f model=%s error=%s",
                duration_ms,
                self.model,
                repr(e)
            )
            if self.allow_mock:
                ai_logger.info("ai.groq.fallback_to_mock model=%s", self.model)
                return self._mock_response(prompt)
            raise RuntimeError(f"Groq API error ({self.model}): {e}") from e
    
    async def analyze_cv(self, cv_text: str, skills: List[str], experience: List[Dict], education: List[Dict]) -> Dict[str, Any]:
        """Analyze CV content and provide scores and feedback."""
        system_prompt = """You are an expert CV/Resume analyst and career coach. 
        Analyze the CV and provide detailed, actionable feedback for a developer/tech professional.
        Always respond in valid JSON format."""
        
        prompt = f"""Analyze this CV for a tech professional:

CV Text:
{cv_text}

Extracted Skills: {json.dumps(skills)}
Experience: {json.dumps(experience)}
Education: {json.dumps(education)}

Provide analysis in this exact JSON format:
{{
    "format_score": <0-100>,
    "content_score": <0-100>,
    "skills_score": <0-100>,
    "experience_score": <0-100>,
    "overall_score": <0-100>,
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "feedback": "detailed feedback paragraph",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_cv_analysis())
    
    async def analyze_github(self, profile: Dict, repositories: List[Dict], languages: Dict) -> Dict[str, Any]:
        """Analyze GitHub profile and repositories."""
        system_prompt = """You are an expert developer and technical recruiter.
        Analyze GitHub profiles to assess coding skills, activity, and professional potential.
        Always respond in valid JSON format."""
        
        prompt = f"""Analyze this GitHub profile:

Profile:
{json.dumps(profile, indent=2)}

Top Repositories (up to 10):
{json.dumps(repositories[:10], indent=2)}

Languages Used: {json.dumps(languages)}

Provide analysis in this exact JSON format:
{{
    "activity_score": <0-100>,
    "code_quality_score": <0-100>,
    "diversity_score": <0-100>,
    "documentation_score": <0-100>,
    "overall_score": <0-100>,
    "strengths": ["strength1", "strength2", ...],
    "areas_for_improvement": ["area1", "area2", ...],
    "feedback": "detailed feedback paragraph",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_github_analysis())
    
    async def analyze_linkedin(self, profile_data: Dict) -> Dict[str, Any]:
        """Analyze LinkedIn profile."""
        system_prompt = """You are an expert career coach and LinkedIn profile optimizer.
        Analyze LinkedIn profiles and provide actionable feedback for tech professionals.
        Always respond in valid JSON format."""
        
        prompt = f"""Analyze this LinkedIn profile data:

{json.dumps(profile_data, indent=2)}

        CRITICAL INSTRUCTIONS:
        0. PARTIAL DATA: If "is_partial_fetch" is true, it means the API could not retrieve all data (especially experiences). DO NOT penalize the user for this. Instead, focus on the available data and suggest manual entry for a full review.
        1. PHOTO: If "has_profile_pic" is true, the user HAS a profile picture. Do NOT say it is missing. If both "has_profile_pic" is false and "profile_pic_url" is null, gently mention that adding a photo increases engagement, but do not call it a "notable weakness" if other parts are strong.
        2. EXPERIENCE: If the "experiences" array is empty, it is likely a data-fetching limitation. DO NOT state that the user has no experience or that it's a "notable weakness". Instead, state that detailed experience data couldn't be retrieved and suggest the user ensure their profile is public or use manual entry.
        3. ENGAGEMENT: If no activity/posts are present, do NOT claim the user is inactive. Assume activity data is restricted by the API.
        4. ACCURACY: Focus on the data that IS present (Headline, Summary, Skills).

Provide analysis in this exact JSON format:
{{
    "completeness_score": <0-100>,
    "network_score": <0-100>,
    "engagement_score": <0-100>,
    "overall_score": <0-100>,
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "feedback": "detailed feedback paragraph",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        
        # Adjust default values based on profile data
        default_analysis = self._default_linkedin_analysis()
        if profile_data.get("has_profile_pic") or profile_data.get("profile_pic_url"):
            default_analysis["recommendations"] = [r for r in default_analysis["recommendations"] if "photo" not in r.lower()]
            default_analysis["weaknesses"] = [w for w in default_analysis["weaknesses"] if "photo" not in w.lower()]
            
        return self._parse_json_response(response, default_analysis)
    
    async def analyze_idea(self, idea: Dict) -> Dict[str, Any]:
        """Analyze a project/startup idea."""
        system_prompt = """You are an expert startup advisor and technical architect.
        Analyze project ideas for innovation, feasibility, market potential, and technical implementation.
        Always respond in valid JSON format."""
        
        prompt = f"""Analyze this project/startup idea:

Title: {idea.get('title')}
Description: {idea.get('description')}
Problem Statement: {idea.get('problem_statement', 'Not provided')}
Target Audience: {idea.get('target_audience', 'Not provided')}
Proposed Tech Stack: {json.dumps(idea.get('tech_stack', []))}

Provide analysis in this exact JSON format:
{{
    "innovation_score": <0-100>,
    "feasibility_score": <0-100>,
    "market_score": <0-100>,
    "technical_score": <0-100>,
    "overall_score": <0-100>,
    "swot_analysis": {{
        "strengths": ["s1", "s2"],
        "weaknesses": ["w1", "w2"],
        "opportunities": ["o1", "o2"],
        "threats": ["t1", "t2"]
    }},
    "feedback": "detailed feedback paragraph",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_idea_analysis())
    
    async def generate_interview_questions(self, topic: str, difficulty: str, count: int = 5) -> List[Dict]:
        """Generate interview questions for a topic."""
        system_prompt = """You are an expert technical interviewer.
        Generate realistic interview questions that test both technical knowledge and problem-solving.
        Always respond in valid JSON format."""
        
        prompt = f"""Generate {count} challenging and professional interview questions for a tech candidate.
Topic: {topic}
Difficulty: {difficulty}

The questions should test:
1. Deep technical understanding
2. Practical implementation experience
3. Problem-solving approach

Respond in this exact JSON format:
{{
    "questions": [
        {{
            "id": 1, 
            "question": "Clear, specific technical question", 
            "topic": "{topic}", 
            "difficulty": "{difficulty}", 
            "expected_points": ["Key technical point 1", "Implementation detail", "Edge case handling"]
        }},
        ...
    ]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        result = self._parse_json_response(response, {"questions": self._default_interview_questions(topic, difficulty)})
        return result.get("questions", [])
    
    async def analyze_interview_answers(self, questions_with_answers: List[Dict]) -> Dict[str, Any]:
        """Analyze interview answers."""
        system_prompt = """You are an expert technical interviewer.
        Evaluate answers based on technical accuracy, communication clarity, and problem-solving approach.
        Always respond in valid JSON format."""
        
        prompt = f"""Evaluate these interview answers:

{json.dumps(questions_with_answers, indent=2)}

Provide analysis in this exact JSON format:
{{
    "technical_score": <0-100>,
    "communication_score": <0-100>,
    "problem_solving_score": <0-100>,
    "overall_score": <0-100>,
    "questions_analysis": [
        {{"question_id": 1, "score": <0-100>, "feedback": "feedback for this answer"}},
        ...
    ],
    "feedback": "overall feedback paragraph",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_interview_analysis())
    
    async def generate_english_questions(self, assessment_type: str, count: int = 10) -> List[Dict]:
        """Generate English assessment questions."""
        system_prompt = """You are an expert English language assessor.
        Generate questions that test grammar, vocabulary, comprehension, and writing skills.
        Always respond in valid JSON format."""
        
        prompt = f"""Generate {count} professional English assessment questions for a software engineer.
Assessment Type: {assessment_type}
Focus: Professional communication, technical terminology, and workplace scenarios.
EXCLUDE: Reading Comprehension and Listening sections. Focus on Grammar, Vocabulary, and Writing.

Respond in this exact JSON format:
{{
    "questions": [
        {{
            "id": 1, 
            "type": "multiple_choice|fill_blank|writing", 
            "question": "A workplace-relevant question", 
            "options": ["Option A", "Option B", "Option C", "Option D"] or null, 
            "correct_answer": "The correct choice or target phrase", 
            "skill_tested": "grammar|vocabulary|writing"
        }},
        ...
    ]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        result = self._parse_json_response(response, {"questions": self._default_english_questions()})
        return result.get("questions", [])
    
    async def analyze_english_answers(self, questions_with_answers: List[Dict]) -> Dict[str, Any]:
        """Analyze English assessment answers."""
        system_prompt = """You are an expert English language assessor.
        Evaluate answers and determine CEFR proficiency level (A1-C2).
        Always respond in valid JSON format."""
        
        prompt = f"""Evaluate these English assessment answers:

{json.dumps(questions_with_answers, indent=2)}

Provide analysis in this exact JSON format:
{{
    "grammar_score": <0-100>,
    "vocabulary_score": <0-100>,
    "fluency_score": <0-100>,
    "comprehension_score": <0-100>,
    "overall_score": <0-100>,
    "cefr_level": "A1|A2|B1|B2|C1|C2",
    "feedback": "detailed feedback paragraph",
    "recommendations": ["recommendation1", "recommendation2", ...]
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_english_analysis())
    
    async def generate_readiness_summary(self, scores: Dict, user_data: Dict) -> Dict[str, Any]:
        """Generate overall readiness summary and career recommendations."""
        system_prompt = """You are an expert career advisor for tech professionals.
        Analyze evaluation scores and provide personalized career guidance.
        Always respond in valid JSON format."""
        
        prompt = f"""Generate a readiness assessment summary:

User Profile:
{json.dumps(user_data, indent=2)}

Evaluation Scores:
{json.dumps(scores, indent=2)}

Provide analysis in this exact JSON format:
{{
    "overall_readiness": "<Not Ready|Developing|Ready|Highly Ready>",
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "recommendations": ["recommendation1", "recommendation2", ...],
    "career_suggestions": ["role1", "role2", ...],
    "summary": "comprehensive summary paragraph"
}}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_readiness_summary())
    
    async def generate_onboarding_questions(self) -> List[Dict]:
        """Generate dynamic onboarding questions for a new trainee."""
        system_prompt = """You are an expert tech career advisor. 
        Generate 3 high-value questions to understand a junior/mid developer's career goals and current tech stack.
        Always respond in valid JSON format."""
        
        prompt = """Generate 3 onboarding questions.
        Provide them in this exact JSON format:
        {
            "questions": [
                {
                    "id": "q1",
                    "text": "The question text",
                    "type": "text"
                }
            ]
        }"""
        
        response = await self.analyze(prompt, system_prompt)
        result = self._parse_json_response(response, {"questions": self._default_onboarding_questions()})
        return result.get("questions", [])

    async def analyze_onboarding_answers(self, answers: List[Dict]) -> Dict[str, Any]:
        """Analyze onboarding answers to establish a baseline profile."""
        system_prompt = """You are an expert career coach. 
        Analyze the trainee's answers to understand their background and goals.
        Always respond in valid JSON format."""
        
        prompt = f"""Analyze these onboarding answers:
        {json.dumps(answers, indent=2)}

        Provide analysis in this exact JSON format:
        {{
            "summary": "A short 2-3 sentence summary of the candidate's profile.",
            "estimated_baseline_score": <0-100>
        }}"""
        
        response = await self.analyze(prompt, system_prompt)
        return self._parse_json_response(response, self._default_onboarding_analysis())
    
    def _parse_json_response(self, response: str, default: Dict) -> Dict:
        """Parse JSON from LLM response."""
        try:
            # Try to extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        return default
    
    def _mock_response(self, prompt: str) -> str:
        """Return mock response when API is not available."""
        return json.dumps({
            "overall_score": 75,
            "feedback": "This is a mock response. Configure GROQ_API_KEY for real AI analysis.",
            "recommendations": ["Configure AI API key for detailed analysis"]
        })
    
    def _default_cv_analysis(self) -> Dict:
        return {
            "format_score": 70,
            "content_score": 70,
            "skills_score": 70,
            "experience_score": 70,
            "overall_score": 70,
            "strengths": ["Good structure"],
            "weaknesses": ["Could add more details"],
            "feedback": "Your CV shows potential. Consider adding more specific achievements.",
            "recommendations": ["Add quantifiable achievements", "Include more technical projects"]
        }
    
    def _default_github_analysis(self) -> Dict:
        return {
            "activity_score": 65,
            "code_quality_score": 70,
            "diversity_score": 60,
            "documentation_score": 55,
            "overall_score": 62,
            "strengths": ["Active contributor"],
            "areas_for_improvement": ["Add README files"],
            "feedback": "Your GitHub profile shows consistent activity.",
            "recommendations": ["Improve documentation", "Diversify project types"]
        }
    
    def _default_linkedin_analysis(self) -> Dict:
        return {
            "completeness_score": 65,
            "network_score": 50,
            "engagement_score": 45,
            "overall_score": 53,
            "strengths": ["Profile exists"],
            "weaknesses": ["Incomplete sections"],
            "feedback": "Your LinkedIn profile needs more attention.",
            "recommendations": ["Complete all sections", "Add a professional photo"]
        }
    
    def _default_idea_analysis(self) -> Dict:
        return {
            "innovation_score": 70,
            "feasibility_score": 65,
            "market_score": 60,
            "technical_score": 70,
            "overall_score": 66,
            "swot_analysis": {
                "strengths": ["Interesting concept"],
                "weaknesses": ["Needs validation"],
                "opportunities": ["Growing market"],
                "threats": ["Competition"]
            },
            "feedback": "Your idea has potential but needs more research.",
            "recommendations": ["Conduct market research", "Build an MVP"]
        }
    
    def _default_interview_questions(self, topic: str, difficulty: str) -> List[Dict]:
        return [
            {
                "id": 1, 
                "question": f"How do you ensure scalability and performance when working with {topic} in a large-scale production environment?", 
                "topic": topic, 
                "difficulty": difficulty, 
                "expected_points": ["Load balancing", "Caching strategies", "Database optimization"]
            },
            {
                "id": 2, 
                "question": f"Describe a complex bug or architectural challenge you faced with {topic} and how you resolved it.", 
                "topic": topic, 
                "difficulty": difficulty, 
                "expected_points": ["Root cause analysis", "Systematic debugging", "Preventative measures"]
            },
            {
                "id": 3, 
                "question": f"What are the most significant trade-offs to consider when using {topic} compared to alternative technologies?", 
                "topic": topic, 
                "difficulty": difficulty, 
                "expected_points": ["Memory vs CPU", "Development speed vs Runtime performance", "Community support"]
            }
        ]
    
    def _default_interview_analysis(self) -> Dict:
        return {
            "technical_score": 70,
            "communication_score": 75,
            "problem_solving_score": 70,
            "overall_score": 72,
            "questions_analysis": [],
            "feedback": "Good performance overall.",
            "recommendations": ["Practice more technical questions"]
        }
    
    def _default_english_questions(self) -> List[Dict]:
        return [
            {
                "id": 1, 
                "type": "multiple_choice", 
                "question": "Which sentence is most professional for a pull request review?", 
                "options": [
                    "Your code is bad, fix it.", 
                    "I suggest refactoring this logic to improve readability.", 
                    "This is not how I would do it.", 
                    "Can you rewrite this whole part?"
                ], 
                "correct_answer": "I suggest refactoring this logic to improve readability.", 
                "skill_tested": "vocabulary"
            },
            {
                "id": 2, 
                "type": "fill_blank", 
                "question": "The team decided to ___ the deployment until the critical bug was fixed.", 
                "options": ["defer", "accelerate", "ignore", "finalize"], 
                "correct_answer": "defer", 
                "skill_tested": "vocabulary"
            }
        ]
    
    def _default_english_analysis(self) -> Dict:
        return {
            "grammar_score": 70,
            "vocabulary_score": 70,
            "fluency_score": 65,
            "comprehension_score": 70,
            "overall_score": 69,
            "cefr_level": "B1",
            "feedback": "Good foundation with room for improvement.",
            "recommendations": ["Practice grammar exercises", "Read more technical documentation"]
        }
    
    def _default_readiness_summary(self) -> Dict:
        return {
            "overall_readiness": "Developing",
            "strengths": ["Good foundation"],
            "weaknesses": ["Need more practice"],
            "recommendations": ["Complete all assessments"],
            "career_suggestions": ["Junior Developer", "Technical Support"],
            "summary": "You are making good progress on your developer journey."
        }

    def _default_onboarding_questions(self) -> List[Dict]:
        return [
            {
                "id": "q1",
                "text": "What are your primary career goals for the next year?",
                "type": "text"
            },
            {
                "id": "q2",
                "text": "What programming languages and frameworks are you most comfortable with?",
                "type": "text"
            },
            {
                "id": "q3",
                "text": "What areas of software development do you feel you need to improve the most?",
                "type": "text"
            }
        ]

    def _default_onboarding_analysis(self) -> Dict:
        return {
            "summary": "The candidate is a junior developer looking to establish a solid foundation in web technologies and improve their system design skills.",
            "estimated_baseline_score": 30
        }


# Singleton instance
groq_service = GroqService()
