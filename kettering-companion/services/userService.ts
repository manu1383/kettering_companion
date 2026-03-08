import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Officer } from "../types/club";

export class UserService {
  static async findUserByEmail(email: string) {
      const q = query(
          collection(db, "users"),
          where("email", "==", email)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0];
  };

  static async getOfficersFromIds(ids: string[]): Promise<Officer[]> {

    const officers = await Promise.all(
      ids.map(async (uid) => {

        const userDoc = await getDoc(doc(db,"users",uid));

        if (!userDoc.exists()) return null;

        return {
          uid,
          ...(userDoc.data() as Omit<Officer,"uid">)
        };

      })
    );

    return officers.filter(Boolean) as Officer[];
    
  };
}
