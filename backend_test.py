#!/usr/bin/env python3
"""
Backend API Testing Suite for BI and Forecasting Application
Tests the enhanced system with OpenRouter integration and contextual responses
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List

class BackendTester:
    def __init__(self):
        # Get the backend URL from environment or use default
        self.base_url = "http://localhost:3000"  # Next.js default port
        self.api_base = f"{self.base_url}/api"
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
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

    def test_generate_report_api(self):
        """Test the generate-report API endpoint"""
        print("\n🔍 Testing Generate Report API...")
        
        # Test 1: Valid request with simple EDA query
        test_data = {
            "conversationHistory": json.dumps([
                {"role": "user", "content": "analyze my data quality"},
                {"role": "assistant", "content": "I'll analyze your data quality. The dataset shows excellent quality with 94/100 score."}
            ]),
            "analysisContext": json.dumps({
                "selectedBu": {"name": "Sales Department"},
                "selectedLob": {"name": "Product Sales", "hasData": True, "recordCount": 5000},
                "userQuery": "analyze my data quality",
                "queryType": "simple_eda"
            })
        }
        
        try:
            response = self.session.post(
                f"{self.api_base}/generate-report",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "report" in result or "content" in result or isinstance(result, str):
                    self.log_test(
                        "Generate Report - Simple EDA",
                        True,
                        "API returned valid report for simple data quality query",
                        {"status_code": response.status_code, "response_type": type(result).__name__}
                    )
                else:
                    self.log_test(
                        "Generate Report - Simple EDA",
                        False,
                        "API response missing expected report content",
                        {"status_code": response.status_code, "response": result}
                    )
            else:
                self.log_test(
                    "Generate Report - Simple EDA",
                    False,
                    f"API returned error status: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except requests.exceptions.Timeout:
            self.log_test(
                "Generate Report - Simple EDA",
                False,
                "API request timed out after 30 seconds",
                {"timeout": 30}
            )
        except Exception as e:
            self.log_test(
                "Generate Report - Simple EDA",
                False,
                f"API request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_forecasting_with_parameters(self):
        """Test forecasting request that should trigger follow-up questions"""
        print("\n📈 Testing Forecasting with Parameters...")
        
        test_data = {
            "conversationHistory": json.dumps([
                {"role": "user", "content": "forecast sales for next 30 days using different models"},
                {"role": "assistant", "content": "I'll generate forecasts using multiple models. Based on analysis, Prophet shows MAPE 8.2%, XGBoost shows 7.8% MAPE."}
            ]),
            "analysisContext": json.dumps({
                "selectedBu": {"name": "Sales Department"},
                "selectedLob": {"name": "Product Sales", "hasData": True, "recordCount": 8000},
                "userQuery": "forecast sales for next 30 days using different models",
                "queryType": "forecasting_with_parameters",
                "shouldTriggerFollowUp": True
            })
        }
        
        try:
            response = self.session.post(
                f"{self.api_base}/generate-report",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                # Check if response contains forecasting-specific content
                result_str = json.dumps(result).lower()
                has_forecasting_content = any(keyword in result_str for keyword in [
                    "forecast", "model", "prediction", "mape", "accuracy", "confidence"
                ])
                
                if has_forecasting_content:
                    self.log_test(
                        "Generate Report - Forecasting Parameters",
                        True,
                        "API returned forecasting-specific report content",
                        {"status_code": response.status_code, "contains_forecasting": True}
                    )
                else:
                    self.log_test(
                        "Generate Report - Forecasting Parameters",
                        False,
                        "API response lacks forecasting-specific content",
                        {"status_code": response.status_code, "response_preview": str(result)[:200]}
                    )
            else:
                self.log_test(
                    "Generate Report - Forecasting Parameters",
                    False,
                    f"API returned error status: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Generate Report - Forecasting Parameters",
                False,
                f"API request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_business_question(self):
        """Test basic business question that should use business-friendly language"""
        print("\n💼 Testing Business Question...")
        
        test_data = {
            "conversationHistory": json.dumps([
                {"role": "user", "content": "what patterns do you see in my data?"},
                {"role": "assistant", "content": "I can see several interesting patterns in your data. There's a strong upward trend with seasonal variations."}
            ]),
            "analysisContext": json.dumps({
                "selectedBu": {"name": "Marketing Department"},
                "selectedLob": {"name": "Campaign Performance", "hasData": True, "recordCount": 3500},
                "userQuery": "what patterns do you see in my data?",
                "queryType": "basic_business_question"
            })
        }
        
        try:
            response = self.session.post(
                f"{self.api_base}/generate-report",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                result_str = json.dumps(result).lower()
                
                # Check for business-friendly language (avoid technical jargon)
                has_business_language = any(keyword in result_str for keyword in [
                    "pattern", "trend", "growth", "performance", "insight", "opportunity"
                ])
                
                # Check that it doesn't have too much technical jargon
                technical_terms = ["coefficient", "regression", "p-value", "chi-square", "heteroscedasticity"]
                has_excessive_technical = sum(1 for term in technical_terms if term in result_str) > 2
                
                if has_business_language and not has_excessive_technical:
                    self.log_test(
                        "Generate Report - Business Question",
                        True,
                        "API returned business-friendly response with appropriate language",
                        {"status_code": response.status_code, "business_friendly": True}
                    )
                else:
                    self.log_test(
                        "Generate Report - Business Question",
                        False,
                        "API response not optimized for business users",
                        {
                            "status_code": response.status_code,
                            "has_business_language": has_business_language,
                            "excessive_technical": has_excessive_technical
                        }
                    )
            else:
                self.log_test(
                    "Generate Report - Business Question",
                    False,
                    f"API returned error status: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Generate Report - Business Question",
                False,
                f"API request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_invalid_requests(self):
        """Test API error handling with invalid requests"""
        print("\n🚫 Testing Invalid Requests...")
        
        # Test 1: Missing required fields
        try:
            response = self.session.post(
                f"{self.api_base}/generate-report",
                json={"invalid": "data"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Invalid Request - Missing Fields",
                    True,
                    "API correctly rejected request with missing required fields",
                    {"status_code": response.status_code}
                )
            else:
                self.log_test(
                    "Invalid Request - Missing Fields",
                    False,
                    f"API should return 400 for invalid request, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_test(
                "Invalid Request - Missing Fields",
                False,
                f"Error testing invalid request: {str(e)}",
                {"error": str(e)}
            )
        
        # Test 2: Invalid data types
        try:
            response = self.session.post(
                f"{self.api_base}/generate-report",
                json={
                    "conversationHistory": 123,  # Should be string
                    "analysisContext": ["invalid"]  # Should be string
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Invalid Request - Wrong Data Types",
                    True,
                    "API correctly rejected request with wrong data types",
                    {"status_code": response.status_code}
                )
            else:
                self.log_test(
                    "Invalid Request - Wrong Data Types",
                    False,
                    f"API should return 400 for wrong data types, got {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except Exception as e:
            self.log_test(
                "Invalid Request - Wrong Data Types",
                False,
                f"Error testing invalid data types: {str(e)}",
                {"error": str(e)}
            )

    def test_api_availability(self):
        """Test if the API server is running and accessible"""
        print("\n🌐 Testing API Availability...")
        
        try:
            # Test basic connectivity
            response = self.session.get(f"{self.base_url}", timeout=10)
            if response.status_code in [200, 404]:  # 404 is OK for root path in Next.js
                self.log_test(
                    "API Server Availability",
                    True,
                    f"Server is accessible at {self.base_url}",
                    {"status_code": response.status_code}
                )
            else:
                self.log_test(
                    "API Server Availability",
                    False,
                    f"Server returned unexpected status: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.ConnectionError:
            self.log_test(
                "API Server Availability",
                False,
                f"Cannot connect to server at {self.base_url}",
                {"base_url": self.base_url}
            )
        except Exception as e:
            self.log_test(
                "API Server Availability",
                False,
                f"Error checking server availability: {str(e)}",
                {"error": str(e)}
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Testing Suite")
        print("=" * 50)
        
        # Test server availability first
        self.test_api_availability()
        
        # Only run API tests if server is available
        server_available = any(result["success"] and "availability" in result["test"].lower() 
                             for result in self.test_results)
        
        if server_available:
            # Core API functionality tests
            self.test_generate_report_api()
            self.test_forecasting_with_parameters()
            self.test_business_question()
            self.test_invalid_requests()
        else:
            print("\n⚠️  Skipping API tests - server not available")
        
        # Generate summary
        self.print_summary()
        
        return self.test_results

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
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
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_count = sum(1 for result in results if not result["success"])
    sys.exit(1 if failed_count > 0 else 0)

if __name__ == "__main__":
    main()