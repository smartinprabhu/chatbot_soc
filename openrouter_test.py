#!/usr/bin/env python3
"""
OpenRouter API Integration Test
Tests the new OpenRouter API key functionality as specified in the review request
"""

import requests
import json
import time
import sys

class OpenRouterTester:
    def __init__(self):
        # New OpenRouter API key from review request
        self.openrouter_key = ""  # API key should be configured by user
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": time.time()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {json.dumps(details, indent=2)}")

    def test_openrouter_api_key(self):
        """Test the new OpenRouter API key functionality"""
        print("\n🔑 Testing OpenRouter API Key...")
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "BI Forecasting App"
        }
        
        # Test 1: Simple chat completion for data quality analysis
        test_data = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a business intelligence analyst. Provide simple, business-friendly responses without technical jargon."
                },
                {
                    "role": "user", 
                    "content": "analyze my data quality"
                }
            ],
            "max_tokens": 200,
            "temperature": 0.7
        }
        
        try:
            response = requests.post(
                f"{self.openrouter_base_url}/chat/completions",
                headers=headers,
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    
                    # Check for business-friendly language
                    business_terms = ["quality", "data", "analysis", "insights", "patterns"]
                    technical_terms = ["coefficient", "regression", "p-value", "chi-square"]
                    
                    has_business_language = any(term.lower() in content.lower() for term in business_terms)
                    has_excessive_technical = sum(1 for term in technical_terms if term.lower() in content.lower()) > 1
                    
                    if has_business_language and not has_excessive_technical:
                        self.log_test(
                            "OpenRouter - Simple EDA Response",
                            True,
                            "API returned business-friendly response for data quality query",
                            {
                                "response_length": len(content),
                                "business_friendly": True,
                                "model_used": result.get("model", "unknown")
                            }
                        )
                    else:
                        self.log_test(
                            "OpenRouter - Simple EDA Response",
                            False,
                            "Response not optimized for business users",
                            {
                                "has_business_language": has_business_language,
                                "excessive_technical": has_excessive_technical,
                                "content_preview": content[:100]
                            }
                        )
                else:
                    self.log_test(
                        "OpenRouter - Simple EDA Response",
                        False,
                        "API response missing expected content structure",
                        {"response": result}
                    )
            else:
                self.log_test(
                    "OpenRouter - Simple EDA Response",
                    False,
                    f"API returned error status: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "OpenRouter - Simple EDA Response",
                False,
                f"API request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_forecasting_contextual_response(self):
        """Test contextual response for forecasting with parameters"""
        print("\n📈 Testing Forecasting Contextual Response...")
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "BI Forecasting App"
        }
        
        test_data = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a forecasting specialist. When users ask about forecasting with specific parameters, provide detailed technical information and suggest follow-up questions about model selection, confidence levels, and validation methods."
                },
                {
                    "role": "user",
                    "content": "forecast sales for next 30 days using different models"
                }
            ],
            "max_tokens": 300,
            "temperature": 0.5
        }
        
        try:
            response = requests.post(
                f"{self.openrouter_base_url}/chat/completions",
                headers=headers,
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    
                    # Check for forecasting-specific content
                    forecasting_terms = ["forecast", "model", "prediction", "accuracy", "confidence", "validation"]
                    follow_up_indicators = ["?", "would you like", "do you prefer", "which", "how"]
                    
                    has_forecasting_content = sum(1 for term in forecasting_terms if term.lower() in content.lower()) >= 3
                    suggests_follow_up = any(indicator.lower() in content.lower() for indicator in follow_up_indicators)
                    
                    if has_forecasting_content and suggests_follow_up:
                        self.log_test(
                            "OpenRouter - Forecasting Parameters",
                            True,
                            "API provided contextual forecasting response with follow-up suggestions",
                            {
                                "forecasting_terms_found": sum(1 for term in forecasting_terms if term.lower() in content.lower()),
                                "suggests_follow_up": suggests_follow_up,
                                "response_length": len(content)
                            }
                        )
                    else:
                        self.log_test(
                            "OpenRouter - Forecasting Parameters",
                            False,
                            "Response lacks forecasting context or follow-up suggestions",
                            {
                                "has_forecasting_content": has_forecasting_content,
                                "suggests_follow_up": suggests_follow_up,
                                "content_preview": content[:150]
                            }
                        )
                else:
                    self.log_test(
                        "OpenRouter - Forecasting Parameters",
                        False,
                        "API response missing expected content",
                        {"response": result}
                    )
            else:
                self.log_test(
                    "OpenRouter - Forecasting Parameters",
                    False,
                    f"API returned error: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "OpenRouter - Forecasting Parameters",
                False,
                f"API request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_business_pattern_analysis(self):
        """Test business-friendly pattern analysis"""
        print("\n💼 Testing Business Pattern Analysis...")
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "BI Forecasting App"
        }
        
        test_data = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a business analyst. Explain data patterns in simple business terms that non-technical users can understand. Avoid statistical jargon and focus on business implications."
                },
                {
                    "role": "user",
                    "content": "what patterns do you see in my data?"
                }
            ],
            "max_tokens": 250,
            "temperature": 0.6
        }
        
        try:
            response = requests.post(
                f"{self.openrouter_base_url}/chat/completions",
                headers=headers,
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    
                    # Check for business language vs technical jargon
                    business_terms = ["trend", "pattern", "growth", "decline", "seasonal", "performance", "opportunity"]
                    technical_jargon = ["coefficient", "regression", "p-value", "chi-square", "heteroscedasticity", "autocorrelation"]
                    
                    business_score = sum(1 for term in business_terms if term.lower() in content.lower())
                    technical_score = sum(1 for term in technical_jargon if term.lower() in content.lower())
                    
                    if business_score >= 2 and technical_score <= 1:
                        self.log_test(
                            "OpenRouter - Business Pattern Analysis",
                            True,
                            "API provided business-friendly pattern analysis",
                            {
                                "business_terms": business_score,
                                "technical_terms": technical_score,
                                "business_friendly_ratio": business_score / max(technical_score, 1)
                            }
                        )
                    else:
                        self.log_test(
                            "OpenRouter - Business Pattern Analysis",
                            False,
                            "Response too technical or lacks business context",
                            {
                                "business_terms": business_score,
                                "technical_terms": technical_score,
                                "content_preview": content[:150]
                            }
                        )
                else:
                    self.log_test(
                        "OpenRouter - Business Pattern Analysis",
                        False,
                        "API response missing content",
                        {"response": result}
                    )
            else:
                self.log_test(
                    "OpenRouter - Business Pattern Analysis",
                    False,
                    f"API error: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "OpenRouter - Business Pattern Analysis",
                False,
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_api_key_validation(self):
        """Test API key validation"""
        print("\n🔐 Testing API Key Validation...")
        
        # Test with valid key
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(
                f"{self.openrouter_base_url}/models",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                models = response.json()
                if "data" in models and len(models["data"]) > 0:
                    self.log_test(
                        "OpenRouter - API Key Validation",
                        True,
                        f"API key is valid, {len(models['data'])} models available",
                        {"model_count": len(models["data"])}
                    )
                else:
                    self.log_test(
                        "OpenRouter - API Key Validation",
                        False,
                        "API key valid but no models returned",
                        {"response": models}
                    )
            else:
                self.log_test(
                    "OpenRouter - API Key Validation",
                    False,
                    f"API key validation failed: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "OpenRouter - API Key Validation",
                False,
                f"API key validation error: {str(e)}",
                {"error": str(e)}
            )

    def run_all_tests(self):
        """Run all OpenRouter integration tests"""
        print("🚀 Starting OpenRouter Integration Testing")
        print("=" * 50)
        
        # Test API key first
        self.test_api_key_validation()
        
        # Only run other tests if API key is valid
        key_valid = any(result["success"] and "validation" in result["test"].lower() 
                       for result in self.test_results)
        
        if key_valid:
            self.test_openrouter_api_key()
            self.test_forecasting_contextual_response()
            self.test_business_pattern_analysis()
        else:
            print("\n⚠️  Skipping integration tests - API key validation failed")
        
        self.print_summary()
        return self.test_results

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 OPENROUTER INTEGRATION TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n" + "=" * 50)

def main():
    """Main test execution"""
    tester = OpenRouterTester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_count = sum(1 for result in results if not result["success"])
    sys.exit(1 if failed_count > 0 else 0)

if __name__ == "__main__":
    main()