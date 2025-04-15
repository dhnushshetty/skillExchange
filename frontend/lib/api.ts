// Base URL for all API endpoints
const API_BASE_URL = "http://localhost:5000";

// Helper function to get user ID from localStorage
export const getUserId = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userId");
  }
  return null;
};

// Generic fetch function with error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

// User related API calls
export const loginUser = (email: string, password: string) => {
  return fetchAPI<{ userId: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = (userData: {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  password: string;
}) => {
  return fetchAPI<{ userId: string }>("/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getUserProfile = (userId: string) => {
  return fetchAPI<{
    userId: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    dateJoining: string;
  }>(`/user/${userId}`);
};

export const updateUserProfile = (
  userId: string,
  userData: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
  },
) => {
  return fetchAPI(`/user/${userId}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
};

// Skill related API calls
export const getUserSkills = (userId: string) => {
  return fetchAPI<
    Array<{
      SkillId: number;
      SkillName: string;
      Description: string;
      Category: string;
      UserId: number;
    }>
  >(`/skills?userId=${userId}&ownSkills=true`);
};

export const getAllSkills = (userId?: string) => {
  const endpoint = userId ? `/skills?userId=${userId}` : "/skills";
  console.log(`Fetching skills from: ${API_BASE_URL}${endpoint}`);
  return fetchAPI<
    Array<{
      SkillId: number;
      SkillName: string;
      Description: string;
      Category: string;
      UserId: number;
      userName: string;
    }>
  >(endpoint);
};

export const createSkill = (skillData: {
  skillName: string;
  description: string;
  category: string;
  userId: string;
}) => {
  return fetchAPI("/create-skill", {
    method: "POST",
    body: JSON.stringify(skillData),
  });
};

// Request related API calls
export const createRequest = (requestData: {
  userId: string;
  skillId: number;
}) => {
  return fetchAPI("/create-request", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
};

export const getUserRequests = (userId: string) => {
  return fetchAPI<
    Array<{
      RequestId: number;
      UserId: number;
      userName: string;
      SkillId: number;
      SkillName: string;
      TimeStamp: string;
      Status: string;
    }>
  >(`/requests?userId=${userId}`);
};

export const getReceivedRequests = (userId: string) => {
  return fetchAPI<
    Array<{
      RequestId: number;
      UserId: number;
      userName: string;
      SkillId: number;
      SkillName: string;
      TimeStamp: string;
      Status: string;
    }>
  >(`/received-requests?userId=${userId}`);
};

export const updateRequest = (requestId: number, status: string) => {
  return fetchAPI<{ success: boolean; message: string }>("/update-request", {
    method: "POST",
    body: JSON.stringify({ requestId, status }),
  });
};

export const completeRequest = (requestId: number) => {
  return fetchAPI<{ success: boolean; message: string }>("/complete-request", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
};

// Transaction related API calls
export const getUserTransactions = (userId: string) => {
  return fetchAPI<
    Array<{
      TransactionId: number;
      RequestId: number;
      SkillName: string;
      CompletionDate: string;
      Status: string;
      Rating?: number;
      Comments?: string;
    }>
  >(`/transactions/${userId}`);
};

// Review related API calls
export const submitReview = (reviewData: {
  transactionId: number;
  rating: number;
  comments: string;
}) => {
  return fetchAPI("/submit-review", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
};