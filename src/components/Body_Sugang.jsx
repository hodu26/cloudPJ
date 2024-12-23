// Sugang.js - Frontend UI Component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Search, Loader2, Clock, User, Book, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from 'components/ui/alert';
import Header from './Header';
import { fetchCourses, fetchRegisteredCourses, registerCourse, unregisterCourse } from '../api/api';
import { parseSchedule } from 'utils/parseSchedule';

const TIMES = Array.from({ length: 12 }, (_, i) => `${i + 9}:00`);
const DAYS = ['월', '화', '수', '목', '금', '토'];
const MAX_CREDITS = 21;

const Sugang = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 20;
  const navigate = useNavigate();

  const token = Cookies.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/signin');
    } else {
      const userPayload = parseJwt(token);
      if (userPayload) {
        setUser({
          name: userPayload.name,
          studentId: userPayload.studentId,
          department: userPayload.department,
        });
        initializeData(userPayload.studentId);
      } else {
        console.error('유효하지 않은 JWT');
        Cookies.remove('token');
        navigate('/signin');
      }
    }
  }, [token, navigate]);

  // API에서 받아온 데이터 처리
  const initializeData = async (studentId) => {
    setIsLoading(true);
    setError(null);
    try {
      const { courses: coursesData } = await fetchCourses(currentPage, coursesPerPage, searchQuery); // 검색어 포함
      const registeredData = await fetchRegisteredCourses(studentId);
  
      const parsedCourses = coursesData.map(course => ({
        ...course,
        schedule: parseSchedule(course.schedule),
      }));
      const parsedRegisteredCourses = registeredData.map(course => ({
        ...course,
        schedule: parseSchedule(course.schedule),
      }));
  
      setCourses(parsedCourses || []);
      setRegisteredCourses(parsedRegisteredCourses || []);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 검색어가 변경될 때 API 호출
  useEffect(() => {
    if (user) {
      initializeData(user.studentId);
    }
  }, [searchQuery, currentPage]);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 파싱 실패:', error);
      return null;
    }
  };

  const totalCredits = registeredCourses.reduce((sum, course) => sum + course.credits, 0);

  const hasTimeConflict = (newCourse) => {
    return registeredCourses.some(existingCourse =>
      existingCourse.schedule.some(existingTime =>
        newCourse.schedule.some(newTime =>
          existingTime.day === newTime.day &&
          ((newTime.startTime >= existingTime.startTime && newTime.startTime < existingTime.endTime) ||
            (newTime.endTime > existingTime.startTime && newTime.endTime <= existingTime.endTime))
        )
      )
    );
  };

  const handleRegister = async (course) => {
    setError(null);
    if (course.registered >= course.capacity) {
      setError('수강인원이 초과되었습니다.');
      return;
    }
    if (hasTimeConflict(course)) {
      setError('시간표가 중복됩니다.');
      return;
    }
    if (totalCredits + course.credits > MAX_CREDITS) {
      setError(`최대 신청 가능 학점(${MAX_CREDITS}학점)을 초과합니다.`);
      return;
    }
    setShowWaitingPopup(true);
    setIsLoading(true);
    try {
      console.log(course)
      const updatedCourse = await registerCourse(user.studentId, course.id);
      setRegisteredCourses(prev => [...prev, { ...course, ...updatedCourse }]);
      setCourses(prev =>
        prev.map(c => (c.id === course.id ? { ...c, registered: c.registered + 1 } : c))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setShowWaitingPopup(false);
    }
  };

  const handleUnregister = async (courseId) => {
    setIsLoading(true);
    try {
      await unregisterCourse(user.studentId, courseId);
      setRegisteredCourses(prev => prev.filter(course => course.id !== courseId));
      setCourses(prev =>
        prev.map(c => (c.id === courseId ? { ...c, registered: c.registered - 1 } : c))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimeTableCell = (time, day) => {
    const coursesInCell = registeredCourses.filter(course =>
      course.schedule.some(schedule =>
        schedule.day === day &&
        time >= schedule.startTime &&
        time < schedule.endTime
      )
    );
    if (coursesInCell.length === 0) return null;
    return coursesInCell.map(course => (
      <div
        key={course.id}
        className="absolute inset-0 bg-blue-100 text-xs p-1 overflow-hidden"
        style={{ borderLeft: '2px solid #3B82F6' }}
      >
        <div className="font-medium text-blue-800 truncate">{course.name}</div>
      </div>
    ));
  };

  const paginateCourses = () => {
    const startIndex = (currentPage - 1) * coursesPerPage;
    return courses.slice(startIndex, startIndex + coursesPerPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onLogout={() => { Cookies.remove('token'); navigate('/signin'); }} />}

      <main className="pt-20 pb-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
              <div className="text-gray-600">
                현재 신청 학점: <span className="font-semibold text-blue-600">{totalCredits}</span>
                <span className="text-gray-400"> / {MAX_CREDITS}학점</span>
              </div>
              <div className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(totalCredits / MAX_CREDITS) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-6">
            <div className="w-2/3">
              <Card className="h-[calc(100vh-220px)] shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold text-gray-800">개설강의 목록</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="강의명, 교수명, 학과명으로 검색"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-auto h-[calc(100vh-340px)]">
                  <div className="divide-y divide-gray-200">
                    {paginateCourses()
                      .filter(course =>
                        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        course.professor.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(course => (
                        <div key={course.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{course.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{course.professor}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center text-xs text-gray-500">
                                  <Book className="w-4 h-4 mr-1" />
                                  {course.credits}학점
                                </span>
                                <span className="inline-flex items-center text-xs text-gray-500">
                                  <User className="w-4 h-4 mr-1" />
                                  {course.registered}/{course.capacity}명
                                </span>
                                <span className="inline-flex items-center text-xs text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {course.schedule.map((s, i) => (
                                    <span key={i}>
                                      {s.day} {s.startTime}-{s.endTime}
                                      {i < course.schedule.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleRegister(course)}
                              disabled={
                                registeredCourses.some(c => c.id === course.id) ||
                                course.registered >= course.capacity ||
                                totalCredits + course.credits > MAX_CREDITS ||
                                isLoading
                              }
                              className={
                                registeredCourses.some(c => c.id === course.id)
                                  ? 'bg-gray-200 text-gray-500'
                                  : course.registered >= course.capacity
                                  ? 'bg-red-100 text-red-500'
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                              }
                            >
                              {registeredCourses.some(c => c.id === course.id)
                                ? '신청완료'
                                : course.registered >= course.capacity
                                ? '정원초과'
                                : '신청'}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-1/3 space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold text-gray-800">시간표</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-200 bg-gray-50 p-1 text-xs font-medium text-gray-600">시간</th>
                          {DAYS.map(day => (
                            <th key={day} className="border border-gray-200 bg-gray-50 p-1 text-xs font-medium text-gray-600">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIMES.map(time => (
                          <tr key={time}>
                            <td className="border border-gray-200 text-center p-1 text-xs">{time}</td>
                            {DAYS.map(day => (
                              <td key={day} className="border border-gray-200 relative p-1 h-8">
                                {renderTimeTableCell(time, day)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    수강신청 내역 ({registeredCourses.length}과목)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {registeredCourses.map(course => (
                      <div
                        key={course.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm text-gray-800 truncate">{course.name}</h3>
                          <p className="text-xs text-gray-600">{course.professor} | {course.credits}학점</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnregister(course.id)}
                          disabled={isLoading}
                          className="ml-2 text-red-500 hover:bg-red-50"
                        >
                          취소
                        </Button>
                      </div>
                    ))}
                    {registeredCourses.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Book className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">신청한 강의가 없습니다</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {showWaitingPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg flex flex-col items-center gap-4 shadow-xl">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
              <p className="text-xl text-gray-700">수강신청 처리중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Sugang;
