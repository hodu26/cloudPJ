import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Alert, AlertDescription } from "components/ui/alert";
import { Loader2 } from "lucide-react";
import { signup, login } from "../api/api"; // 백엔드 API 호출 함수

const SignInUp = () => {
  const [isLogin, setIsLogin] = useState(true); // 로그인/회원가입 상태
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    password: "",
    confirmPassword: "",
    department: "",
  });
  const [error, setError] = useState(null); // 에러 상태
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const navigate = useNavigate();

  // 입력값 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(formData)
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // 로그인 요청
        const { studentId, password } = formData;
      
        try {
          const response = await login({ studentId, password }); // 로그인 API 호출
          // JWT 토큰을 쿠키에 저장 (httpOnly 설정은 서버 측에서 설정됨)
          Cookies.set('token', response.token, {
            expires: 1, // 1일 동안 유지
            secure: true, // HTTPS 연결에서만 동작 (로컬 개발 환경에서는 제외 가능)
            sameSite: 'Strict', // CSRF 보호
          });
          navigate('/'); // 메인 페이지로 이동
        } catch (error) {
          setError(error.message || '로그인 실패. 다시 시도해주세요.');
        }
      } else {
        // 회원가입 요청
        if (formData.password !== formData.confirmPassword) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }
        const { studentId, name, password, department } = formData;
        await signup({ studentId, name, password, department });
        alert("회원가입이 완료되었습니다. 로그인 해주세요.");
        setIsLogin(true); // 로그인 화면으로 전환
      }
    } catch (err) {
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "로그인" : "회원가입"}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 학번 입력 */}
            <div>
              <label className="block text-sm font-medium mb-1">학번</label>
              <Input
                type="text"
                name="studentId"
                placeholder="학번을 입력하세요"
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>

            {/* 이름 입력 (회원가입 시만 표시) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">이름</label>
                <Input
                  type="text"
                  name="name"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <Input
                type="password"
                name="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* 비밀번호 확인 입력 (회원가입 시만 표시) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* 학번 입력 (회원가입 시만 표시) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">학과</label>
                <Input
                  type="text"
                  name="department"
                  placeholder="소속 학과를 입력하세요"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* 제출 버튼 */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리중...
                </>
              ) : isLogin ? (
                "로그인"
              ) : (
                "회원가입"
              )}
            </Button>

            {/* 로그인/회원가입 전환 버튼 */}
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "회원가입하기" : "로그인하기"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInUp;
