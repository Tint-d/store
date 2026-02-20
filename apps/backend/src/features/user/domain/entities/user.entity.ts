export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly username: string,
    public readonly password: string,
    public readonly role: string,
    public readonly isActive: boolean,
    public readonly isVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
