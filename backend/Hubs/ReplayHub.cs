using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TimeWeave.Backend.Hubs
{
    public class ReplayHub : Hub
    {
        public async Task JoinSession(string sessionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
            Console.WriteLine($"[SignalR] Client {Context.ConnectionId} joined session group: {sessionId}");
        }

        public async Task LeaveSession(string sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
            Console.WriteLine($"[SignalR] Client {Context.ConnectionId} left session group: {sessionId}");
        }
    }
}
