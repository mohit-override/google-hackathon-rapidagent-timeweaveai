import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

export const getSignalRConnection = (): HubConnection => {
  if (connection) return connection;

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/replay`)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  return connection;
};

export const ensureConnection = async () => {
  const conn = getSignalRConnection();
  if (conn.state === 'Connected') return;

  if (!startPromise) {
    startPromise = conn.start().finally(() => { startPromise = null; });
  }
  await startPromise;
};

export const joinSessionGroup = async (sessionId: string) => {
  await ensureConnection();
  const conn = getSignalRConnection();
  if (conn.state === 'Connected') {
    await conn.invoke('JoinSession', sessionId);
  }
};

export const leaveSessionGroup = async (sessionId: string) => {
  const conn = getSignalRConnection();
  if (conn.state === 'Connected') {
    await conn.invoke('LeaveSession', sessionId);
  }
};
