import { resolveClientIp } from '../client-ip.js';

describe('resolveClientIp', () => {
    describe('given Cloudflare provides the connecting IP', () => {
        it('should prefer the Cloudflare address over proxy-derived values', () => {
            // Arrange
            const sources = {
                cloudflareIp: '203.0.113.10',
                forwardedFor: '198.51.100.2, 10.0.0.2',
                requestIp: '10.0.0.3',
            };

            // Act
            const result = resolveClientIp(sources);

            // Assert
            expect(result).toBe('203.0.113.10');
        });
    });

    describe('given Cloudflare does not provide the connecting IP', () => {
        it('should use the first forwarded address', () => {
            // Arrange
            const sources = {
                cloudflareIp: undefined,
                forwardedFor: '198.51.100.2, 10.0.0.2',
                requestIp: '10.0.0.3',
            };

            // Act
            const result = resolveClientIp(sources);

            // Assert
            expect(result).toBe('198.51.100.2');
        });

        it('should fall back to the Express request IP', () => {
            // Arrange
            const sources = {
                cloudflareIp: '  ',
                forwardedFor: undefined,
                requestIp: '127.0.0.1',
            };

            // Act
            const result = resolveClientIp(sources);

            // Assert
            expect(result).toBe('127.0.0.1');
        });
    });
});
