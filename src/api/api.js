import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'; // Update with your backend server URL

/**
 * User Signup
 */
export const signup = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
};

/**
 * User Login
 */
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return await response.json(); // Returns { token: 'JWT_TOKEN' }
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

/**
 * Fetch Courses with Pagination
 */
export const fetchCourses = async (page = 1, limit = 20, searchQuery = '') => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authorization token is missing');
      }
  
      const response = await fetch(`${API_BASE_URL}/courses?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`, // 유효한 토큰 전달
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error.message);
      throw error;
    }
  };

/**
 * Fetch Registered Courses
 */
export const fetchRegisteredCourses = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/registered-courses?studentId=${studentId}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch registered courses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching registered courses:', error);
    throw error;
  }
};

/**
 * Register for a Course
 */
export const registerCourse = async (studentId, courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({ studentId, courseId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering course:', error);
    throw error;
  }
};

/**
 * Unregister from a Course
 */
export const unregisterCourse = async (studentId, courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/unregister-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({ studentId, courseId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to unregister course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error unregistering course:', error);
    throw error;
  }
};
