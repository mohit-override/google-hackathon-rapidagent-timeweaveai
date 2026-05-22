using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using TimeWeave.Backend.Database;
using TimeWeave.Backend.Models;

namespace TimeWeave.Backend.Services
{
    public class TelemetryIngestionService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly RedisStreamService _redisStreamService;
        
        // Cache to link Trace IDs to active Session IDs
        private static readonly ConcurrentDictionary<string, Guid> TraceToSessionMap = new();

        public TelemetryIngestionService(IServiceScopeFactory scopeFactory, RedisStreamService redisStreamService)
        {
            _scopeFactory = scopeFactory;
            _redisStreamService = redisStreamService;
        }

        public async Task IngestTracesJsonAsync(string jsonPayload)
        {
            var parsedSpans = OTelJsonParser.Parse(jsonPayload);
            if (parsedSpans.Count == 0) return;

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            foreach (var parsed in parsedSpans)
            {
                // Resolve Session ID
                Guid sessionId = Guid.Empty;
                if (!string.IsNullOrEmpty(parsed.TraceId))
                {
                    if (ScenarioService.ActiveSessionId.HasValue)
                    {
                        sessionId = TraceToSessionMap.GetOrAdd(parsed.TraceId, ScenarioService.ActiveSessionId.Value);
                    }
                    else
                    {
                        TraceToSessionMap.TryGetValue(parsed.TraceId, out sessionId);
                    }
                }

                if (sessionId == Guid.Empty)
                {
                    // Fallback to active session or skip
                    sessionId = ScenarioService.ActiveSessionId ?? Guid.Empty;
                    if (sessionId == Guid.Empty)
                    {
                        Console.WriteLine($"[TelemetryIngestionService] Warning: Received span without active session. Skipping.");
                        continue;
                    }
                }

                // Map to EF entity
                var entity = new TelemetrySpan
                {
                    Id = Guid.NewGuid(),
                    SessionId = sessionId,
                    TraceId = parsed.TraceId,
                    SpanId = parsed.SpanId,
                    ParentSpanId = parsed.ParentSpanId,
                    ServiceName = parsed.ServiceName,
                    Name = parsed.Name,
                    StartTimeUnixNano = parsed.StartTimeUnixNano,
                    EndTimeUnixNano = parsed.EndTimeUnixNano,
                    DurationMs = parsed.DurationMs,
                    StatusCode = parsed.StatusCode,
                    StatusMessage = parsed.StatusMessage,
                    AttributesJson = JsonSerializer.Serialize(parsed.Attributes)
                };

                // Save to PostgreSQL
                dbContext.TelemetrySpans.Add(entity);

                // Publish to Redis Streams for live frontend ingestion
                await _redisStreamService.PublishSpanAsync(sessionId.ToString(), parsed);
            }

            await dbContext.SaveChangesAsync();
            Console.WriteLine($"[TelemetryIngestionService] Successfully saved {parsedSpans.Count} spans to DB.");
        }
    }
}
