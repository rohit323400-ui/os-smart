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

// REST API Methods
export async function fetchFullSync(): Promise<BackendDataSync | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/sync`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Backend server offline, falling back to local state:', err);
    return null;
  }
}

export async function triggerFireEmergency(zone?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/fire/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone })
    });
    return await res.json();
  } catch (err) {
    console.error('Error triggering fire emergency API:', err);
  }
}

export async function resetFireEmergency() {
  try {
    const res = await fetch(`${API_BASE_URL}/fire/reset`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('Error resetting fire emergency API:', err);
  }
}

export async function toggleParkingSlot(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/toggle/${id}`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('Error toggling parking slot:', err);
  }
}

export async function addVisitor(visitorName: string, unitNumber: string, category: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/visitors/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorName, unitNumber, category })
    });
    return await res.json();
  } catch (err) {
    console.error('Error adding visitor:', err);
  }
}

export async function approveVisitor(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/visitors/approve/${id}`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('Error approving visitor:', err);
  }
}

export async function triggerLiftSos(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/lift/trigger-sos/${id}`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('Error triggering lift SOS:', err);
  }
}

export async function escalateNoise() {
  try {
    const res = await fetch(`${API_BASE_URL}/noise/escalate`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('Error escalating noise:', err);
  }
}

// AI Integration Methods
export async function askAiBrain(question: string, role?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, role })
    });
    return await res.json();
  } catch (err) {
    console.error('Error querying AI Brain:', err);
  }
}

export async function analyzeEmergencyWithAi(emergencyType: string, zone?: string, details?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/analyze-emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyType, zone, details })
    });
    return await res.json();
  } catch (err) {
    console.error('Error running AI emergency analysis:', err);
  }
}

// Auth & User Profile API Methods
export async function loginUser(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err) {
    console.error('Error logging in:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

export async function signupUser(data: { name: string; email: string; password: string; role: string; flatNumber?: string; phone?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating profile:', err);
    return { success: false, message: 'Network or server error.' };
  }
}

// Settings API Methods
export async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving settings to backend:', err);
    return { success: false, message: 'Network error.' };
  }
}

// WebSocket Listener setup
export function connectRealtime(onMessage: (type: string, payload: any) => void) {
  let ws: WebSocket | null = null;
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to Smart Building Realtime Backend WebSocket!');
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
      console.log('WebSocket connection closed');
    };
  } catch (err) {
    console.warn('Could not initialize WebSocket connection:', err);
  }

  return () => {
    if (ws) ws.close();
  };
}
