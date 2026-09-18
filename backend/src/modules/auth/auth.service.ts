import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from 'mssql';

import { env } from '../../config/env.js';
import { getDatabasePool } from '../../database/connection.js';
import type {
  LoginBody,
  RegisterBody,
} from './auth.schemas.js';
type UserRole = 'DRIVER' | 'ADMIN';

type RegisteredUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
};

export type AuthResult = {
  token: string;
  user: RegisteredUser;
};

export class RegistrationConflictError extends Error {
  constructor(
    public readonly field: 'email' | 'plateNumber',
  ) {
    const message =
      field === 'email'
        ? 'Bu e-posta adresi zaten kullanılıyor.'
        : 'Bu plaka zaten kullanılıyor.';

    super(message);
    this.name = 'RegistrationConflictError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-posta veya şifre hatalı.');
    this.name = 'InvalidCredentialsError';
  }
}

export async function registerDriver(
  data: RegisterBody,
): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  let transactionStarted = false;
  let user: RegisteredUser;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const duplicateResult = await new sql.Request(transaction)
      .input('email', sql.NVarChar(320), data.email)
      .input('plateNumber', sql.NVarChar(20), data.plateNumber)
      .query<{
        emailExists: number;
        plateExists: number;
      }>(`
        SELECT
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM dbo.users
              WHERE email = @email
            )
            THEN 1
            ELSE 0
          END AS emailExists,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM dbo.vehicles
              WHERE plate_number = @plateNumber
            )
            THEN 1
            ELSE 0
          END AS plateExists;
      `);

    const duplicate = duplicateResult.recordset[0];

    if (duplicate?.emailExists === 1) {
      throw new RegistrationConflictError('email');
    }

    if (duplicate?.plateExists === 1) {
      throw new RegistrationConflictError('plateNumber');
    }

    const userResult = await new sql.Request(transaction)
      .input('fullName', sql.NVarChar(150), data.fullName)
      .input('email', sql.NVarChar(320), data.email)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .input('role', sql.VarChar(20), 'DRIVER')
      .query<RegisteredUser>(`
        INSERT INTO dbo.users (
          full_name,
          email,
          password_hash,
          role
        )
        OUTPUT
          INSERTED.id AS id,
          INSERTED.full_name AS fullName,
          INSERTED.email AS email,
          INSERTED.role AS role
        VALUES (
          @fullName,
          @email,
          @passwordHash,
          @role
        );
      `);

    const createdUser = userResult.recordset[0];

    if (!createdUser) {
      throw new Error('Kullanıcı kaydı oluşturulamadı.');
    }

    user = createdUser;

    await new sql.Request(transaction)
      .input('plateNumber', sql.NVarChar(20), data.plateNumber)
      .input('driverId', sql.Int, user.id)
      .query(`
        INSERT INTO dbo.vehicles (
          plate_number,
          driver_id
        )
        VALUES (
          @plateNumber,
          @driverId
        );
      `);

    await transaction.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Transaction rollback failed:', rollbackError);
      }
    }

    throw error;
  }

  const token = jwt.sign(
    {
      role: user.role,
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '8h',
      subject: String(user.id),
    },
  );

  return {
    token,
    user,
  };
}
export async function loginUser(
  data: LoginBody,
): Promise<AuthResult> {
  const pool = await getDatabasePool();

  const userResult = await pool
    .request()
    .input('email', sql.NVarChar(320), data.email)
    .query<RegisteredUser & { passwordHash: string }>(`
      SELECT TOP (1)
        id,
        full_name AS fullName,
        email,
        role,
        password_hash AS passwordHash
      FROM dbo.users
      WHERE email = @email;
    `);

  const databaseUser = userResult.recordset[0];

  if (!databaseUser) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    databaseUser.passwordHash,
  );

  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  const {
    passwordHash: _passwordHash,
    ...user
  } = databaseUser;

  const token = jwt.sign(
    {
      role: user.role,
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '8h',
      subject: String(user.id),
    },
  );

  return {
    token,
    user,
  };
}