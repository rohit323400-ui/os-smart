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

// 🔐 Standardized Token Accessor (Consistently unified to 'society_token')
export function getAuthToken(): string | null {
  return localStorage.getItem('society_token') || sessionStorage.getItem('society_token') || localStorage.getItem('rn_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('society_token', token);
  localStorage.setItem('rn_auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('society_token');
  localStorage.removeItem('rn_auth_token');
  localStorage.removeItem('society_user');
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 📡 Authenticated REST API Sync
export async function fetchFullSync(): Promise<BackendDataSync | null> {
  const token = getAuthToken();
  if (!token) return null; // Unauthenticated clients must log in first

  try {
    const res = await fetch(`${API_BASE_URL}/sync`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Backend server offline or unreachable:', err);
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

// 🚰 Water Management API
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

export async function sendValveCommand(closed: boolean) {
  try {
    const res = await fetch(`${API_BASE_URL}/water/valve-command`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ closed })
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending valve command:', err);
    return { success: false, error: 'Network error.' };
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

export async function resetLiftSos(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/lift/reset/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error resetting lift SOS:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🗑️ Waste Management
export async function dispatchWasteVendor(binId: string, vendorName?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/waste/dispatch/${binId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ vendorName })
    });
    return await res.json();
  } catch (err) {
    console.error('Error dispatching waste vendor:', err);
    return { success: false, error: 'Network error.' };
  }
}

// 🔊 Noise Guardian
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

export async function resetNoise() {
  try {
    const res = await fetch(`${API_BASE_URL}/noise/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.error('Error resetting noise:', err);
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
export async function askAiBrain(question: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question })
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
      setAuthToken(data.token);
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
      setAuthToken(resData.token);
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

// ⚙️ Settings API Methods (Per-User in MySQL)
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

// ⚡ Authenticated WebSocket Connection (Requires Auth Token Before Society Data is Sent)
export function connectRealtime(onMessage: (type: string, payload: any) => void) {
  let ws: WebSocket | null = null;
  let isClosed = false;

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      const token = getAuthToken();
      if (token && ws) {
        // Authenticate immediately upon socket connection
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
      console.warn('WebSocket connection error (Server may be offline):', err);
    };

    ws.onclose = () => {
      if (!isClosed) {
        // Retry connection after 5 seconds
        setTimeout(() => {
          if (!isClosed) connectRealtime(onMessage);
        }, 5000);
      }
    };
  } catch (err) {
    console.warn('Could not initialize WebSocket connection:', err);
  }

  return () => {
    isClosed = true;
    if (ws) ws.close();
  };
}
