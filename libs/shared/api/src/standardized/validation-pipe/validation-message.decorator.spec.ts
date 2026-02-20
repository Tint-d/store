import {
  VALIDATION_MESSAGE_KEY,
  ValidationMessage,
} from './validation-message.decorator';

describe('ValidationMessage Decorator', () => {
  describe('VALIDATION_MESSAGE_KEY', () => {
    it('should export the metadata key constant', () => {
      expect(VALIDATION_MESSAGE_KEY).toBe('validation:custom_message');
    });
  });

  describe('ValidationMessage', () => {
    it('should set custom message metadata on class', () => {
      @ValidationMessage('Custom validation error')
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('Custom validation error');
    });

    it('should work with different message strings', () => {
      @ValidationMessage('Error message 1')
      class TestDto1 {
        field?: string;
      }

      @ValidationMessage('Error message 2')
      class TestDto2 {
        field?: string;
      }

      const metadata1 = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto1);
      const metadata2 = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto2);

      expect(metadata1).toBe('Error message 1');
      expect(metadata2).toBe('Error message 2');
    });

    it('should handle empty string message', () => {
      @ValidationMessage('')
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('');
    });

    it('should handle multi-line message', () => {
      const multiLineMessage = 'Line 1\nLine 2\nLine 3';

      @ValidationMessage(multiLineMessage)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe(multiLineMessage);
    });

    it('should handle message with special characters', () => {
      const specialMessage = 'Error: Invalid input! @#$%^&*()';

      @ValidationMessage(specialMessage)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe(specialMessage);
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);

      @ValidationMessage(longMessage)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe(longMessage);
    });

    it('should handle Unicode characters in message', () => {
      const unicodeMessage = '验证失败 🚀 Ошибка валидации';

      @ValidationMessage(unicodeMessage)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe(unicodeMessage);
    });

    it('should not interfere with class properties', () => {
      @ValidationMessage('Custom message')
      class TestDto {
        name?: string;
        email?: string;
        age?: number;
      }

      const instance = new TestDto();
      instance.name = 'Test';
      instance.email = 'test@example.com';
      instance.age = 25;

      expect(instance.name).toBe('Test');
      expect(instance.email).toBe('test@example.com');
      expect(instance.age).toBe(25);

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('Custom message');
    });

    it('should not affect class methods', () => {
      @ValidationMessage('Custom message')
      class TestDto {
        getValue(): string {
          return 'test value';
        }
      }

      const instance = new TestDto();
      expect(instance.getValue()).toBe('test value');

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('Custom message');
    });

    it('should work with multiple decorators on the same class', () => {
      function OtherDecorator(): ClassDecorator {
        return (target: any) => {
          Reflect.defineMetadata('other:key', 'other value', target);
        };
      }

      @ValidationMessage('Validation error')
      @OtherDecorator()
      class TestDto {
        field?: string;
      }

      const validationMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        TestDto
      );
      const otherMetadata = Reflect.getMetadata('other:key', TestDto);

      expect(validationMetadata).toBe('Validation error');
      expect(otherMetadata).toBe('other value');
    });

    it('should be retrievable from class constructor', () => {
      @ValidationMessage('Constructor message')
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('Constructor message');

      // Also check via constructor
      const instance = new TestDto();
      const metadataFromInstance = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        instance.constructor
      );
      expect(metadataFromInstance).toBe('Constructor message');
    });

    it('should not share metadata between different classes', () => {
      @ValidationMessage('Message 1')
      class TestDto1 {
        field?: string;
      }

      @ValidationMessage('Message 2')
      class TestDto2 {
        field?: string;
      }

      class TestDto3 {
        field?: string;
      }

      const metadata1 = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto1);
      const metadata2 = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto2);
      const metadata3 = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto3);

      expect(metadata1).toBe('Message 1');
      expect(metadata2).toBe('Message 2');
      expect(metadata3).toBeUndefined();
    });

    it('should work with class inheritance', () => {
      @ValidationMessage('Base message')
      class BaseDto {
        baseField?: string;
      }

      @ValidationMessage('Child message')
      class ChildDto extends BaseDto {
        childField?: string;
      }

      const baseMetadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, BaseDto);
      const childMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        ChildDto
      );

      expect(baseMetadata).toBe('Base message');
      expect(childMetadata).toBe('Child message');
    });

    it('should override parent message when applied to child class', () => {
      @ValidationMessage('Parent message')
      class ParentDto {
        field?: string;
      }

      @ValidationMessage('Overridden message')
      class ChildDto extends ParentDto {
        childField?: string;
      }

      const parentMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        ParentDto
      );
      const childMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        ChildDto
      );

      expect(parentMetadata).toBe('Parent message');
      expect(childMetadata).toBe('Overridden message');
      expect(childMetadata).not.toBe(parentMetadata);
    });

    it('should work with abstract classes', () => {
      @ValidationMessage('Abstract message')
      abstract class AbstractDto {
        abstract field: string;
      }

      // Verify metadata on abstract class
      const abstractMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        AbstractDto
      );
      expect(abstractMetadata).toBe('Abstract message');

      // Concrete class extending abstract class
      class ConcreteDto extends AbstractDto {
        field = 'value';
      }

      // Verify concrete class inherits the metadata from abstract parent
      const concreteMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        ConcreteDto
      );
      expect(concreteMetadata).toBe('Abstract message');
    });

    it('should return a ClassDecorator function', () => {
      const decorator = ValidationMessage('Test message');
      expect(typeof decorator).toBe('function');
    });

    it('should handle message with quotes', () => {
      const messageWithQuotes = "User's input is invalid";

      @ValidationMessage(messageWithQuotes)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe(messageWithQuotes);
    });

    it('should handle message with escape characters', () => {
      const messageWithEscapes = 'Line 1\tTab\r\nLine 2';

      @ValidationMessage(messageWithEscapes)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe(messageWithEscapes);
    });

    it('should work with class expressions', () => {
      @ValidationMessage('Expression message')
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('Expression message');
    });

    it('should handle template literal messages', () => {
      const context = 'user registration';
      const message = `Validation failed during ${context}`;

      @ValidationMessage(message)
      class TestDto {
        field?: string;
      }

      const metadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, TestDto);
      expect(metadata).toBe('Validation failed during user registration');
    });
  });

  describe('Integration scenarios', () => {
    it('should work with typical DTO pattern', () => {
      @ValidationMessage('Read communities validation error')
      class ReadCommunitiesQueryDTO {
        page?: number;
        limit?: number;
        sort?: string;
      }

      const metadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        ReadCommunitiesQueryDTO
      );
      expect(metadata).toBe('Read communities validation error');
    });

    it('should work with nested DTO classes', () => {
      @ValidationMessage('Address validation error')
      class AddressDto {
        street?: string;
        city?: string;
        country?: string;
      }

      @ValidationMessage('User validation error')
      class UserDto {
        name?: string;
        email?: string;
        address?: AddressDto;
      }

      const addressMetadata = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        AddressDto
      );
      const userMetadata = Reflect.getMetadata(VALIDATION_MESSAGE_KEY, UserDto);

      expect(addressMetadata).toBe('Address validation error');
      expect(userMetadata).toBe('User validation error');
    });

    it('should maintain metadata through multiple instances', () => {
      @ValidationMessage('Persistent message')
      class TestDto {
        field?: string;
      }

      const instance1 = new TestDto();
      const instance2 = new TestDto();
      const instance3 = new TestDto();

      const metadata1 = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        instance1.constructor
      );
      const metadata2 = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        instance2.constructor
      );
      const metadata3 = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        instance3.constructor
      );

      expect(metadata1).toBe('Persistent message');
      expect(metadata2).toBe('Persistent message');
      expect(metadata3).toBe('Persistent message');
    });
  });
});
