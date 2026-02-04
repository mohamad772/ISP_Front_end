// src/api/apiClient.ts
import axios from "axios";
import { useStore } from "./store";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const { access_token } = useStore.getState();
    if (config.url?.split("/")[1] != "auth") {
      console.log("injected");
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    // Example: Handle different error codes
    if (error.response && error.response.status === 401) {
      // Handle unauthorized, e.g., redirect to login
      console.error("Unauthorized access, redirecting to login");
      // You can use a router service here, e.g., globalRouter.navigate('/login');
    } else {
      // Log or handle other errors
      console.error("An error occurred:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
