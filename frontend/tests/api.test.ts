import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/services/api';

describe('ApiError', () => { it('preserves status and message', () => { const error = new ApiError(403, 'Заборонено'); expect(error.status).toBe(403); expect(error.message).toBe('Заборонено'); }); });
