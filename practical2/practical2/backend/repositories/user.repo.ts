import { randomUUID } from 'crypto';
import {authenticator} from 'otplib';

import type { DB } from "../db/db"
import type { UUID, Email } from "../types";
import { userFromRow } from "../types";
import {
    generateTotpSecret,
    getGuestRoleId,
    hashPassword,
    validateAndNormalizeEmail,
    validatePassword,
    verifyPassword
} from "../services/user.service"
import type {User, UsersRow} from "../db/types";
import type {
    ApproveUserDto,
    CreateUserDTO, MfaResponse,
    RequestOption, RequestUserOption, UpdateFailedUserSignInDto,
    UpdateUserRoleDto,
    UpdateUserSignInDto, UserLoginDto, ValidateMfaDto, ValidateOtpDto
} from "../types/user.types";

import {getRoleById} from "../services/role.service";


export async function getUserById(db: DB, userId: UUID): Promise<User | null> {
    const row = await db.get<UsersRow>(
        'SELECT * FROM users WHERE user_id = ?', [userId]
    );

    return row ? userFromRow(row) : null;
}

export async function getUserByEmail(db: DB, email: Email): Promise<User | null> {
    const row = await db.get<UsersRow>(
        `SELECT * FROM users WHERE email = ?`,
        [email.toLowerCase()]
    );
    return row ? userFromRow(row) : null;
}

export async function createUser(db: DB, dto: CreateUserDTO): Promise<MfaResponse> {

    const validated_email = validateAndNormalizeEmail(dto.email);
    if (!validated_email.ok) {
        return { ok: false, error: "Invalid email address" };
    }
    const email = validated_email.email as Email;

    const validate_psw = validatePassword(dto.password);
    if (!validate_psw.ok) {
        return { ok: false, error: "Invalid password" };
    }

    const psw_hash = await hashPassword(dto.password);

    const uuid = randomUUID();
    const { secret, url } = generateTotpSecret(email);
    const guest_role_id = await getGuestRoleId(db);


    await db.run(
        `INSERT INTO users (
       user_id, first_name, last_name, email, password_hash,
       created_at, is_approved, sign_in_count, failed_login_attempts,
       role_id, mfa_totp_secret 
     ) VALUES (?, ?, ?, ?, ?, unixepoch(), false, 0, 0, ?, ?)`,
        [
            uuid, dto.first_name, dto.last_name, email, psw_hash, guest_role_id, secret
        ]
    );

    return {
        ok: true,
        user_email: email,
        url: url
    };
}

export async function updateUserRole(db: DB, dto: UpdateUserRoleDto) : Promise<RequestOption> {
    const role = await getRoleById(db,dto.role_id);
    const user = await getUserById(db,dto.user_id);
    if (!role) {
        return { ok: false, error: "Role not found." };
    }
    if (!user) {
        return { ok: false, error: "User not found." };
    }

    await db.run('UPDATE users SET role_id = ? WHERE user_id = ?', [dto.role_id, dto.user_id])

    return { ok: true };
}

export async function approveUser(db: DB, dto: ApproveUserDto) : Promise<RequestOption> {
    const user = await getUserById(db,dto.user_id);
    if (!user) {
        return { ok: false, error: "User not found." };
    }

    await db.run('UPDATE users SET is_approved = 1 WHERE user_id = ?', [dto.user_id])

    return { ok: true };
}

export async function bumpLoginSuccess(db: DB, dto: UpdateUserSignInDto): Promise<RequestOption> {
    const user = await getUserById(db,dto.user_id);
    if (!user) {
        return { ok: false, error: "User not found." };
    }

    await db.run(`UPDATE users SET 
                                   failed_login_attempts = 0, 
                                   sign_in_count = sign_in_count + 1, 
                                   last_login = unixepoch(), 
                                   last_sign_in_ip = current_sign_in_ip, 
                                   current_sign_in_ip = ? 
                  WHERE user_id = ?`,
        [dto.current_ip, dto.user_id]
    );

    return { ok: true };
}

export async function bumpLoginFailure(db: DB, dto: UpdateFailedUserSignInDto): Promise<RequestOption> {
    const user = await getUserById(db,dto.user_id);
    if (!user) {
        return { ok: false, error: "User not found." };
    }
    await db.run(`UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?`, [dto.user_id]);
    return { ok: true };
}

export async function login(db: DB, dto: UserLoginDto): Promise<RequestUserOption> {
    const user: User | null = await getUserByEmail(db,dto.user_email);
    if (!user) {
        return { ok: false, error: "User not found." };
    }

    const isSetup = await isMfaSetup(db, user.userId);
    if (!isSetup) {
        return { ok: false, error: "MFA not setup" };
    }

    const isValidPassword = await verifyPassword(dto.password, user.passwordHash);

    if (!isValidPassword) {
        return { ok: false, error: "Password does not match." };
    }

    return { ok: true, user };
}

export async function validateUserOtp(db: DB, dto: ValidateOtpDto) : Promise<RequestUserOption> {
    const user: User | null = await getUserByEmail(db,dto.user_email);
    if (!user) {
        return { ok: false, error: "User not found." };
    }

    const otp = dto.otp.trim();

    if (user && user.mfaTotpSecret) {
        const ok = authenticator.verify({ token: otp, secret: user.mfaTotpSecret });
        if (!ok) {
            await bumpLoginFailure(db,{user_id: user.userId});
            return { ok: false, error: "Invalid OTP." };
        }
    }

    await bumpLoginSuccess(db,{user_id: user.userId, current_ip: dto.current_ip});
    return { ok: true, user };
}

export async function validateMfa(db: DB, dto: ValidateMfaDto) : Promise<RequestOption> {
    const user: User | null = await getUserByEmail(db,dto.user_email);
    if (!user) {
        return { ok: false, error: "User not found." };
    }

    const ok = authenticator.verify({ token: dto.token.trim(), secret: user.mfaTotpSecret });
    if (!ok)  {
        return { ok: false, error: "Invalid OTP." };
    }

    await db.run(`UPDATE users SET mfa_enrolled_at = unixepoch() WHERE user_id = ?`, [user.userId]);

    return { ok: true };
}

export async function isMfaSetup(db: DB, userId: UUID): Promise<boolean> {
    const row = await db.get<{ ok: number }>(
        `SELECT EXISTS(
            SELECT 1 FROM users
            WHERE user_id = ?
              AND mfa_enrolled_at IS NOT NULL
        ) AS ok`,
        [userId]
    );
    return !!row && row.ok === 1;
}
