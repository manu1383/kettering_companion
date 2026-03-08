import { onAuthStateChanged, User } from "@firebase/auth";
import { arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { createContext, ReactNode, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  setUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkOfficerStatus = async (currentUser: User) => {
    try {
      const clubsSnapshot = await getDocs(collection(db, "clubs"));

      for (const clubDoc of clubsSnapshot.docs) {
        const club = clubDoc.data();

        if (
          club.contactEmail &&
          club.contactEmail.toLowerCase() === currentUser.email?.toLowerCase()
        ) {
          // Add user as officer in the club
          await updateDoc(doc(db, "clubs", clubDoc.id), {
            officers: arrayUnion(currentUser.uid),
          });

          // Update the user's role
          await updateDoc(doc(db, "users", currentUser.uid), {
            role: "officer",
            clubsManaging: arrayUnion(clubDoc.id),
          });
        }
      }
    } catch (error) {
      console.error("Officer check failed:", error);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole("student");
        }
        await checkOfficerStatus(currentUser);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
