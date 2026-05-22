using System;
using System.Collections.Generic;
using System.Text.Json;

namespace TimeWeave.Backend.Models
{
    public static class OTelJsonParser
    {
        public static List<ParsedSpan> Parse(string json)
        {
            var list = new List<ParsedSpan>();
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("resourceSpans", out var resourceSpans))
                    return list;

                foreach (var resourceSpan in resourceSpans.EnumerateArray())
                {
                    // Extract Service Name from resource attributes
                    string serviceName = "unknown-service";
                    if (resourceSpan.TryGetProperty("resource", out var resource) &&
                        resource.TryGetProperty("attributes", out var resAttrs))
                    {
                        foreach (var attr in resAttrs.EnumerateArray())
                        {
                            if (attr.TryGetProperty("key", out var keyProp) && keyProp.GetString() == "service.name")
                            {
                                if (attr.TryGetProperty("value", out var valProp) && valProp.TryGetProperty("stringValue", out var strValProp))
                                {
                                    serviceName = strValProp.GetString() ?? serviceName;
                                }
                            }
                        }
                    }

                    if (!resourceSpan.TryGetProperty("scopeSpans", out var scopeSpans))
                        continue;

                    foreach (var scopeSpan in scopeSpans.EnumerateArray())
                    {
                        if (!scopeSpan.TryGetProperty("spans", out var spans))
                            continue;

                        foreach (var span in spans.EnumerateArray())
                        {
                            var parsed = new ParsedSpan { ServiceName = serviceName };
                            
                            if (span.TryGetProperty("traceId", out var traceIdProp))
                                parsed.TraceId = traceIdProp.GetString() ?? "";
                                
                            if (span.TryGetProperty("spanId", out var spanIdProp))
                                parsed.SpanId = spanIdProp.GetString() ?? "";
                                
                            if (span.TryGetProperty("parentSpanId", out var parentSpanIdProp))
                                parsed.ParentSpanId = parentSpanIdProp.GetString();

                            if (span.TryGetProperty("name", out var nameProp))
                                parsed.Name = nameProp.GetString() ?? "";

                            if (span.TryGetProperty("startTimeUnixNano", out var startProp))
                            {
                                var startStr = startProp.GetString();
                                if (startStr != null) parsed.StartTimeUnixNano = Convert.ToInt64(startStr);
                                else if (startProp.ValueKind == JsonValueKind.Number) parsed.StartTimeUnixNano = startProp.GetInt64();
                            }

                            if (span.TryGetProperty("endTimeUnixNano", out var endProp))
                            {
                                var endStr = endProp.GetString();
                                if (endStr != null) parsed.EndTimeUnixNano = Convert.ToInt64(endStr);
                                else if (endProp.ValueKind == JsonValueKind.Number) parsed.EndTimeUnixNano = endProp.GetInt64();
                            }

                            // Calculate Duration
                            if (parsed.StartTimeUnixNano > 0 && parsed.EndTimeUnixNano > 0)
                            {
                                parsed.DurationMs = (parsed.EndTimeUnixNano - parsed.StartTimeUnixNano) / 1000000.0;
                            }

                            // Read Status
                            if (span.TryGetProperty("status", out var statusProp))
                            {
                                if (statusProp.TryGetProperty("code", out var codeProp))
                                {
                                    if (codeProp.ValueKind == JsonValueKind.Number)
                                    {
                                        var codeVal = codeProp.GetInt32();
                                        parsed.StatusCode = codeVal switch
                                        {
                                            1 => "OK",
                                            2 => "ERROR",
                                            _ => "UNSET"
                                        };
                                    }
                                    else if (codeProp.ValueKind == JsonValueKind.String)
                                    {
                                        var strVal = codeProp.GetString() ?? "STATUS_CODE_UNSET";
                                        if (strVal.Contains("ERROR")) parsed.StatusCode = "ERROR";
                                        else if (strVal.Contains("OK")) parsed.StatusCode = "OK";
                                        else parsed.StatusCode = "UNSET";
                                    }
                                }
                                
                                if (statusProp.TryGetProperty("message", out var msgProp))
                                {
                                    parsed.StatusMessage = msgProp.GetString();
                                }
                            }

                            // Read Attributes
                            var attrs = new Dictionary<string, object>();
                            if (span.TryGetProperty("attributes", out var attrsProp))
                            {
                                foreach (var attr in attrsProp.EnumerateArray())
                                {
                                    string key = attr.GetProperty("key").GetString() ?? "";
                                    if (attr.TryGetProperty("value", out var valProp))
                                    {
                                        object? val = null;
                                        if (valProp.TryGetProperty("stringValue", out var sProp)) 
                                            val = sProp.GetString();
                                        else if (valProp.TryGetProperty("intValue", out var iProp)) 
                                        {
                                            var intStr = iProp.GetString();
                                            val = intStr != null ? Convert.ToInt64(intStr) : 0;
                                        }
                                        else if (valProp.TryGetProperty("boolValue", out var bProp)) 
                                            val = bProp.GetBoolean();
                                        else if (valProp.TryGetProperty("doubleValue", out var dProp)) 
                                            val = dProp.GetDouble();
                                        
                                        if (val != null)
                                        {
                                            attrs[key] = val;
                                        }
                                    }
                                }
                            }
                            parsed.Attributes = attrs;

                            list.Add(parsed);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OTelJsonParser] Error parsing telemetry payload: {ex.Message}");
            }
            return list;
        }
    }

    public class ParsedSpan
    {
        public string TraceId { get; set; } = "";
        public string SpanId { get; set; } = "";
        public string? ParentSpanId { get; set; }
        public string ServiceName { get; set; } = "";
        public string Name { get; set; } = "";
        public long StartTimeUnixNano { get; set; }
        public long EndTimeUnixNano { get; set; }
        public double DurationMs { get; set; }
        public string StatusCode { get; set; } = "UNSET";
        public string? StatusMessage { get; set; }
        public Dictionary<string, object> Attributes { get; set; } = new();
    }
}
