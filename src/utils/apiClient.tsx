import axios from "axios";
import { useStore } from "@/store/auth-store";
import { UserRole } from "@/types/api.types";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const { access_token, user } = useStore.getState();
    const method = (config.method || "get").toLowerCase();
    const isWrite =
      method !== "get" && method !== "head" && method !== "options";
    const rawUrl = config.url || "";
    let path = rawUrl;
    try {
      if (rawUrl.startsWith("http")) {
        path = new URL(rawUrl).pathname;
      }
    } catch {
      path = rawUrl;
    }
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const getCapabilityForRequest = (reqPath: string, reqMethod: string) => {
      if (reqPath.startsWith("/pos")) {
        if (reqMethod === "get") return "POS_READ";
        if (reqMethod === "post") return "POS_CREATE";
        if (reqMethod === "patch") return "POS_UPDATE";
        if (reqMethod === "delete") return "POS_DELETE";
      }
      if (reqPath.startsWith("/clients")) {
        if (reqMethod === "get") return "CLIENTS_READ";
        if (reqMethod === "post") return "CLIENTS_CREATE";
        if (reqMethod === "patch") return "CLIENTS_UPDATE";
        if (reqMethod === "delete") return "CLIENTS_TERMINATE";
      }
      if (reqPath.startsWith("/subscriptions")) {
        if (reqMethod === "get") return "SUBSCRIPTIONS_READ";
        if (reqMethod === "post") return "SUBSCRIPTIONS_CREATE";
        if (reqMethod === "patch") return "SUBSCRIPTIONS_UPDATE";
        if (reqMethod === "delete") return "SUBSCRIPTIONS_TERMINATE";
      }
      if (reqPath.startsWith("/invoices")) {
        if (reqMethod === "get") return "INVOICES_READ";
        if (reqMethod === "post") return "INVOICES_CREATE";
        if (reqMethod === "delete") return "INVOICES_CANCEL";
        if (reqMethod === "patch") return "INVOICES_CANCEL";
      }
      if (reqPath.startsWith("/payments")) {
        if (reqMethod === "get") return "PAYMENTS_READ";
        if (reqMethod === "post") return "PAYMENTS_CREATE";
      }
      if (reqPath.startsWith("/service-plans")) {
        if (reqMethod === "get") return "SERVICE_PLANS_READ";
        if (reqMethod === "post") return "SERVICE_PLANS_CREATE";
        if (reqMethod === "patch") return "SERVICE_PLANS_UPDATE";
        if (reqMethod === "delete") return "SERVICE_PLANS_DELETE";
      }
      if (reqPath.startsWith("/static-ip")) {
        if (reqMethod === "get") return "STATIC_IP_READ";
        if (reqMethod === "post") return "STATIC_IP_CREATE";
        if (reqMethod === "patch") return "STATIC_IP_UPDATE";
        if (reqMethod === "delete") return "STATIC_IP_DELETE";
      }
      if (reqPath.startsWith("/bandwidth-pool")) {
        if (reqMethod === "get") return "BANDWIDTH_POOL_READ";
        if (reqMethod === "patch") return "BANDWIDTH_POOL_UPDATE";
      }
      if (reqPath.startsWith("/pppoe-requests")) {
        if (reqMethod === "get") return "PPPOE_REQUESTS_READ";
        if (reqMethod === "post") return "PPPOE_REQUESTS_CREATE";
        if (reqPath.includes("/approve")) return "PPPOE_REQUESTS_APPROVE";
        if (reqPath.includes("/reject")) return "PPPOE_REQUESTS_REJECT";
        if (reqPath.includes("/complete")) return "PPPOE_REQUESTS_APPROVE";
        if (reqMethod === "patch") return "PPPOE_REQUESTS_APPROVE";
      }
      if (reqPath.startsWith("/audit-logs")) {
        if (reqMethod === "get") return "AUDIT_LOGS_READ";
      }
      if (reqPath.startsWith("/suspension-history")) {
        if (reqMethod === "get") return "SUSPENSION_HISTORY_READ";
      }
      if (reqPath.startsWith("/usage-logs")) {
        if (reqMethod === "get") return "USAGE_LOGS_READ";
        if (reqMethod === "post") return "USAGE_LOGS_CREATE";
      }
      return null;
    };

    if (user?.role === UserRole.SUB_ADMIN) {
      const capability = getCapabilityForRequest(path, method);
      if (capability) {
        const hasCapability = user.capabilities?.includes(capability);
        if (!hasCapability) {
          return Promise.reject({
            response: {
              status: 403,
              data: { message: "Sub Admin lacks permission for this action." },
            },
          });
        }
      }
    }
    if (user?.role === UserRole.POS_MANAGER && isWrite) {
      const capability = getCapabilityForRequest(path, method);
      if (capability) {
        const hasCapability = user.capabilities?.includes(capability);
        if (!hasCapability) {
          return Promise.reject({
            response: {
              status: 403,
              data: {
                message: "POS Manager lacks permission for this action.",
              },
            },
          });
        }
      }
    }
    if (config.url?.split("/")[1] !== "auth") {
      console.log("injected");
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
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
      useStore.getState().logout();
      window.location.href = "/login";
    } else {
      // Log or handle other errors
      const message =
        error?.response?.data?.message || error?.message || "Unknown error";
      console.error("An error occurred:", message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
