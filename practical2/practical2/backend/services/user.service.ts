import bcrypt from "bcrypt";
import { authenticator } from "otplib";

import type {DB} from "../db/db";
import type {UUID} from "../types";
import type {OtpSecret, ValidateEmailOption, CreateUserDTO, ValidatePasswordOption} from "../types/user.types";

export const EMAIL_MAX_LEN = 254;
export const LOCAL_MAX_LEN = 64;

export async function getGuestRoleId(db: DB): Promise<UUID> {
    const row = await db.get<{ role_id: UUID }>(
        `SELECT role_id FROM roles WHERE role_name = ?`,
        ["Guest"]
    );
    if (!row) throw new Error("Guest role not found. Seed roles first.");
    return row.role_id;
}

export function validateAndNormalizeEmail(raw: string): ValidateEmailOption {
    const email: string = raw.trim().toLowerCase();
    if (email.length === 0) {
        return { ok: false, error: "Email is required" };
    }

    if (email.length > EMAIL_MAX_LEN) {
        return { ok: false, error: "Email too long" };
    }

    const parts : string[] = email.split("@");
    if (parts.length !== 2) {
        return { ok: false, error: "Invalid email format" };
    }

    const [local, domain] = parts;
    if (local && (local.length === 0 || local.length > LOCAL_MAX_LEN)) {
        return { ok: false, error: "Invalid email length" };
    }

    const emailRe = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i;
    if (!emailRe.test(email)) {
        return { ok: false, error: "Invalid email format" };
    }

    if (domain && domain.split(".").some(lbl => lbl.length === 0 || lbl.length > 63)) {
        return { ok: false, error: "Invalid domain label length" };
    }

    return { ok: true, email };
}

// Password policy: ≥8 and <50 chars, ≥1 digit, ≥1 special char
export function validatePassword(pw: string): ValidatePasswordOption {
    const errors: string[] = [];
    if (pw.length < 8) {
        errors.push("Must be at least 8 characters");
    }

    if (pw.length >= 50) {
        errors.push("Must be less than 50 characters");
    }

    if (!/[0-9]/.test(pw)) {
        errors.push("Must include at least one number");
    }

    if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pw)) {
        errors.push("Must include at least one special character");
    }

    return errors.length ? { ok: false, errors } : { ok: true };
}

export async function hashPassword(plain: string, cost = 12): Promise<string> {
    return bcrypt.hash(plain, cost);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

export function generateTotpSecret(email: string, issuer = "Hayley"): OtpSecret {
    const secret = authenticator.generateSecret();
    const url = authenticator.keyuri(email, issuer, secret);
    return { secret, url };
}

export function verifyTotpToken(secret: string, token: string): boolean {
    return authenticator.verify({ token, secret });
}

export function validateCreateUserDto(body: any) : { ok: boolean, error?: string, data?: CreateUserDTO } {
    if (typeof body.first_name !== "string" || body.first_name.trim() === "") {
        return { ok: false, error: "Invalid first name" }
    }

    if (typeof body.last_name !== "string" || body.last_name.trim() === "") {
        return { ok: false, error: "Invalid last name" }
    }

    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return { ok: false, error: "Invalid email" };
    }

    if (typeof body.password !== "string" || body.password.length < 8) {
        return { ok: false, error: "Password must be at least 8 characters" };
    }

    return { ok: true, data: body as CreateUserDTO };
}
