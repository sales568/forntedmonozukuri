import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// Configuración minimalista para evitar errores de carga
// Esto habilitará el rastreo automático de Fetch/XHR sin necesidad de configurar el provider manualmente
registerInstrumentations({
    instrumentations: [
        getWebAutoInstrumentations({
            '@opentelemetry/instrumentation-fetch': {
                propagateTraceHeaderCorsUrls: [/http:\/\/localhost:3000\/.*/],
            },
            '@opentelemetry/instrumentation-xml-http-request': {
                propagateTraceHeaderCorsUrls: [/http:\/\/localhost:3000\/.*/],
            },
        }),
    ],
});

export const tracer = {}; // Placeholder para evitar errores de importación en otros archivos
