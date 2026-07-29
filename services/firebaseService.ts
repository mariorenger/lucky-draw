import { Employee, Prize, Winner, Settings, RiggedSetting } from '../types';

export interface AppDataSync {
  employees: Employee[];
  prizes: Prize[];
  winners: Winner[];
  settings: Settings;
  riggedSettings: RiggedSetting[];
  adminPin: string;
  mcPin: string;
  activePrizeId?: string;
  activeSpinCount?: number;
  spinTrigger?: {
    prizeId: string;
    quantity: number;
    timestamp: number;
    senderId: string;
    action?: 'spin' | 'confirm' | 'cancel';
    winnerIds?: string[];
    winnerRecordIds?: string[];
    spinDuration?: number;
  } | null;
}

export const DEFAULT_ADMIN_PIN = 'hannn2';
export const DEFAULT_MC_PIN = 'hannn13';

// Realtime Listener using Server-Sent Events (SSE) + HTTP Fallback
export function subscribeToCloudData(
  onDataChange: (data: Partial<AppDataSync>) => void,
  onError?: (err: Error) => void
) {
  let eventSource: EventSource | null = null;
  let pollingInterval: any = null;

  const fetchInitial = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        onDataChange(data);
      }
    } catch (e: any) {
      if (onError) onError(e);
    }
  };

  fetchInitial();

  try {
    eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onDataChange(data);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        if (!pollingInterval) {
          pollingInterval = setInterval(fetchInitial, 3000);
        }
      }
    };
  } catch (err: any) {
    pollingInterval = setInterval(fetchInitial, 3000);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };
}

// Sync Employees
export async function syncEmployeesToCloud(employees: Employee[]) {
  try {
    await fetch('/api/data/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees })
    });
  } catch (err) {
    console.error('Error syncing employees to server:', err);
  }
}

// Sync Prizes
export async function syncPrizesToCloud(prizes: Prize[]) {
  try {
    await fetch('/api/data/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes })
    });
  } catch (err) {
    console.error('Error syncing prizes to server:', err);
  }
}

// Update Single Prize Quantity
export async function updatePrizeCountCloud(prizeId: string, newQuantity: number) {
  try {
    await fetch('/api/data/prize-quantity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizeId, quantity: newQuantity })
    });
  } catch (err) {
    console.error('Error updating prize quantity:', err);
  }
}

// Add Winners
export async function addWinnersToCloud(winners: Winner[]) {
  try {
    await fetch('/api/data/winners/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winners })
    });
  } catch (err) {
    console.error('Error adding winners to server:', err);
  }
}

// Remove Winners
export async function removeWinnersFromCloud(winIds: string[]) {
  try {
    await fetch('/api/data/winners/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winIds })
    });
  } catch (err) {
    console.error('Error removing winners from server:', err);
  }
}

// Clear All Winners
export async function clearWinnersInCloud() {
  try {
    await fetch('/api/data/winners/clear', {
      method: 'POST'
    });
  } catch (err) {
    console.error('Error clearing winners from server:', err);
  }
}

// Sync Settings & Pins
export async function syncConfigToCloud(
  settings: Settings,
  adminPin: string,
  riggedSettings: RiggedSetting[],
  mcPin?: string
) {
  try {
    await fetch('/api/data/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, adminPin, mcPin, riggedSettings })
    });
  } catch (err) {
    console.error('Error syncing config to server:', err);
  }
}

// Sync Active Prize and Spin Count Selection
export async function syncActivePrizeAndCountToCloud(activePrizeId: string, activeSpinCount: number) {
  try {
    await fetch('/api/data/active-prize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activePrizeId, activeSpinCount })
    });
  } catch (err) {
    console.error('Error syncing active prize and count:', err);
  }
}

// Send Remote Spin Trigger
export async function sendRemoteSpinTriggerToCloud(
  prizeId: string, 
  quantity: number, 
  senderId: string,
  action: 'spin' | 'confirm' | 'cancel' = 'spin',
  winnerIds?: string[],
  winnerRecordIds?: string[],
  spinDuration?: number
) {
  try {
    await fetch('/api/data/spin-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizeId, quantity, senderId, action, winnerIds, winnerRecordIds, spinDuration })
    });
  } catch (err) {
    console.error('Error sending remote spin trigger:', err);
  }
}
