"use server";

import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/rbac";
import { ADMIN_PERMISSIONS } from "@/config/permissions.config";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Check if current user is Super Admin
async function requireSuperAdmin() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  
  if (!session || !isAdmin(session.user)) {
    throw new Error("Unauthorized: Only administrators can perform system actions.");
  }

  // Double check admin profile for Super Admin status
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const adminProfile = await db.collection("adminprofiles").findOne({
    userId: new ObjectId(session.user.id),
  });

  if (!adminProfile || !adminProfile.isSuperAdmin) {
    throw new Error("Unauthorized: Only Super Administrators can manage admin accounts.");
  }
}

export async function getAdminsListAction() {
  await requireSuperAdmin();

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  // Fetch users with admin role
  const admins = await db.collection("user").find({
    $or: [{ role: "admin" }, { roles: "admin" }]
  }).toArray();

  // Fetch corresponding admin profiles
  const adminIds = admins.map(a => a._id);
  const profiles = await db.collection("adminprofiles").find({
    userId: { $in: adminIds }
  }).toArray();

  const results = admins.map(admin => {
    const profile = profiles.find(p => p.userId.toString() === admin._id.toString());
    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      status: admin.status,
      createdAt: admin.createdAt,
      isSuperAdmin: profile?.isSuperAdmin || false,
      permissions: profile?.permissions || [],
      department: profile?.department || "Operations",
    };
  });

  return { success: true, data: results };
}

export async function upsertAdminAction(data: {
  id?: string;
  email: string;
  name: string;
  password?: string;
  isSuperAdmin: boolean;
  permissions: string[];
  department: string;
}) {
  await requireSuperAdmin();

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const emailLower = data.email.trim().toLowerCase();
  
  let userId = data.id ? new ObjectId(data.id) : null;

  if (userId) {
    // Update existing user
    await db.collection("user").updateOne(
      { _id: userId },
      { $set: { name: data.name, email: emailLower } }
    );
  } else {
    // Create or upgrade user
    const existingUser = await db.collection("user").findOne({ email: emailLower });
    
    if (existingUser) {
      userId = existingUser._id;
      // Upgrade existing user
      await db.collection("user").updateOne(
        { _id: userId },
        { $set: { name: data.name, role: "admin", roles: ["admin"], status: "active" } }
      );
    } else {
      // Create new user (Simulate better-auth account creation at basic level)
      // Usually it's better to use auth.api.signUpEmail on server if possible.
      const newUser = {
        name: data.name,
        email: emailLower,
        emailVerified: true,
        role: "admin",
        roles: ["admin"],
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const insertRes = await db.collection("user").insertOne(newUser);
      userId = insertRes.insertedId;
      
      if (data.password) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        await db.collection("account").insertOne({
          userId: userId.toString(),
          providerId: "credential",
          accountId: userId.toString(),
          issuer: "local:credential",
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  if (!userId) throw new Error("Failed to resolve user identity");

  // Ensure Admin Profile
  const profilePayload = {
    userId,
    isSuperAdmin: data.isSuperAdmin,
    permissions: data.isSuperAdmin ? Object.values(ADMIN_PERMISSIONS) : data.permissions,
    department: data.department || "Operations",
    updatedAt: new Date(),
  };

  await db.collection("adminprofiles").updateOne(
    { userId },
    { $set: profilePayload, $setOnInsert: { createdAt: new Date(), __v: 0 } },
    { upsert: true }
  );

  // If password was provided for existing, update it
  if (data.id && data.password) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    await db.collection("account").updateOne(
      { userId: userId.toString(), providerId: "credential" },
      { $set: { password: passwordHash, issuer: "local:credential", updatedAt: new Date() } }
    );
  }

  revalidatePath("/admin/system-management/admins", "page");
  return { success: true, message: "Admin saved successfully." };
}

export async function removeAdminPrivilegesAction(id: string) {
  await requireSuperAdmin();

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const userId = new ObjectId(id);

  // We do not delete the user, just strip the admin role and profile
  await db.collection("user").updateOne(
    { _id: userId },
    { $set: { role: "customer", roles: ["customer"] } }
  );

  await db.collection("adminprofiles").deleteOne({ userId });

  revalidatePath("/admin/system-management/admins", "page");
  return { success: true, message: "Admin privileges revoked successfully." };
}
