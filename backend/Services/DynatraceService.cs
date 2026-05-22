using System;
using System.Collections.Generic;

namespace TimeWeave.Backend.Services
{
    public class DynatraceService
    {
        public object GetSmartscapeTopology()
        {
            return new
            {
                nodes = new[]
                {
                    new { id = "api-gateway", type = "SERVICE", name = "API Gateway", technology = "Node.js Express", host = "host-gateway-01" },
                    new { id = "checkout-service", type = "SERVICE", name = "Checkout Service", technology = "Node.js Express", host = "host-checkout-01" },
                    new { id = "payment-service", type = "SERVICE", name = "Payment Service", technology = "Node.js Express", host = "host-payment-01" },
                    new { id = "redis-cache-service", type = "SERVICE", name = "Redis Cache Service", technology = "Node.js Express", host = "host-cache-01" }
                },
                edges = new[]
                {
                    new { source = "api-gateway", target = "checkout-service", type = "CALLS" },
                    new { source = "checkout-service", target = "redis-cache-service", type = "CALLS" },
                    new { source = "checkout-service", target = "payment-service", type = "CALLS" }
                }
            };
        }

        public object GetActiveAnomalies(string scenario)
        {
            var anomalies = new List<object>();
            
            if (scenario == "cache-latency")
            {
                anomalies.Add(new
                {
                    id = "ANOMALY-101",
                    title = "Redis Cache Response Time Degradation",
                    severity = "ERROR",
                    status = "ACTIVE",
                    startTime = DateTime.UtcNow.AddMinutes(-5),
                    description = "Response time on service redis-cache-service increased from 15ms to 2500ms, affecting Checkout Service.",
                    rootCauseCandidate = "redis-cache-service",
                    davisAiRecommendation = "Inspect Redis Cache write load or check for high CPU utilization."
                });
            }
            else if (scenario == "payment-timeout")
            {
                anomalies.Add(new
                {
                    id = "ANOMALY-102",
                    title = "Payment Service Failure Propagation",
                    severity = "CRITICAL",
                    status = "ACTIVE",
                    startTime = DateTime.UtcNow.AddMinutes(-3),
                    description = "API Gateway is experiencing 504 Gateway Timeout errors due to response time degradation in Checkout Service and downstream Payment Service.",
                    rootCauseCandidate = "payment-service",
                    davisAiRecommendation = "Payment Service container is taking too long to respond. Check downstream network connectivity."
                });
            }
            else if (scenario == "retry-storm")
            {
                anomalies.Add(new
                {
                    id = "ANOMALY-103",
                    title = "Checkout Service Transaction Failure Spike",
                    severity = "CRITICAL",
                    status = "ACTIVE",
                    startTime = DateTime.UtcNow.AddMinutes(-4),
                    description = "Transaction failure rate on Checkout Service spiked to 100% due to payment connection failures.",
                    rootCauseCandidate = "payment-service",
                    davisAiRecommendation = "Payment service returned 500 database pool exhausted. Check database connection pool sizes."
                });
            }
            else if (scenario == "cascading-failure")
            {
                anomalies.Add(new
                {
                    id = "ANOMALY-104",
                    title = "Cascading Resource Saturation",
                    severity = "CRITICAL",
                    status = "ACTIVE",
                    startTime = DateTime.UtcNow.AddMinutes(-2),
                    description = "Cache latency spike caused request queue saturation in Checkout, triggering thread pool exhaustion and downstream failure cascading.",
                    rootCauseCandidate = "redis-cache-service",
                    davisAiRecommendation = "A high volume of concurrent checkout processes are blocked waiting on redis-cache-service. Implement circuit breaking."
                });
            }

            return anomalies;
        }
    }
}
