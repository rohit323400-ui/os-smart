const API_BASE_URL = 'http://localhost:5000/api';
const WS_URL = 'ws://localhost:5000';

export interface BackendDataSync {
  waterData: any;
  parkingSlots: any[];
  fireEmergencyData: any;
  visitorRequests: any[];
  maintenanceTickets: any[];
  liftStatuses: any[];
  wasteBins: any[];
  noiseData: any;
  resourceItems: any[];
  actionLogs: any[];
}

// 🔐 Helper to attach JWT Bearer Token to all protected requests
function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = localStorage.getItem('rn_auth_token') || sessionStorage.getItem('rn_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// REST API Methods
export async function fetchFullSync(): Promise<BackendDataSync | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/sync`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Backend server offline, falling back to local state:', err);
    return null;
  }
}

// 🏢 Fetch Society Flats Registry
export async function fetchFlats() {
  try {
    const res = await fetch(`${API_BASE_URL}/flats`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.flats || [];
  } catch (err) {
    console.warn('Could not fetch flats registry:', err);
    return [];
  }
}

// 🚰 Water Pump Command (Command vs Actual State Pattern)
export async function sendPumpCommand(command: 'START' | 'STOP', deviceId?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/water/pump-command`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ command, deviceId })
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending pump command:', err);
    return { success: false, error: 'Network error communicating with pump controller.' };
  }
}

// 🔥 Fire Emergency Trigger (Authorized Admins & Operators)
export async function triggerFireEmergency(zone?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/fire/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ zone })
    });
    return await res.json();
  } catch (err) {
    console.error('Error triggering fire emergency API:', err);
    return { success: false, error: 'Network error.' };
  }
}

export async function resetFireEmergency() {
  try {
    const res = await fetch(`${API_BASE_URL}/fire/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error resetting fire emergency API:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🚗 Smart Parking Slot Toggle
export async function toggleParkingSlot(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/toggle/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error toggling parking slot:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🚪 Visitor Management
export async function addVisitor(visitorName: string, unitNumber: string, category: string, phone?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/visitors/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ visitorName, unitNumber, category, phone })
    });
    return await res.json();
  } catch (err) {
    console.error('Error adding visitor:', err);
    return { success: false, error: 'Network error.' };
  }
}

export async function approveVisitor(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/visitors/approve/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error approving visitor:', err);
    return { success: false, error: 'Network error.' };
  }
}

export async function escalateNoise() {
  try {
    const res = await fetch(`${API_BASE_URL}/noise/escalate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error escalating noise:', err);
    return { success: false, error: 'Network error.' };
  }
}

export async function verifyGatePass(otpCode: string, unitNumber?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/visitors/verify-gate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ otpCode, unitNumber })
    });
    return await res.json();
  } catch (err) {
    console.error('Error verifying visitor gate pass:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🛗 Lift SOS
export async function triggerLiftSos(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/lift/trigger-sos/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error triggering lift SOS:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🔧 Maintenance Ticket
export async function createMaintenanceTicket(data: { title: string; unit: string; priority?: string; description?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/maintenance/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Error creating maintenance ticket:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🎾 Amenity / Resource Booking
export async function bookResource(id: string, startTime?: string, endTime?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/resources/book/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ startTime, endTime })
    });
    return await res.json();
  } catch (err) {
    console.error('Error booking resource:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 📋 Audit Logs (Admins)
export async function fetchAuditLogs() {
  try {
    const res = await fetch(`${API_BASE_URL}/audit-logs`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.logs || [];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

// 🤖 AI Integration Methods (Advisory Only)
export async function askAiBrain(question: string, role?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, role })
    });
    return await res.json();
  } catch (err) {
    console.error('Error querying AI Brain:', err);
    return { success: false, error: 'Network error.' };
  }
}

export async function analyzeEmergencyWithAi(emergencyType: string, zone?: string, details?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/analyze-emergency`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ emergencyType, zone, details })
    });
    return await res.json();
  } catch (err) {
    console.error('Error running AI emergency analysis:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🔑 Auth & User Profile API Methods
export async function loginUser(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('rn_auth_token', data.token);
    }
    return data;
  } catch (err) {
    console.error('Error logging in:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

export async function signupUser(data: { name: string; email: string; password: string; role?: string; flatNumber?: string; phone?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (resData.success && resData.token) {
      localStorage.setItem('rn_auth_token', resData.token);
    }
    return resData;
  } catch (err) {
    console.error('Error signing up:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

export async function forgotPassword(email: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await res.json();
  } catch (err) {
    console.error('Error requesting password reset:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    return await res.json();
  } catch (err) {
    console.error('Error resetting password:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

export async function updateUserProfile(userId: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating profile:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

// ⚙️ Settings API Methods
export async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.settings;
  } catch (err) {
    console.warn('Error fetching settings from backend:', err);
    return null;
  }
}

export async function updateSettings(settingsData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving settings to backend:', err);
    return { success: false, message: 'Network error.' };
  }
}

// ⚡ Authenticated WebSocket Connection
export function connectRealtime(onMessage: (type: string, payload: any) => void) {
  let ws: WebSocket | null = null;
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to Smart Building Realtime Backend WebSocket!');
      // Authenticate WebSocket session if token exists
      const token = localStorage.getItem('rn_auth_token') || sessionStorage.getItem('rn_auth_token');
      if (token && ws) {
        ws.send(JSON.stringify({ type: 'AUTHENTICATE', token }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data.type, data.payload);
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  } catch (err) {
    console.warn('Could not initialize WebSocket connection:', err);
  }

  return () => {
    if (ws) ws.close();
  };
}
