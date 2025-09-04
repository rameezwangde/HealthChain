"use client";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { firebaseApp } from "../firebase/app";

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Optional: request profile & email (default scopes already include these)
googleProvider.addScope("email");
googleProvider.addScope("profile");

// Optional but recommended: keep session after refresh
setPersistence(auth, browserLocalPersistence);
