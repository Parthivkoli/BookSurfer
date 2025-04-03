// Mock user data for demo purposes
interface User {
  id: string;
  email: string;
  name: string;
  password: string; // In a real app, this would be hashed
}

// Mock user database
const users: User[] = [
  {
    id: "1",
    email: "demo@example.com",
    name: "Demo User",
    password: "password123",
  },
];

// Mock authentication state
let currentUser: User | null = null;

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find user with matching email and password
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Set current user
    currentUser = user;
    
    // Store user info in localStorage (in a real app, this would be a JWT token)
    localStorage.setItem("user", JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
    }));
    
    return true;
  }
  
  return false;
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name: string): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Check if user with this email already exists
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    return false;
  }
  
  // Create new user
  const newUser: User = {
    id: (users.length + 1).toString(),
    email,
    name,
    password,
  };
  
  // Add to mock database
  users.push(newUser);
  
  return true;
}

/**
 * Logout current user
 */
export function logoutUser(): void {
  // Clear current user
  currentUser = null;
  
  // Remove user info from localStorage
  localStorage.removeItem("user");
}

/**
 * Get current user
 */
export function getCurrentUser(): { id: string; email: string; name: string } | null {
  try {
    // Check localStorage first (for page refreshes)
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && typeof parsedUser === 'object' && 
          'id' in parsedUser && 'email' in parsedUser && 'name' in parsedUser) {
        return parsedUser;
      }
    }
    
    if (currentUser && typeof currentUser === 'object' && 
        'id' in currentUser && 'email' in currentUser && 'name' in currentUser) {
      return {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}