import { validate } from 'class-validator';
import { ContactDto } from '../contact.dto.js';

function makeDto(overrides: Partial<ContactDto> = {}): ContactDto {
    const dto = new ContactDto();
    dto.name = overrides.name ?? 'Alice';
    dto.email = overrides.email ?? 'alice@example.com';
    dto.message = overrides.message ?? 'Hello';
    return dto;
}

describe('ContactDto', () => {
    describe('given a short greeting message', () => {
        it('should pass validation', async () => {
            const dto = makeDto({ message: 'Hi' });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });
    });

    describe('given an empty message', () => {
        it('should fail validation', async () => {
            const dto = makeDto({ message: '' });

            const errors = await validate(dto);

            expect(errors.some((error) => error.property === 'message')).toBe(true);
        });
    });
});
