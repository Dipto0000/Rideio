import bcrypt from "bcryptjs";
import { envVars } from "../config/env.js";
import { User } from "../modules/user/user.model.js";
import { Role, SubRole, UserStatus } from "../modules/user/user.interface.js";
import type { IAuthProvider } from "../modules/user/user.interface.js";

/**
 * Seed or update the SUPER_ADMIN user.
 * Called automatically during server startup — no need to run manually.
 * Since the super admin email is a Google account, they can sign in via
 * Google as well — the google-auth endpoint will add the Google provider
 * to `auths` on first Google sign-in.
 */	export async function seedSuperAdmin(): Promise<void> {
	    const email = envVars.SUPER_ADMIN_EMAIL;
	    const password = envVars.SUPER_ADMIN_PASSWORD;
	
	    if (!email || !password) {
	        console.log("⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set — skipping super admin seed");
	        return;
	    }
	
	    // Check if ANY super admin already exists in the system
	    const existingSuperAdmin = await User.findOne({ role: Role.SUPER_ADMIN });
	    if (existingSuperAdmin) {
	        console.log(`✅ Super admin already exists (${existingSuperAdmin.email}) — skipping seed`);
	        return;
	    }
	
	    const existing = await User.findOne({ email });
	
	    if (existing) {
	        existing.role = Role.SUPER_ADMIN;
	        existing.isVerified = true;
	        existing.status = UserStatus.ACTIVE;
	
	        // Ensure credentials auth provider exists
	        const hasCredentials = existing.auths?.some(
	            (a: IAuthProvider) => a.provider === "credentials"
	        );
	        if (!hasCredentials) {
	            existing.auths.push({ provider: "credentials", providerId: email });
	        }
	
	        await existing.save();
	        console.log(`✅ Super admin created from existing user: ${email}`);
	    } else {
	        const hashedPassword = await bcrypt.hash(password, Number(envVars.BCRYPT_SALT_ROUND) || 12);
	        await User.create({
	            name: "Super Admin",
	            email,
	            password: hashedPassword,
	            role: Role.SUPER_ADMIN,
	            subRole: SubRole.RIDER,
	            status: "ACTIVE",
	            isVerified: true,
	            auths: [{ provider: "credentials", providerId: email }],
	            subscription: { isSubscribed: false },
	            notificationSettings: {
	                pushEnabled: true,
	                emailEnabled: true,
	                smsEnabled: false,
	            },
	        });
	        console.log(`✅ Super admin created: ${email}`);
	    }
	}
