const API_URL = 'http://localhost:3000'; // 로컬 백엔드 주소

export const fetchCourses = async () => {
  try {
    const response = await fetch(`${API_URL}/courses`, {
      headers: {
        Authorization: 'mock-jwt-token',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};
